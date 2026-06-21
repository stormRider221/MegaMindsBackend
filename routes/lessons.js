const express = require("express");
const router = express.Router();

const checkSubscription = require("../middleware/checkSubscription");

// 🔒 Protected route
router.get("/lessons", checkSubscription, (req, res) => {
  res.json({ message: "Welcome to lessons - Access granted" });
});

module.exports = router;