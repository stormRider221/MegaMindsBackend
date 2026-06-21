const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({

  preferredName: {
    type: String,
    required: true
  },

  surname: {
    type: String,
    required: true
  },

  parentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account"
  }],

  studentId: {
    type: String,
    unique: true
  },

  password: {
    type: String
  },

  progress: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Student", StudentSchema);