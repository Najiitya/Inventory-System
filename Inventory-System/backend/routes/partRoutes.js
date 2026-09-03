const express = require('express');
const router = express.Router();
// Import the new functions here
const { getAllParts, updateStock, exportToExcel, addPart, deletePart } = require('../controllers/partController');

router.get('/export', exportToExcel);
router.get('/', getAllParts);
router.patch('/:id/stock', updateStock);

// Add the new routes here
router.post('/', addPart);
router.delete('/:id', deletePart);

module.exports = router;