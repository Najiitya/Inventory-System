const express = require('express');
const cors = require('cors');
require('dotenv').config();

const partRoutes = require('./routes/partRoutes');

const app = express();

// Middleware
app.use(cors()); // Allows your React frontend to communicate with this API
app.use(express.json()); // Parses incoming JSON data

// Routes
app.use('/api/parts', partRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});