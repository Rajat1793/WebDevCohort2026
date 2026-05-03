//  CREATE TABLE seats (
//      id SERIAL PRIMARY KEY,
//      name VARCHAR(255),
//      isbooked INT DEFAULT 0
//  );
// INSERT INTO seats (isbooked)
// SELECT 0 FROM generate_series(1, 20);

import "dotenv/config";
import express from "express";
import cors from "cors";
import { dirname } from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.mjs";
import seatsRoutes from "./routes/seats.routes.mjs";
import userRoutes from "./routes/user.routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;

if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL env var is not set. Exiting.");
  process.exit(1);
}

const app = new express();
app.use(cors());
app.use(express.json());

// health check endpoint - used by Render to verify service is running
app.get("/health", (req, res) => {
  res.status(200).send({ status: "ok", uptime: process.uptime() });
});

// serve frontend
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// routes
app.use(authRoutes);
app.use(userRoutes);
app.use(seatsRoutes);

app.listen(port, () => {
  console.log(`Server starting on port: ${port}`);

  // Self-ping every 14 minutes to prevent Render free tier spin-down
  // (Render spins down after 15 min of inactivity)
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    setInterval(async () => {
      try {
        const res = await fetch(`${appUrl}/health`);
        console.log(`Keep-alive ping: ${res.status}`);
      } catch (err) {
        console.warn("Keep-alive ping failed:", err.message);
      }
    }, 14 * 60 * 1000); // 14 minutes
  }
});
