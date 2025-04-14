// api/utils/dbConnect.js
import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
      .then(mongoose => {
        console.log('MongoDB connected successfully');
        return mongoose;
      })
      .catch(error => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;