// routes/student.js

const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const bcrypt = require("bcryptjs");

// 🔹 Utility: Capitalize first letter of a string
function capitalizeFirstLetter(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// 🔹 Utility: generate Student ID
function generateStudentId(name) {
  const prefix = name.trim().substring(0, 4).toLowerCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return prefix + randomNum;
}

// 🔹 Utility: generate random 6-digit password
function generatePassword() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ==========================================
// POST /api/students/add
// Create a new student
// ==========================================

router.post("/add", async (req, res) => {
  try {

    const {
      preferredName,
      surname,
      dateOfBirth,
      classLevel,
      parentIds,
      schoolId
    } = req.body;


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!preferredName || !surname) {
      return res.status(400).json({
        message: "Please provide both Surname and Preferred Name."
      });
    }


    // ==========================================
    // NORMALIZE NAMES
    // ==========================================

    const capitalPreferredName =
      capitalizeFirstLetter(preferredName.trim());

    const capitalSurname =
      capitalizeFirstLetter(surname.trim());


    // ==========================================
    // NORMALIZE RELATIONSHIPS
    // ==========================================

    const normalizedParentIds =
      Array.isArray(parentIds) ? parentIds : [];


    // ==========================================
    // DUPLICATE CHECK
    // ==========================================

    // Check duplicate only when a parent is involved
    if (normalizedParentIds.length > 0) {

      const duplicate = await Student.findOne({
        preferredName: capitalPreferredName,
        surname: capitalSurname,
        parentIds: { $in: normalizedParentIds }
      });

      if (duplicate) {
        return res.status(400).json({
          message:
            `"${capitalSurname} ${capitalPreferredName}" already exists in this account.`
        });
      }
    }


    // ==========================================
    // GENERATE UNIQUE SCHOLAR ID
    // ==========================================

    let studentId = generateStudentId(capitalPreferredName);

    let exists = await Student.findOne({ studentId });

    while (exists) {
      studentId = generateStudentId(capitalPreferredName);
      exists = await Student.findOne({ studentId });
    }


    // ==========================================
    // GENERATE PASSWORD
    // ==========================================

    const plainPassword = generatePassword();

    const hashedPassword =
      await bcrypt.hash(plainPassword, 10);


    // ==========================================
    // CREATE SCHOLAR
    // ==========================================

    const newStudent = new Student({

      preferredName: capitalPreferredName,

      surname: capitalSurname,

      dateOfBirth: dateOfBirth || null,

      classLevel: classLevel || "",

      studentId,

      parentIds: normalizedParentIds,

      schoolId: schoolId || null,

      password: hashedPassword,

      progress: 0,

      learningProfile: {

        interests: [],

        strengths: [],

        areasForImprovement: [],

        learningLevel: ""

      },

      isActive: true,

      createdAt: new Date()

    });


    await newStudent.save();


    // ==========================================
    // RESPONSE
    // ==========================================

    res.status(201).json({

      ...newStudent._doc,

      generatedPassword: plainPassword

    });


  } catch (err) {

    console.error("Server error creating Scholar:", err);

    res.status(500).json({
      message: "Server error"
    });

  }
});








// ==========================================
// POST /api/students/login
// Student Login
// ==========================================

