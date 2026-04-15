import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db/pool.mjs";

const router = Router();

// register a user by taking username, email and password
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // hash the password before storing it in the database
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    const password_hash = await bcrypt.hash(password, salt);
    const sql = "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)";
    await pool.query(sql, [username, email, password_hash]);
    res.status(201).send({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(409).send({ error: "Username or email already exists" });
    }
    res.status(500).send({ error: "Registration failed" });
  }
});

// login a user by taking email and password, if successful return a JWT token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(sql, [email]);
    if (result.rowCount === 0) {
      return res.status(400).send({ error: "Invalid email or password" });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).send({ error: "Invalid email or password" });
    }
    // generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });
    res.send({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Login failed" });
  }
});

export default router;
