import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("render.com") ? { rejectUnauthorized: false } : false,
});

// Safety check — pass --confirm flag to actually run
if (!process.argv.includes("--confirm")) {
  console.log("⚠️  This will DELETE all users and reset all seats.");
  console.log("    Run with --confirm to proceed:");
  console.log("    node reset-db.mjs --confirm");
  await pool.end();
  process.exit(0);
}

try {
  // Clear all users
  await pool.query("DELETE FROM users");
  console.log("🗑️   All users deleted");

  // Reset all seats — unbook and clear names
  await pool.query("UPDATE seats SET isbooked = 0, name = NULL");
  console.log("🗑️   All seats reset to available");

  console.log("✅  Database reset complete. Run node migrate.mjs if you need to re-seed.");
} catch (err) {
  console.error("❌  Reset failed:", err.message);
} finally {
  await pool.end();
}
