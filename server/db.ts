import mongoose from 'mongoose';

const FALLBACK_MONGODB_URI =
  'mongodb+srv://pavitarkumarai_db_user:DogyJwcoGoBsPmgV@cluster0.iq4gpaf.mongodb.net/indistay?retryWrites=true&w=majority';

let isConnected = false;

export async function connectBackendDatabase(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const uri = process.env.MONGODB_URI || FALLBACK_MONGODB_URI;

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });

    isConnected = true;
    console.log(`[IndiStay DB] Connected to MongoDB Atlas successfully (Pool size: 10-50)`);
    return conn;
  } catch (error) {
    console.error('[IndiStay DB] Connection failed:', error);
    throw error;
  }
}

export async function disconnectBackendDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[IndiStay DB] Disconnected gracefully');
  }
}
