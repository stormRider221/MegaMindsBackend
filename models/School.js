const mongoose = require("mongoose");

const SchoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    ownerAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      unique: true
    },

    // ===============================
    // SCHOOL PROFILE
    // ===============================
    logo: {
      type: String,
      default: ""
    },

    address: {
      type: String,
      default: ""
    },

    city: {
      type: String,
      default: ""
    },

    state: {
      type: String,
      default: ""
    },

    country: {
      type: String,
      default: ""
    },

    phone: {
      type: String,
      default: ""
    },

    email: {
      type: String,
      default: ""
    },

    website: {
      type: String,
      default: ""
    },

    motto: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: ""
    },

    // ===============================
    // SCHOOL BRANDING
    // ===============================
    primaryColor: {
      type: String,
      default: "#6C4AB6"
    },

    secondaryColor: {
      type: String,
      default: "#FFFFFF"
    },

    // ===============================
    // STATUS
    // ===============================
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("School", SchoolSchema);