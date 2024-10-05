const jwt = require('jsonwebtoken');
const User = require('../models/User');
   
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (error) {
    console.log("error",error);
    res.status(401).json({ error: 'Please authenticate' });
  }
};

module.exports = authenticate;