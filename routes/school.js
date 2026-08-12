const express = require("express");
const router = express.Router();

const School = require("../models/School");
const Account = require("../models/Account");
const authMiddleware = require("../middleware/auth");

// ===============================
// SCHOOL SETUP
// ===============================
router.post("/setup", authMiddleware, async (req, res) => {
  try {

    const { name, slug } = req.body;

    // Get logged-in account
    const account = await Account.findById(req.user.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    // Must be a school account
    if (account.accountType !== "school") {
      return res.status(403).json({
        success: false,
        message: "Only school accounts can configure a school"
      });
    }

    // Check if school has already been configured
    if (account.schoolId) {
      return res.status(400).json({
        success: false,
        message: "School has already been configured"
      });
    }

    // Validate school name
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "School name is required"
      });
    }

    // Validate slug
    if (!slug || !slug.trim()) {
      return res.status(400).json({
        success: false,
        message: "School URL name is required"
      });
    }

    const cleanSlug = slug
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    if (!cleanSlug) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid school URL name"
      });
    }

    // Check whether slug already exists
    const existingSchool = await School.findOne({
      slug: cleanSlug
    });

    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: "This school URL name is already taken"
      });
    }

    // Create school
    const school = new School({
      name: name.trim(),
      slug: cleanSlug,
      ownerAccount: account._id
    });

    await school.save();

    // Connect account to school
    account.schoolId = school._id;
    account.onboardingCompleted = true;

    await account.save();

    return res.json({
      success: true,
      message: "School configured successfully",
      school,
      account
    });

  } catch (error) {

    console.error("School setup error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});

module.exports = router;