
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import facultyRoutes from "./routes/facultyRoutes.js";
import classroomRoutes from "./routes/classroomRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import rlRoutes from "./routes/rlRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:3000,http://127.0.0.1:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));

// Middleware to parse JSON request bodies
app.use(express.json({ limit: "1mb" }));

// API routes
app.use("/api/faculty", facultyRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/rl", rlRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Campus Management API is running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

app.use((error, req, res, next) => {
  console.error(error.message);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
