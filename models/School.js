const mongoose = require("mongoose");

const SchoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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

    logo: {
      type: String
    },

    primaryColor: {
      type: String,
      default: "#6C4AB6"
    },

    secondaryColor: {
      type: String,
      default: "#FFFFFF"
    },

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