import { Router } from "express";
import pool from "../db/pool.mjs";
import authenticate from "../middleware/auth.middleware.mjs";

const router = Router();

// get all seats
router.get("/seats", async (req, res) => {
  const result = await pool.query("SELECT * FROM seats"); // equivalent to Seats.find() in mongoose
  res.send(result.rows);
});

// protected book a seat endpoint - requires JWT token
// :name in URL is kept for API compatibility but real name comes from the authenticated user
router.put("/:id/:name", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    // get the username from the DB using the id stored in the JWT
    const userResult = await pool.query("SELECT username FROM users WHERE id = $1", [req.user.id]);
    if (userResult.rowCount === 0) {
      return res.status(401).send({ error: "User not found" });
    }
    const name = userResult.rows[0].username;

    const conn = await pool.connect(); // pick a connection from the pool
    // KEEP THE TRANSACTION AS SMALL AS POSSIBLE
    await conn.query("BEGIN");
    // $1 prevents SQL INJECTION
    const sql = "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE";
    const result = await conn.query(sql, [id]);

    // seat not available
    if (result.rowCount === 0) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(409).send({ error: "Seat already booked" });
    }
    const sqlU = "UPDATE seats SET isbooked = 1, name = $2 WHERE id = $1";
    await conn.query(sqlU, [id, name]);
    await conn.query("COMMIT");
    conn.release(); // release the connection back to the pool
    res.send({ message: "Seat booked successfully", seat: id, bookedBy: name });
  } catch (ex) {
    console.log(ex);
    res.status(500).send({ error: "Booking failed" });
  }
});

export default router;
