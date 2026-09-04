const express = require('express');
const router = express.Router();

// Import the new deleteAllParts function
const { 
  getAllParts, updateStock, exportToExcel, addPart, deletePart, 
  loginUser, importCSV, upload, deleteAllParts 
} = require('../controllers/partController');

router.post('/login', loginUser);
router.post('/import', upload.single('file'), importCSV);

router.get('/export', exportToExcel);
router.get('/', getAllParts);
router.post('/', addPart);
router.patch('/:id/stock', updateStock);

// --- NEW Route: Must be ABOVE the /:id route ---
router.delete('/all', deleteAllParts);

// Existing single delete
router.delete('/:id', deletePart);

module.exports = router;