const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: String,

  content: String,

  category: String,

  isFree: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Lesson", LessonSchema);