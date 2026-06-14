require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { errorHandler } = require('./src/shared/middlewares/errorHandler');

const app = express();
const DEFAULT_LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/carelink';

const isAtlasConnectionString = (uri) => /mongodb(\+srv)?:\/\/[^\s]*mongodb\.net/i.test(uri);

const connectToMongo = async (uri) => {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000,
  });
};

const initMemoryDB = () => {
  console.warn('⚠️  Using in-memory database stub for development.');
  console.warn('    Data will be lost on restart. For persistence, configure MongoDB.');
  
  mongoose.connection.db = {
    collections: {},
    collection: (name) => ({
      insertOne: async (doc) => ({ insertedId: doc._id || new mongoose.Types.ObjectId() }),
      find: async () => ({ toArray: async () => [] }),
      findOne: async () => null,
      updateOne: async () => ({ modifiedCount: 0 }),
      deleteOne: async () => ({ deletedCount: 0 }),
    })
  };
  
  mongoose.connection.readyState = 1;
  mongoose.connection._db = true;
};

/**
 * Database Connection
 */
const connectDB = async () => {
  
  const uri = 'mongodb+srv://chamodi2002bhagya_db_user:dVc6Uxfq7FnAUkp@cluster0.tux7n50.mongodb.net/carelink?retryWrites=true&w=majority';
  const fallbackUri = process.env.MONGO_FALLBACK_URI?.trim() || DEFAULT_LOCAL_MONGO_URI;
  const allowFallback = process.env.NODE_ENV !== 'production' && process.env.ALLOW_LOCAL_DB_FALLBACK !== 'false';

  if (!uri) {
    if (!allowFallback) {
      console.error('❌ MONGO_URI not set in environment.');
      process.exit(1);
    }

    console.warn(`⚠️ MONGO_URI not set in environment. Falling back to ${fallbackUri}`);

    try {
      await connectToMongo(fallbackUri);
      console.log(`✅ MongoDB connected successfully (${fallbackUri})`);
      return;
    } catch (fallbackErr) {
      console.error('❌ MongoDB connection error:', fallbackErr.message);
      console.error('   Set MONGO_URI in .env or start a local MongoDB instance.');
      process.exit(1);
    }
  }

  try {
    await connectToMongo(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);

    if (allowFallback && isAtlasConnectionString(uri) && fallbackUri !== uri) {
      console.warn(`⚠️ Atlas connection failed. Trying local fallback at ${fallbackUri}`);

      await mongoose.disconnect().catch(() => {});

      try {
        await connectToMongo(fallbackUri);
        console.log(`✅ MongoDB connected successfully (${fallbackUri})`);
        return;
      } catch (fallbackErr) {
        console.error('❌ Local MongoDB fallback also failed:', fallbackErr.message);
      }

      console.error('   If you want to use Atlas, whitelist your current IP in the Atlas network access settings.');
      console.error('   Otherwise, start MongoDB locally or set MONGO_FALLBACK_URI to a reachable database.');
    }

    if (process.env.NODE_ENV === 'development' && process.env.USE_MEMORY_DB !== 'false') {
      console.warn('\n⚠️  Starting with in-memory database for development.');
      initMemoryDB();
      return;
    }

    process.exit(1);
  }
};

/**
 * Middleware Configuration
 */

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
  limit: '50mb',
  extended: true
}));

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/**
 * Routes
 */
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CareLink Backend API is running',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString()
  });
});

// Feature Routes
app.use(`${apiPrefix}/auth`, require('./src/features/auth/authRoutes'));
app.use(`${apiPrefix}/doctors`, require('./src/features/doctor/doctorRoutes'));
app.use(`${apiPrefix}/bookings`, require('./src/features/booking/bookingRoutes'));
app.use(`${apiPrefix}/medicines`, require('./src/features/medicine/medicineRoutes'));
app.use(`${apiPrefix}/admin`, require('./routes/adminRoutes'));

// Standalone Appointment Routes (for Queue features matching frontend)
app.use('/api/appointments', require('./src/features/booking/appointmentRoutes'));

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

/**
 * Error Handler
 */
app.use(errorHandler);

/**
 * Server Start
 */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log('\n==================================================');
    console.log('🚀 CareLink Backend Server');
    console.log(`    Running on port: ${PORT}`);
    console.log(`    Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`    API Prefix: ${apiPrefix}`);
    console.log('==================================================\n');
  });

  /**
   * Graceful Shutdown
   */
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');

    server.close(() => {
      console.log('Server closed');

      mongoose.connection.close(false).then(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});