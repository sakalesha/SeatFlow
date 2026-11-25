import express from "express";
import morgan from "morgan";
import pool from "./db/index.js";
import logger from "./utils/logger.js";

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    message: "SeatFlow API is running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({
      status: "error",
      error: err.message || err.code || "DB connection failed",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  logger.error({ err }, "Unhandled request error");
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

export default app;
