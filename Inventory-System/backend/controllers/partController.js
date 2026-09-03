const pool = require('../config/db');
const ExcelJS = require('exceljs');

// 1. Fetch all inventory parts
const getAllParts = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM parts ORDER BY id ASC;');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching parts:', error.message);
    res.status(500).json({ error: 'Server error while fetching inventory' });
  }
};

// 2. Increment or Decrement Stock
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { change } = req.body; // Expects { change: 1 } or { change: -1 }

    const query = `
      UPDATE parts 
      SET stock_items = stock_items + $1 
      WHERE id = $2 
      RETURNING *;
    `;
    
    const { rows } = await pool.query(query, [change, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Part not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Stock update failed:', error.message);
    res.status(400).json({ error: 'Cannot update stock. Minimum stock is 0.' });
  }
};

// 3. Export to Excel
const exportToExcel = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM parts ORDER BY id ASC;');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Current Inventory');

    worksheet.columns = [
      { header: 'Part ID', key: 'id', width: 10 },
      { header: 'Part Name', key: 'name', width: 35 },
      { header: 'Brand Name', key: 'brand_name', width: 25 },
      { header: 'Stock Items', key: 'stock_items', width: 15 },
      { header: 'Status', key: 'status', width: 20 },
    ];

    // Style the header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    // Add data dynamically
    rows.forEach((part) => {
      let statusText = 'Available';
      if (part.stock_items === 0) statusText = 'Out of Stock';
      else if (part.stock_items === 1) statusText = 'Low';

      worksheet.addRow({
        id: part.id,
        name: part.name,
        brand_name: part.brand_name,
        stock_items: part.stock_items,
        status: statusText
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'Inventory_Report.xlsx');

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error('Excel export failed:', error.message);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }

  // Add a new part
const addPart = async (req, res) => {
  try {
    const { name, brand_name, stock_items } = req.body;
    
    const query = `
      INSERT INTO parts (name, brand_name, stock_items) 
      VALUES ($1, $2, $3) 
      RETURNING *;
    `;
    
    // Default to 0 if they don't type a starting stock number
    const startStock = stock_items ? parseInt(stock_items) : 0;
    
    const { rows } = await pool.query(query, [name, brand_name, startStock]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding part:', error.message);
    res.status(500).json({ error: 'Failed to add part' });
  }
};

// Delete a part
const deletePart = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM parts WHERE id = $1 RETURNING *;';
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Part not found' });
    }

    res.status(200).json({ message: 'Part deleted', deletedId: id });
  } catch (error) {
    console.error('Error deleting part:', error.message);
    res.status(500).json({ error: 'Failed to delete part' });
  }
}
};

module.exports = { getAllParts, updateStock, exportToExcel, addPart, deletePart };