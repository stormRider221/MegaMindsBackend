const Account = require("../models/Account");
const Subscription = require("../models/Subscription");

const subscriptionGuard = (mode = "strict") => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      // 1️⃣ If no user (guest)
      if (!userId) {
        if (mode === "preview") {
          req.access = "PREVIEW"; // 👈 allow but limited
          return next();
        }

        return res.status(401).json({
          success: false,
          message: "Login required",
          code: "NOT_AUTHENTICATED"
        });
      }

      // 2️⃣ Get user
      const user = await Account.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      req.userData = user;

      // 3️⃣ FREE content → always allowed
      if (req.resource?.isFree) {
        req.access = "FULL";
        return next();
      }

      // 4️⃣ Check subscription
      const now = new Date();

      const subscription = await Subscription.findOne({
        userId,
        status: "active",
        endDate: { $gt: now }
      });

      // ❌ No subscription
      if (!subscription) {
        if (mode === "preview") {
          req.access = "PREVIEW"; // 👈 allow limited access
          return next();
        }

        return res.status(403).json({
          success: false,
          message: "Subscription required",
          code: "NO_SUBSCRIPTION"
        });
      }

      // ✅ Has subscription
      req.subscription = subscription;
      req.access = "FULL";

      next();

    } catch (error) {
      console.error("Subscription Guard Error:", error);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  };
};

module.exports = subscriptionGuard;