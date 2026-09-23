// Entry point for Firebase Cloud Functions (Gen 2, Node runtime).
// Kept separate from server.js so `npm start` (traditional host) still works unchanged.
require('dotenv').config();
const { onRequest } = require('firebase-functions/v2/https');
const mongoose = require('mongoose');
const app = require('./app');

// Cloud Functions reuses warm instances between invocations, so cache the
// connection instead of reconnecting (and never process.exit on failure —
// that would crash the whole function instance for unrelated requests).
let connectionPromise = null;
const ensureDbConnected = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI).catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }
  return connectionPromise;
};

exports.api = onRequest(
  { secrets: ['MONGODB_URI', 'JWT_SECRET'], cors: true },
  async (req, res) => {
    try {
      await ensureDbConnected();
    } catch (error) {
      console.error('MongoDB connection error:', error);
      res.status(500).json({ message: 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ' });
      return;
    }
    app(req, res);
  }
);
