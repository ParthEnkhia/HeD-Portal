import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/authRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, "../frontend/dist");
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);

if (isProduction) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }

    return res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use("/api/*", (_req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing. Add it to your .env file.");
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing. Add it to your .env file.");
    }
    if (isProduction && process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be set to at least 32 characters.");
    }
    if (
      isProduction &&
      (!process.env.ADMIN_SIGNUP_KEY || process.env.ADMIN_SIGNUP_KEY.length < 12)
    ) {
      throw new Error("ADMIN_SIGNUP_KEY must be set to at least 12 characters.");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || "hed-portal",
      serverSelectionTimeoutMS: 10000
    });
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received. Closing database connection.`);
  await mongoose.connection.close();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
