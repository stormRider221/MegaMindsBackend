const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();


// =====================
// CORS CONFIG (FIXED)
// =====================
const allowedOrigins = [
  "https://www.cstech.com.ng",
  "https://cstech.com.ng",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow mobile apps / postman / server-to-server
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// handle preflight requests
app.options(/.*/, cors());

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
app.use("/api/subscription", subscriptionPageRoute);
app.use("/api/debug", debugRoutes);

// webhook MUST be last
app.use("/api/webhook", webhookRoutes);


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
// ERROR HANDLING
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
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => {
    console.log("❌ MongoDB connection error:", err);
    process.exit(1);
  });


// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`📍 Test endpoint: http://localhost:${PORT}/api/test`);
});