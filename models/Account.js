const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  password: {
    type: String,
    required: false   // changed to optional for social login
  },

  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },

  accountType: {
    type: String,
    enum: ["parent", "school"],
    required: true
  },

  country: {
    type: String
  },

  pricingTier: {
    type: String,
    enum: ["LOCAL", "AFRICA", "INTERNATIONAL"]
  },

  photoURL: {
    type: String
  },

  currentSubscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription"
  },

  subscriptionHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription"
    }
  ],


  subscriptionStatus: {
    type: String,
    enum: ["NONE", "ACTIVE", "EXPIRED"],
    default: "NONE"
  }


}, { timestamps: true });

module.exports = mongoose.model("Account", AccountSchema);