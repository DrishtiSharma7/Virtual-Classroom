const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("Connecting to MongoDB...");

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB Connected");
    console.log("Host:", conn.connection.host);
  } catch (error) {
    console.error("MongoDB Error:");
    console.error(error);
  }
};

module.exports = connectDB;
