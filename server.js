const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// =====================
// CORS - MUST BE FIRST!
// =====================
app.use(cors({
  origin: ["http://localhost:5173", "http://192.168.25.202:5173", "http://localhost:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// =====================
// WEBHOOK RAW (MUST BE BEFORE JSON)
// =====================
app.use("/api/webhook", express.raw({ type: "*/*" }));

// =====================
// BODY PARSING
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// ROUTES IMPORTS
// =====================
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const accountRoutes = require("./routes/account");
const paymentRoutes = require("./routes/paymentRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const bookRoutes = require("./routes/bookRoutes");
const subscriptionPageRoute = require("./routes/subscriptionPageRoute");
const debugRoutes = require("./routes/debug");

// =====================
// ROUTES REGISTRATION
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/subscription", subscriptionPageRoute);
app.use("/api/debug", debugRoutes);

// =====================
// TEST ROUTES
// =====================
app.get("/", (req, res) => {
  res.json({ 
    message: "Mega Minds Academy API",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API working fine",
    timestamp: new Date().toISOString()
  });
});

// =====================
// ERROR HANDLING MIDDLEWARE
// =====================
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// =====================
// DATABASE CONNECTION
// =====================
mongoose.connect("mongodb://127.0.0.1:27017/megamindsacademy")
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.log("❌ MongoDB connection error:", err));

// =====================
// START SERVER
// =====================
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Express server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`📍 Test endpoint: http://localhost:${PORT}/api/test`);
});