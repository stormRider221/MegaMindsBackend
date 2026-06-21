const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const subscriptionGuard = require("../middleware/subscriptionGuard");
const getLesson = require("../middleware/getLesson");

// 🔒 Start Lesson (Protected)

router.post(
  "/:id/start",
  authMiddleware,
  subscriptionGuard("strict"),
  (req, res) => {
    res.json({
      success: true,
      message: "Access granted, Lesson Started"
    });
  }
);

module.exports = router;