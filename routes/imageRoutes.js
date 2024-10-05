const express = require('express'); 
const router = express.Router();
const imageController = require('../controllers/imageController');  
const authenticate = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', authenticate, upload.array('images'), imageController.uploadImages);
router.get('/', authenticate, imageController.getImages);
router.patch('/reorder', authenticate, imageController.reorderImages);
router.patch('/:imageId', authenticate, upload.single('image'), imageController.updateImage);
router.delete('/:imageId', authenticate, imageController.deleteImage);

module.exports = router;