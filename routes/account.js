const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Account = require("../models/Account");
const authMiddleware = require("../middleware/auth");
const Subscription = require("../models/Subscription");
const School = require("../models/School");



// ===============================
// SOCIAL LOGIN (Google / Facebook)
// ===============================
router.post("/social-login", async (req, res) => {
  try {
    const {
      firebaseUid,
      name,
      email,
      accountType,
      country,
      pricingTier,
      photoURL
    } = req.body;

    let account = await Account.findOne({
      $or: [{ firebaseUid }, { email }]
    });

    // New user (first time login)
    if (!account) {

      if (!accountType) {
        return res.json({
          success: true,
          isNewUser: true,
          account: null,
          token: null
        });
      }

      account = new Account({
        firebaseUid,
        name,
        email,
        accountType: accountType.toLowerCase(),
        country,
        pricingTier,
        photoURL,
        password: null,
        schoolId: null,
        onboardingCompleted: false
      });

      await account.save();

      console.log("New social account created:", email);
    }


    const token = jwt.sign(
      { id: account._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // ===============================
    // GET CURRENT SUBSCRIPTION
    // ===============================
    const subscription = await Subscription.findOne({
      userId: account._id
    });

    const now = new Date();

    const subscriptionData = {
      isActive: false,
      status: "inactive",
      plan: null,
      endDate: null
    };

    if (
      subscription &&
      subscription.status === "active" &&
      subscription.endDate &&
      subscription.endDate > now
    ) {
      subscriptionData.isActive = true;
      subscriptionData.status = subscription.status;
      subscriptionData.plan = subscription.plan;
      subscriptionData.endDate = subscription.endDate;
    }

    return res.json({
      success: true,
      account,
      subscription: subscriptionData,
      token
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});






// ===============================
// SCHOOL SETUP
// ===============================
// ===============================
// SCHOOL BASIC SETUP
// ===============================
router.post("/school-setup", authMiddleware, async (req, res) => {
  try {
    const { schoolName, slug } = req.body;

    // ===============================
    // VALIDATION
    // ===============================
    if (!schoolName || !schoolName.trim()) {
      return res.status(400).json({
        success: false,
        message: "School name is required"
      });
    }

    if (!slug || !slug.trim()) {
      return res.status(400).json({
        success: false,
        message: "School URL name is required"
      });
    }

    // ===============================
    // GET ACCOUNT
    // ===============================
    const account = await Account.findById(req.user.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    // ===============================
    // CONFIRM SCHOOL ACCOUNT
    // ===============================
    if (account.accountType !== "school") {
      return res.status(403).json({
        success: false,
        message: "Only school accounts can complete school setup"
      });
    }

    // ===============================
    // CLEAN VALUES
    // ===============================
    const cleanName = schoolName.trim();

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

    // ===============================
    // CHECK SCHOOL NAME
    // ===============================
    const existingSchoolName = await School.findOne({
      name: {
        $regex: `^${cleanName}$`,
        $options: "i"
      }
    });

    if (existingSchoolName) {
      return res.status(400).json({
        success: false,
        message: "A school with this name already exists"
      });
    }

    // ===============================
    // CHECK SLUG
    // ===============================
    const existingSchoolSlug = await School.findOne({
      slug: cleanSlug
    });

    if (existingSchoolSlug) {
      return res.status(400).json({
        success: false,
        message: "This school URL name is already taken"
      });
    }

    // ===============================
    // CREATE SCHOOL
    // ===============================
    const school = new School({
      name: cleanName,
      slug: cleanSlug,
      ownerAccount: account._id
    });

    await school.save();

    // ===============================
    // UPDATE ACCOUNT
    // ===============================
    account.schoolId = school._id;

    // IMPORTANT:
    // The school has NOT completed
    // onboarding yet.
    account.onboardingCompleted = false;

    await account.save();

    // ===============================
    // RESPONSE
    // ===============================
    return res.status(201).json({
      success: true,
      message: "Basic school setup completed",
      school,
      account
    });

  } catch (error) {
    console.error("School setup error:", error);

    // ===============================
    // HANDLE DUPLICATE INDEX ERROR
    // ===============================
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      if (duplicateField === "name") {
        return res.status(400).json({
          success: false,
          message: "A school with this name already exists"
        });
      }

      if (duplicateField === "slug") {
        return res.status(400).json({
          success: false,
          message: "This school URL name is already taken"
        });
      }

      if (duplicateField === "ownerAccount") {
        return res.status(400).json({
          success: false,
          message: "This account already has a school"
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});



// ===============================
// COMPLETE SCHOOL PROFILE
// ===============================
router.put("/school-profile", authMiddleware, async (req, res) => {
  try {
    const {
      address,
      city,
      state,
      country,
      phone,
      email,
      website,
      motto,
      description,
      logo,
      primaryColor,
      secondaryColor
    } = req.body;

    // ===============================
    // GET ACCOUNT
    // ===============================
    const account = await Account.findById(req.user.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    // ===============================
    // CONFIRM SCHOOL ACCOUNT
    // ===============================
    if (account.accountType !== "school") {
      return res.status(403).json({
        success: false,
        message: "Only school accounts can complete school profile"
      });
    }

    // ===============================
    // CHECK SCHOOL ID
    // ===============================
    if (!account.schoolId) {
      return res.status(400).json({
        success: false,
        message: "School setup has not been started"
      });
    }

    // ===============================
    // REQUIRED FIELDS
    // ===============================
    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: "School address is required"
      });
    }

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: "City is required"
      });
    }

    if (!state || !state.trim()) {
      return res.status(400).json({
        success: false,
        message: "State is required"
      });
    }

    if (!country || !country.trim()) {
      return res.status(400).json({
        success: false,
        message: "Country is required"
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "School phone number is required"
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "School email is required"
      });
    }

    // ===============================
    // FIND SCHOOL
    // ===============================
    const school = await School.findById(account.schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found"
      });
    }

    // ===============================
    // UPDATE SCHOOL PROFILE
    // ===============================
    school.address = address.trim();
    school.city = city.trim();
    school.state = state.trim();
    school.country = country.trim();
    school.phone = phone.trim();
    school.email = email.trim();

    school.website = website?.trim() || "";
    school.motto = motto?.trim() || "";
    school.description = description?.trim() || "";

    // Logo will initially be a URL.
    // Actual image upload can be added separately.
    school.logo = logo?.trim() || "";

    school.primaryColor = primaryColor || "#6C4AB6";
    school.secondaryColor = secondaryColor || "#FFFFFF";

    await school.save();

    // ===============================
    // COMPLETE ONBOARDING
    // ===============================
    account.onboardingCompleted = true;

    await account.save();

    // ===============================
    // RESPONSE
    // ===============================
    return res.json({
      success: true,
      message: "School profile completed successfully",
      school,
      account
    });

  } catch (error) {
    console.error("School profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});



















// ===============================
// GET CURRENT LOGGED IN USER
// ===============================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const account = await Account.findById(req.user.id);

    return res.json({
      success: true,
      account
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


module.exports = router;