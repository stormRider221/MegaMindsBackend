const Subscription = require("../models/Subscription");

const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.params.userId || req.user?.id;

    const subscription = await Subscription.findOne({ userId });

    // ❌ No subscription found
    if (!subscription) {
      return res.status(403).json({
        message: "No active subscription found"
      });
    }

    const now = new Date();

    // ❌ Subscription expired
    if (now > subscription.endDate) {
      return res.status(403).json({
        message: "Subscription expired. Please renew."
      });
    }

    // ❌ Not active
    if (subscription.status !== "active") {
      return res.status(403).json({
        message: "Subscription is not active"
      });
    }

    // ✅ ALLOW ACCESS
    next();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = checkSubscription;