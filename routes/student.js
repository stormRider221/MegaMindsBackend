// routes/student.js

const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const bcrypt = require("bcrypt");

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
    const { preferredName, surname, parentIds, schoolId, email, country } = req.body;

    // 🔹 Validate input
    if (!preferredName || !surname || !parentIds || parentIds.length === 0) {
      return res.status(400).json({ message: "Please fill in both Surname and Preferred Name." });
    }

    // 🔹 Normalize names
    const capitalPreferredName = capitalizeFirstLetter(preferredName.trim());
    const capitalSurname = capitalizeFirstLetter(surname.trim());

    // 🔹 Check for duplicates under the same parent account
    const duplicate = await Student.findOne({
      preferredName: capitalPreferredName,
      surname: capitalSurname,
      parentIds: { $in: parentIds }, // checks if student is already linked to the parent
    });

    if (duplicate) {
      return res.status(400).json({
        message: `"${capitalSurname} ${capitalPreferredName}" already exists in this account.`
      });
    }

    // 🔹 Generate unique Student ID
    let studentId = generateStudentId(preferredName);
    let exists = await Student.findOne({ studentId });
    while (exists) {
      studentId = generateStudentId(preferredName);
      exists = await Student.findOne({ studentId });
    }

    // 🔹 Generate password
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 🔹 Create student
    const newStudent = new Student({
      preferredName: capitalPreferredName,
      surname: capitalSurname,
      fullName: `${capitalPreferredName} ${capitalSurname}`,
      email: email || null,
      password: hashedPassword,
      studentId,
      country: country || "Nigeria",
      role: "student",
      schoolId: schoolId || null,
      parentIds,
      progress: 0,
      subscriptionStatus: "inactive",
      createdAt: new Date(),
    });

    await newStudent.save();

    res.status(201).json({
      ...newStudent._doc,
      generatedPassword: plainPassword,
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error" });
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
// GET students linked to parent or school
// ==========================================

router.get("/", async (req, res) => {
  try {
    const { parentId, schoolId } = req.query;

    console.log("GET /api/students - Query params received:", { parentId, schoolId });

    let query = {};

    // 🔹 If parentId is provided, get students for that specific parent
    if (parentId) {
      query.parentIds = { $in: [parentId] };
      console.log("Filtering by parentId:", parentId);
    }

    // 🔹 If schoolId is provided, get students for that specific school
    if (schoolId) {
      query.schoolId = schoolId;
      console.log("Filtering by schoolId:", schoolId);
    }

    console.log("Final MongoDB query:", JSON.stringify(query));

    const students = await Student
      .find(query)
      .sort({ createdAt: -1 });

    console.log(`Found ${students.length} students`);
    res.json(students);

  } catch (err) {
    console.error("Fetch students error:", err);
    res.status(500).json({ message: "Server error" });
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