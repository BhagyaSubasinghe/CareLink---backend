require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { errorHandler } = require('./src/shared/middlewares/errorHandler');

const app = express();

/**
 * Database Connection
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('⚠️  MONGO_URI not set in environment; skipping DB connection');
    return;
  }
  try {
    await mongoose.connect(uri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

connectDB();

/**
 * Middleware Configuration
 */

// CORS - Allow requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware (basic)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/**
 * Routes
 */
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'CareLink Backend API is running',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString()
  });
});

// Feature-based Routes
app.use(`${apiPrefix}/auth`, require('./src/features/auth/authRoutes'));
app.use(`${apiPrefix}/doctors`, require('./src/features/doctor/doctorRoutes'));
app.use(`${apiPrefix}/bookings`, require('./src/features/booking/bookingRoutes'));
app.use(`${apiPrefix}/medicines`, require('./src/features/medicine/medicineRoutes'));

// 404 - Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

/**
 * Error Handling Middleware
 */
app.use(errorHandler);

/**
 * Server Start
 */
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 CareLink Backend Server`);
  console.log(`   Running on port: ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API Prefix: ${apiPrefix}`);
  console.log(`${'='.repeat(50)}\n`);
});

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
