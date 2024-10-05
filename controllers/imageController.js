const Image = require('../models/Image');
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

exports.uploadImages = async (req, res) => {
  try {
    const { titles } = req.body;
    const titlesArray = JSON.parse(titles);

  
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const uploadedImages = await Promise.all(
      req.files.map((file, index) => {
        return new Promise((resolve, reject) => {
        
          imagekit.upload(
            {
              file: file.buffer,  
              fileName: file.originalname,  
              tags: ['user-image'],  
            },
            async (error, result) => {
              if (error) {
                reject(error);
              } else {
                
                const newImage = new Image({
                  userId: req.user._id,
                  title: titlesArray[index],
                  imagePath: result.url,  
                  order: index,
                });

                const savedImage = await newImage.save();
                resolve(savedImage);
              }
            }
          );
        });
      })
    );

    res.status(201).json(uploadedImages);
  } catch (error) {
    console.log("error", error);
    res.status(400).json({ error: error.message });
  }
};
 
exports.getImages = async (req, res) => {
  try {
    const images = await Image.find({ userId: req.user._id }).sort('order');
    res.json(images);
  } catch (error) {
    console.log("error",error);
    res.status(400).json({ error: error.message });
  }
};

exports.reorderImages = async (req, res) => {
  try {
    const { imageOrders } = req.body;
    await Promise.all(
      imageOrders.map(({ imageId, newOrder }) =>
        Image.findOneAndUpdate(
          { _id: imageId, userId: req.user._id }, 
          { order: newOrder } 
        )
      )
    );

    res.json({ message: 'Image order updated successfully' });
  } catch (error) {
    console.log("Error updating image order:", error);
    res.status(400).json({ error: error.message });
  }
};

  
exports.updateImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { title } = req.body;
    const updateData = { title };


    const existingImage = await Image.findOne({ _id: imageId, userId: req.user._id });
    if (!existingImage) throw new Error('Image not found');

    if (req.file) {
      
      const uploadResponse = await new Promise((resolve, reject) => {
        imagekit.upload(
          {
            file: req.file.buffer,
            fileName: req.file.originalname,
            tags: ['user-image'],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });
     
      updateData.imagePath = uploadResponse.url;
     
    }
    
    const updatedImage = await Image.findOneAndUpdate(
      { _id: imageId, userId: req.user._id },
      updateData,
      { new: true }
    );
    
    res.json(updatedImage);
  } catch (error) {
    console.log("Error updating image:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const deletedImage = await Image.findOneAndDelete({ 
      _id: imageId, 
      userId: req.user._id 
    });
    if (!deletedImage) throw new Error('Image not found');
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};