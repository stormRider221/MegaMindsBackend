const authMiddleware = require("../middleware/auth");

const express = require("express");
const router = express.Router();

const { verifyPaymentStatus } = require("../controllers/paymentController");

router.post(
  "/verify",
  authMiddleware,
  verifyPaymentStatus
);

module.exports = router;