
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;
let retryTimer = null;

function scheduleReconnect() {
  if (retryTimer) return;

  retryTimer = setTimeout(async () => {
    retryTimer = null;
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) return;
    await connectDB();
  }, 10000);
}

const connectDB = async () => {
  if (!mongoURI) {
    console.error("MONGO_URI is not configured");
    return false;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected successfully!");
    return true;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    scheduleReconnect();
    return false;
  }
};

// Log 
const logConnection = () => {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB connection disconnected');
    scheduleReconnect();
  });
};

logConnection();

module.exports = connectDB;
