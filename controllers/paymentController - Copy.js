const axios = require("axios");
const Subscription = require("../models/Subscription");

// ================= PAYSTACK VERIFY =================
const verifyPaystackPayment = async (reference) => {
  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  return response.data.data;
};

// ================= FLUTTERWAVE VERIFY =================
const verifyFlutterwavePayment = async (transactionId) => {
  const response = await axios.get(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    }
  );

  return response.data.data;
};

// ================= CONTROLLER =================
const verifyPaymentStatus = async (req, res) => {
  try {
    const { provider, transactionRef, plan } = req.body;

    const userId = req.user.id;

    if (!provider || !transactionRef) {
      return res.status(400).json({
        message: "Missing required fields (provider, transactionRef)",
      });
    }

    console.log("AUTHENTICATED USER:", userId);

    let data;

    // ================= VERIFY PAYMENT =================
    if (provider === "paystack") {
      data = await verifyPaystackPayment(transactionRef);
    } else if (provider === "flutterwave") {
      data = await verifyFlutterwavePayment(transactionRef);
    } else {
      return res.status(400).json({ message: "Invalid payment provider" });
    }

    // ❌ INVALID RESPONSE
    if (!data) {
      return res.status(400).json({ message: "Verification failed" });
    }

    // ❌ PAYMENT NOT SUCCESSFUL
    if (data.status !== "success") {
      return res.status(400).json({
        message: "Payment not successful",
      });
    }

    const amount = data.amount || 0;

    // ================= UPDATE SUBSCRIPTION =================

    // default = 30 days (Monthly)
    let durationDays = 30;

    // normalize plan name
    const normalizedPlan = (plan || "monthly").toLowerCase();

    if (normalizedPlan.includes("quarter")) {
      durationDays = 90;
    } else if (normalizedPlan.includes("year")) {
      durationDays = 365;
    }

    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      {
        userId,
        status: "active",
        plan: plan || "monthly",
        amount,
        lastPaymentRef: transactionRef,
        startDate: new Date(),
        endDate: new Date(
          Date.now() + durationDays * 24 * 60 * 60 * 1000
        ),
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // ================= RESPONSE =================
    return res.json({
      success: true,
      status: "success",
      amount,
      currency: data.currency,
      subscription,
      message: "Payment verified and subscription activated",
    });






  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//console.log("AUTH HEADER:", req.headers.authorization);
//console.log("USER:", req.user);

module.exports = { verifyPaymentStatus };