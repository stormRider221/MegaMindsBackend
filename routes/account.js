const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Account = require("../models/Account");
const authMiddleware = require("../middleware/auth");
const Subscription = require("../models/Subscription");



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
        password: null
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