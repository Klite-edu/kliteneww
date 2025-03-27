require("dotenv").config();
const mongoose = require("mongoose");

// ✅ Ensure environment variable exists
const MONGO_URI = process.env.MONGO_URI; 

// ✅ Connect to MongoDB (Single Database)
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // ✅ Increase timeout to 30 seconds
      socketTimeoutMS: 45000 // ✅ Keep connection alive longer
    });

    console.log("✅ Connected to MongoDB successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1); // Exit process if connection fails
  }
};

// ✅ Run connection function
connectDB();

// ✅ Export mongoose instance
module.exports = mongoose;

