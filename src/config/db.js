
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

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
  });
};

logConnection();

module.exports = connectDB;
