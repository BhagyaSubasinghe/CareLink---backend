require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 MongoDB Connection Test\n');

// Extract connection details
const uri = process.env.MONGO_URI;
console.log('Connection String:', uri ? uri.replace(/:[^:]+@/, ':***@') : 'NOT SET');
console.log('Environment:', process.env.NODE_ENV);
console.log('');

if (!uri) {
  console.error('❌ MONGO_URI is not set in .env file');
  process.exit(1);
}

// Test connection with detailed logging
const connectTest = async () => {
  try {
    console.log('📡 Attempting to connect to MongoDB Atlas...\n');
    
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
    });

    console.log('✅ Successfully connected to MongoDB!');
    console.log('   Host:', connection.connection.host);
    console.log('   Port:', connection.connection.port);
    console.log('   Database:', connection.connection.db.s.namespace.db);
    console.log('\n✅ Your connection string is working correctly!\n');
    
    // List collections as proof
    const collections = await connection.connection.db.listCollections().toArray();
    console.log('📚 Existing collections:', collections.length);
    collections.forEach(col => console.log('   -', col.name));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection Error Details:\n');
    console.error('Error Type:', error.code || error.name);
    console.error('Error Message:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n🔧 Fix: DNS cannot resolve the MongoDB host.');
      console.error('   → Check your internet connection');
      console.error('   → Verify IP whitelist in MongoDB Atlas (Network Access)');
      console.error('   → Try: nslookup cluster0.tux7n50.mongodb.net');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Fix: Connection refused. Check if host is reachable.');
    } else if (error.code === 'ERR_INVALID_DB_NAME') {
      console.error('\n🔧 Fix: Database name issue. Verify "/carelink" is in your connection string.');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n🔧 Fix: Authentication failed. Check username and password.');
    }
    
    process.exit(1);
  }
};

connectTest();
