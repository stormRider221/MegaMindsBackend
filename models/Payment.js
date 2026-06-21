const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: "NGN"
  },

  provider: {
    type: String, // flutterwave or paystack
    required: true
  },

  transactionRef: {
    type: String,
    required: true,
    unique: true
  },

  status: {
    type: String,
    enum: ["pending", "successful", "failed"],
    default: "pending"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Payment", paymentSchema);