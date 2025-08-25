// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// ----------------------------
// Firebase Admin Setup
// ----------------------------
if (!process.env.FIREBASE_PROJECT_ID) {
  console.error("❌ Missing Firebase credentials. Set FIREBASE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const firestore = admin.firestore();

// ----------------------------
// PostgreSQL Setup (Dan's DB)
// ----------------------------
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: { rejectUnauthorized: false } // Needed for Google Cloud SQL
});

// ----------------------------
// Routes
// ----------------------------

// Health check
app.get("/", (req, res) => {
  res.send("✅ FRAME Web App backend is running!");
});

// Firestore test
app.get("/api/firestore-users", async (req, res) => {
  try {
    const snapshot = await firestore.collection("users").get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: users });
  } catch (err) {
    console.error("❌ Firestore error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PostgreSQL test
app.get("/api/sql-users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users LIMIT 10;");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ PostgreSQL error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------
// Start Server
// ----------------------------
app.listen(PORT, () => {
  console.log(`🚀 FRAME backend running on http://localhost:${PORT}`);
});
