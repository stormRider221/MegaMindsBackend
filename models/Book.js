const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: String,

  content: String, // or file/URL depending on your setup

  category: String,

  isFree: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Book", BookSchema);