const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");

const getLesson = async (req, res, next) => {
  try {
    const lessonId = req.params.id;

    // Check if valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(404).json({
        message: "Lesson not found"
      });
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found"
      });
    }

    req.resource = lesson;

    next();

  } catch (error) {
    console.error("Get Lesson Error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = getLesson;