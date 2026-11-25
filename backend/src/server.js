import "dotenv/config";
import app from "./app.js";
import pool from "./db/index.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
  try {
    await pool.query("SELECT NOW()");
    logger.info("Connected to PostgreSQL");
  } catch (err) {
    logger.error(`Failed to connect to PostgreSQL: ${err.message}`);
  }
});
