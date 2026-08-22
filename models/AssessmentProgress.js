const mongoose = require("mongoose");

const AssessmentAttemptSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    correctAnswers: {
      type: Number,
      required: true,
      min: 0
    },

    totalQuestions: {
      type: Number,
      required: true,
      min: 1
    },

    attemptedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const AssessmentProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true
    },

    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    contentType: {
      type: String,
      enum: ["Book", "Lesson"],
      required: true
    },

    attempts: {
      type: [AssessmentAttemptSchema],
      default: []
    },

    totalAttempts: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

AssessmentProgressSchema.index(
  {
    studentId: 1,
    contentId: 1,
    contentType: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  "AssessmentProgress",
  AssessmentProgressSchema
);