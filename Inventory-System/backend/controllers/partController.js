const pool = require('../config/db');
const ExcelJS = require('exceljs');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');

const getAllParts = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM parts ORDER BY id ASC;');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching inventory' });
  }
};

const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { change, side } = req.body; 
    
    const column = side === 'left' ? 'left_qty' : side === 'right' ? 'right_qty' : 'qty';

    const query = `
      UPDATE parts 
      SET ${column} = ${column} + $1 
      WHERE id = $2 
      RETURNING *;
    `;
    
    const { rows } = await pool.query(query, [change, id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Part not found' });
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(400).json({ error: 'Cannot update stock.' });
  }
};

const exportToExcel = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM parts ORDER BY id ASC;');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Current Inventory');

    worksheet.columns = [
      { header: 'Part ID', key: 'id', width: 10 },
      { header: 'PRODUCT NAME', key: 'product_name', width: 45 },
      { header: 'LEFT QTY', key: 'left_qty', width: 15 },
      { header: 'RIGHT QTY', key: 'right_qty', width: 15 },
      { header: 'QTY', key: 'qty', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    rows.forEach((part) => worksheet.addRow(part));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'Inventory_Report.xlsx');
    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
};

const addPart = async (req, res) => {
  try {
    const { product_name, left_qty, right_qty, qty } = req.body;
    const query = `
      INSERT INTO parts (product_name, left_qty, right_qty, qty) 
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const { rows } = await pool.query(query, [product_name, left_qty || 0, right_qty || 0, qty || 0]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add part' });
  }
};

const deletePart = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM parts WHERE id = $1;', [id]);
    res.status(200).json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
};

const deleteAllParts = async (req, res) => {
  try {
    await pool.query('DELETE FROM parts;');
    res.status(200).json({ message: 'All deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to wipe' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid auth' });
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const upload = multer({ dest: 'uploads/' });

const importCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
  const results = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      results.push({
        product_name: data['PRODUCT NAME'] || 'Unknown Part',
        left_qty: parseInt(data['LEFT QTY']) || 0,
        right_qty: parseInt(data['RIGHT QTY']) || 0,
        qty: parseInt(data['QTY']) || 0
      });
    })
    .on('end', async () => {
      try {
        for (const item of results) {
          await pool.query(
            'INSERT INTO parts (product_name, left_qty, right_qty, qty) VALUES ($1, $2, $3, $4)',
            [item.product_name, item.left_qty, item.right_qty, item.qty]
          );
        }
        fs.unlinkSync(req.file.path);
        res.status(200).json({ message: `Successfully imported items.` });
      } catch (error) {
        res.status(500).json({ error: 'Database error' });
      }
    });
};

module.exports = { 
  getAllParts, updateStock, exportToExcel, addPart, deletePart, deleteAllParts, loginUser, importCSV, upload 
};