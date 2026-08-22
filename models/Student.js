const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({

  // ===============================
  // IDENTITY
  // ===============================

  preferredName: {
    type: String,
    required: true,
    trim: true
  },

  surname: {
    type: String,
    required: true,
    trim: true
  },

  dateOfBirth: {
    type: Date,
    default: null
  },

  classLevel: {
    type: String,
    default: "",
    trim: true
  },

  studentId: {
    type: String,
    unique: true
  },


  // ===============================
  // RELATIONSHIPS
  // ===============================

  parentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account"
  }],

  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    default: null,
    index: true
  },


  // ===============================
  // LEARNING PROFILE
  // ===============================

  learningProfile: {

    interests: [{
      type: String
    }],

    strengths: [{
      type: String
    }],

    areasForImprovement: [{
      type: String
    }],

    learningLevel: {
      type: String,
      default: ""
    }

  },


  // ===============================
  // PROGRESS
  // ===============================

  progress: {
    type: Number,
    default: 0
  },


  // ===============================
  // AUTHENTICATION
  // ===============================

  password: {
    type: String
  },


  // ===============================
  // ACCOUNT STATUS
  // ===============================

  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Student", StudentSchema);