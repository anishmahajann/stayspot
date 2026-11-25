import mongoose from 'mongoose';

let isAtlasConnection = false;
let listenersAttached = false;

const attachConnectionListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Connection lost.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err);
  });
};

/**
 * Connect to MongoDB Atlas (replica set) or local MongoDB instance.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stayspot';
  isAtlasConnection = uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net');

  try {
    let conn;
    try {
      conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        maxPoolSize: 10,
      });
    } catch (v4Err) {
      if (isAtlasConnection) {
        console.log('[MongoDB Atlas] IPv4 unavailable/not whitelisted, connecting via IPv6...');
        await mongoose.disconnect().catch(() => {});
        conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          family: 6,
          maxPoolSize: 10,
        });
      } else {
        throw v4Err;
      }
    }

    attachConnectionListeners();
    const label = isAtlasConnection ? 'MongoDB Atlas' : 'MongoDB Local';
    console.log(`[${label}] Connected to database: ${conn.connection.name} at ${conn.connection.host}`);
    return conn;
  } catch (error) {
    attachConnectionListeners();
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

export default connectDB;
