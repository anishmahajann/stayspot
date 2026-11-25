import mongoose from 'mongoose';

let isAtlasConnection = false;

/**
 * Connect to MongoDB Atlas (replica set) or local MongoDB instance.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stayspot';
  isAtlasConnection = uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    const label = isAtlasConnection ? 'MongoDB Atlas' : 'MongoDB Local';
    console.log(`[${label}] Connected to database: ${conn.connection.name} at ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Database connection error: ${error.message}`);
    throw error;
  }
};

export const getDBStatus = () => ({
  connected: mongoose.connection.readyState === 1,
  state: mongoose.connection.readyState,
  host: mongoose.connection.host || null,
  database: mongoose.connection.name || null,
  isAtlas: isAtlasConnection,
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection lost. Reconnecting...');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err);
});

export default connectDB;