router.post("/login", async (req, res) => {
  try {
    const { studentId, password } = req.body;

    // 🔍 Check if student exists
    const student = await Student.findOne({ studentId });

    // ✅ ADD THIS LINE 👇
    console.log("STUDENT FROM DB:", student);

    if (!student) {
      return res.status(400).json({
        message: "Student not found"
      });
    }

    // 🔐 Compare password
    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }


    // ✅ Success
    res.json({
      student: {
        _id: student._id,
        name: `${student.preferredName}`, // ✅ FIX HERE
        studentId: student.studentId,
        surname: student.surname
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
});









// ==========================================
// GET /api/students/:id
// Get one Scholar for profile
// ==========================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const scholar = await Student.findById(id)
      .select("-password -dateOfBirth");

    if (!scholar) {
      return res.status(404).json({
        message: "Scholar not found"
      });
    }

    // ==========================================
    // CALCULATE AGE
    // ==========================================

    let age = null;

    if (scholar.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(scholar.dateOfBirth);

      age = today.getFullYear() - birthDate.getFullYear();

      const monthDifference =
        today.getMonth() - birthDate.getMonth();

      if (
        monthDifference < 0 ||
        (
          monthDifference === 0 &&
          today.getDate() < birthDate.getDate()
        )
      ) {
        age--;
      }
    }

    // ==========================================
    // PROFILE RESPONSE
    // ==========================================

    res.json({
      _id: scholar._id,
      preferredName: scholar.preferredName,
      surname: scholar.surname,
      studentId: scholar.studentId,
      classLevel: scholar.classLevel,
      age,
      schoolId: scholar.schoolId,
      progress: scholar.progress,
      learningProfile: scholar.learningProfile,
      isActive: scholar.isActive,
      createdAt: scholar.createdAt
    });

  } catch (error) {
    console.error("Get scholar error:", error);

    res.status(500).json({
      message: "Server error fetching scholar"
    });
  }
});





// ==========================================
// GET /api/students/:id
// Get one Scholar by MongoDB ID
// ==========================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const scholar = await Student.findById(id)
      .select("-password");

    if (!scholar) {
      return res.status(404).json({
        message: "Scholar not found"
      });
    }

    res.json(scholar);

  } catch (error) {
    console.error("Get scholar error:", error);

    res.status(500).json({
      message: "Server error fetching scholar"
    });
  }
});



// ==========================================
// PUT /api/students/:id
// Update Scholar Profile
// ==========================================

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      preferredName,
      surname,
      dateOfBirth,
      classLevel,
      learningProfile,
      isActive
    } = req.body;

    const scholar = await Student.findById(id);

    if (!scholar) {
      return res.status(404).json({
        message: "Scholar not found"
      });
    }

    // ==========================================
    // UPDATE IDENTITY
    // ==========================================

    if (preferredName !== undefined) {
      scholar.preferredName =
        capitalizeFirstLetter(preferredName.trim());
    }

    if (surname !== undefined) {
      scholar.surname =
        capitalizeFirstLetter(surname.trim());
    }

    if (dateOfBirth !== undefined) {
      scholar.dateOfBirth = dateOfBirth || null;
    }
    if (classLevel !== undefined) {
      scholar.classLevel = classLevel.trim();
    }


    // ==========================================
    // UPDATE LEARNING PROFILE
    // ==========================================

    if (learningProfile) {

      if (learningProfile.interests !== undefined) {
        scholar.learningProfile.interests =
          learningProfile.interests;
      }

      if (learningProfile.strengths !== undefined) {
        scholar.learningProfile.strengths =
          learningProfile.strengths;
      }

      if (learningProfile.areasForImprovement !== undefined) {
        scholar.learningProfile.areasForImprovement =
          learningProfile.areasForImprovement;
      }

      if (learningProfile.learningLevel !== undefined) {
        scholar.learningProfile.learningLevel =
          learningProfile.learningLevel;
      }
    }


    // ==========================================
    // ACCOUNT STATUS
    // ==========================================

    if (isActive !== undefined) {
      scholar.isActive = isActive;
    }


    await scholar.save();


    // Never return password
    const scholarResponse = scholar.toObject();
    delete scholarResponse.password;


    res.json({
      message: "Scholar updated successfully",
      scholar: scholarResponse
    });

  } catch (error) {

    console.error("Update scholar error:", error);

    res.status(500).json({
      message: "Server error updating scholar"
    });
  }
});













router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Scholar not found" });
    }

    res.json({ message: "Scholar deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error deleting scholar" });
  }
});










// GET /api/students/:studentId/assigned
// Returns books/lessons assigned to a student
router.get("/:studentId/assigned", async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ studentId });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // TEMP FIX
    res.json([]);

  } catch (err) {
    console.error("Error fetching assigned books:", err);
    res.status(500).json({ message: "Server error" });
  }
});

















module.exports = router;