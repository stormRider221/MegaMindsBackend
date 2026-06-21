const express = require("express");
const router = express.Router();

const { handlePaystackWebhook } = require("../controllers/webhookController");

// ⚠️ IMPORTANT: use raw body for webhook
router.post("/paystack", handlePaystackWebhook);

module.exports = router;