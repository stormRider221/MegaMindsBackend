const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const subscriptionGuard = require("../middleware/subscriptionGuard");
const getBook = require("../middleware/getBook");

// 📚 Open Book
router.get(
  "/:id",
  authMiddleware,
  getBook,
  subscriptionGuard("strict"), // MVP-friendly: allow preview
  (req, res) => {
    res.json({
      success: true,
      message: "Book loaded",
      book: req.resource,
      access: req.access
    });
  }
);

module.exports = router;