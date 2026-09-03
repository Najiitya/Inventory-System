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
};

module.exports = { getAllParts, updateStock, exportToExcel };