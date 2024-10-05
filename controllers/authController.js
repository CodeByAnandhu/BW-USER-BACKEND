const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');


exports.register = async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, phoneNumber, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    
    const { email, password } = req.body;
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    if (!(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid login credentials');
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ token });
  } catch (error) {
    console.log("error", error);
    res.status(400).json({ error: error.message });
  }
};


const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.GOOGLE_PASSWORD,   
  }
});


exports.resetPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');
    
    const resetToken = Math.floor(1000 + Math.random() * 9000).toString();
    const resetTokenExpiry = Date.now() + 3600000; 

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    
    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,              
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${resetToken}. It will expire in 1 hour.`,
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
      }
      console.log('Email sent: ' + info.response);
      res.json({ message: 'Password reset instructions sent to email' });
    });
    
  } catch (error) {
    console.log('Error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("email", email);
    console.log("otp", otp);
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('User not found');
    }
   
    if (user.resetToken !== otp) {
      throw new Error('Invalid OTP');
    }

    if (Date.now() > user.resetTokenExpiry) {
      throw new Error('OTP has expired');
    }
    
    res.json({ message: 'OTP verified successfully. You can now reset your password.' });
    
    await user.save();
    
  } catch (error) {
    console.log('Error:', error);
    res.status(400).json({ error: error.message });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { email,newPassword } = req.body;
    const user = await User.findOne({ email });
   
    if(!user) throw new Error('User not found');
    if(!user.resetToken || !user.resetTokenExpiry || Date.now() > user.resetTokenExpiry) throw new Error('Invalid or expired reset token');
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.log("error", error);
    res.status(400).json({ error: error.message });
  }
};