import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log("⏳ Connecting to:", process.env.MD_URL);

    await mongoose.connect(process.env.MD_URL, {
      dbName: "chat-app",
      serverSelectionTimeoutMS: 5000, // prevent hanging
    });

    console.log("✅ Database is connected");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};
