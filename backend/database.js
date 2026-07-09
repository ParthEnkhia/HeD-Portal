import mongoose from "mongoose";

let connectionPromise;

export const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === "production";

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing.");
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing.");
  }
  if (isProduction && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters.");
  }
  if (
    isProduction &&
    (!process.env.ADMIN_SIGNUP_KEY || process.env.ADMIN_SIGNUP_KEY.length < 12)
  ) {
    throw new Error("ADMIN_SIGNUP_KEY must be at least 12 characters.");
  }
};

export const connectDatabase = async () => {
  validateEnvironment();

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        dbName: process.env.MONGO_DB_NAME || "hed-portal",
        serverSelectionTimeoutMS: 10000
      })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  await connectionPromise;
  return mongoose.connection;
};
