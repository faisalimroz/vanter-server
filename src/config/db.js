import mongoose from 'mongoose';

let memoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI ;
  console.log(`[MongoDB] Attempting to connect to: ${uri}`);
  if (!uri) {
    throw new Error('MONGODB_URI is undefined. Check your .env file path!');
  }
  // const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vantero';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB] Primary connection failed (${err.message}).`);
    
    // In development, attempt to spin up an in-memory MongoDB fallback
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[MongoDB] Starting MongoMemoryServer development fallback...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[MongoDB] Connected to in-memory instance at: ${memUri}`);
        return conn;
      } catch (memErr) {
        console.error('[MongoDB] In-memory server startup failed:', memErr.message);
        throw err;
      }
    } else {
      throw err;
    }
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};
