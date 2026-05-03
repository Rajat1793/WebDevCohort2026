import { Router } from "express";
import pool from "../db/pool.mjs";
import authenticate from "../middleware/auth.middleware.mjs";

const router = Router();

// get logged-in user's profile
router.get("/me", authenticate, async (req, res) => {
  const result = await pool.query(
    "SELECT id, username, email FROM users WHERE id = $1",
    [req.user.id]
  );
  if (result.rowCount === 0) return res.status(404).send({ error: "User not found" });
  res.send(result.rows[0]);
});

export default router;
