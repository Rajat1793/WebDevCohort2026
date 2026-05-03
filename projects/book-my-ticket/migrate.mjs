import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("render.com") ? { rejectUnauthorized: false } : false,
});

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seats (
      id       SERIAL PRIMARY KEY,
      name     VARCHAR(255),
      isbooked INT DEFAULT 0
    );
  `);
  // seed only if table is empty
  const { rowCount } = await pool.query("SELECT 1 FROM seats LIMIT 1");
  if (rowCount === 0) {
    const seatCount = parseInt(process.env.SEAT_COUNT) || 50;
    await pool.query(`INSERT INTO seats (isbooked) SELECT 0 FROM generate_series(1, ${seatCount})`);
    console.log(`✅  seats table created and seeded with ${seatCount} rows`);
  } else {
    console.log("✅  seats table already exists");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      VARCHAR(50)  UNIQUE NOT NULL,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at    TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("✅  users table created (or already exists)");
} catch (err) {
  console.error("❌  Migration failed:", err.message);
} finally {
  await pool.end();
}
