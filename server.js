require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Example: app.use('/api/users', require('./src/routes/userRoutes'));

// Root endpoint
app.get('/', (req, res) => {
  res.send('CareLink Backend API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
