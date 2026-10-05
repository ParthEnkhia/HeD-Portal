import "../backend/env.js";
import app from "../backend/app.js";
import { connectDatabase } from "../backend/database.js";

export default async function handler(req, res) {
  try {
    await connectDatabase();
    return app(req, res);
  } catch (error) {
    console.error("API startup failed:", error.message);
    return res.status(500).json({ message: "Server configuration or database connection failed" });
  }
}
