const express = require('express');
const router = express.Router();

// Import all functions from the updated controller
const { 
  getAllParts, 
  updateStock, 
  exportToExcel, 
  addPart, 
  deletePart, 
  loginUser, 
  importCSV, 
  upload 
} = require('../controllers/partController');

// --- NEW ROUTES ---
// 1. User Login Route
router.post('/login', loginUser);

// 2. CSV Upload Route (uses multer middleware to handle the file upload)
router.post('/import', upload.single('file'), importCSV);


// --- EXISTING ROUTES ---
// Export route MUST be defined before /:id routes
router.get('/export', exportToExcel);

// Fetch all items
router.get('/', getAllParts);

// Add a new item manually
router.post('/', addPart);

// Update stock (+ or -)
router.patch('/:id/stock', updateStock);

// Delete an item
router.delete('/:id', deletePart);

module.exports = router;