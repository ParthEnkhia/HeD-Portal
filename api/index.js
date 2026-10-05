import "../backend/env.js";
import app from "../backend/app.js";
import { connectDatabase } from "../backend/database.js";

const configurationErrorMessages = new Set([
  "MONGO_URI is missing.",
  "JWT_SECRET is missing.",
  "JWT_SECRET must be at least 32 characters.",
  "ADMIN_SIGNUP_KEY must be at least 12 characters."
]);

export default async function handler(req, res) {
  try {
    await connectDatabase();
    return app(req, res);
  } catch (error) {
    console.error("API startup failed:", error.message);

    if (configurationErrorMessages.has(error.message)) {
      return res.status(500).json({ message: `Server configuration failed: ${error.message}` });
    }

    return res.status(500).json({
      message: "Database connection failed. Check the MongoDB URI and Atlas Network Access settings."
    });
  }
}
