const express = require('express');
const router = express.Router();
const { getAllParts, updateStock, exportToExcel } = require('../controllers/partController');

// Export route MUST be defined before /:id routes so Express doesn't confuse 'export' with an ID
router.get('/export', exportToExcel);

// Fetch all items
router.get('/', getAllParts);

// Update stock (+ or -)
router.patch('/:id/stock', updateStock);

module.exports = router;