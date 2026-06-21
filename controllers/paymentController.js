const axios = require("axios");
const Subscription = require("../models/Subscription");
const Account = require("../models/Account"); // Make sure this is imported

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
    const { provider, transactionRef, plan, userId } = req.body;

    // IMPORTANT: Get userId from multiple possible sources
    // Your auth middleware might store user differently
    let authenticatedUserId = null;
    
    // Check different possible locations for userId
    if (req.user?.id) {
      authenticatedUserId = req.user.id;
    } else if (req.user?.accountId) {
      authenticatedUserId = req.user.accountId;
    } else if (req.user?._id) {
      authenticatedUserId = req.user._id;
    } else if (userId) {
      authenticatedUserId = userId;
    }

    console.log("=== PAYMENT VERIFICATION REQUEST ===");
    console.log("Provider:", provider);
    console.log("Transaction Ref:", transactionRef);
    console.log("Plan from frontend:", plan);
    console.log("User ID from request:", authenticatedUserId);
    console.log("Full req.user:", req.user);
    console.log("Full req.body:", req.body);

    if (!provider || !transactionRef) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (provider, transactionRef)",
      });
    }

    if (!authenticatedUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required - please ensure you're logged in",
      });
    }

    let data;

    // ================= VERIFY PAYMENT =================
    if (provider === "paystack") {
      data = await verifyPaystackPayment(transactionRef);
    } else if (provider === "flutterwave") {
      data = await verifyFlutterwavePayment(transactionRef);
    } else {
      return res.status(400).json({ 
        success: false,
        message: "Invalid payment provider" 
      });
    }

    // ❌ INVALID RESPONSE
    if (!data) {
      return res.status(400).json({ 
        success: false,
        message: "Verification failed - no data returned" 
      });
    }

    console.log("Paystack Data:", {
      status: data.status,
      amount: data.amount,
      amountInNGN: data.amount / 100,
      currency: data.currency,
      metadata: data.metadata
    });

    // ❌ PAYMENT NOT SUCCESSFUL
    if (data.status !== "success") {
      return res.status(400).json({
        success: false,
        message: `Payment not successful. Status: ${data.status}`,
      });
    }

    // ================= DETERMINE PLAN =================
    let planFromMetadata = data.metadata?.plan || plan || "monthly";
    let normalizedPlan = planFromMetadata.toLowerCase().trim();
    
    let finalPlan = "monthly";
    let durationDays = 30;

    if (normalizedPlan.includes("year") || 
        normalizedPlan === "12 months" || 
        normalizedPlan === "12month" || 
        normalizedPlan === "annual") {
      finalPlan = "yearly";
      durationDays = 365;
    } else if (normalizedPlan.includes("quarter") || 
               normalizedPlan === "3 months" || 
               normalizedPlan === "3month" || 
               normalizedPlan === "quarterly") {
      finalPlan = "quarterly";
      durationDays = 90;
    } else if (normalizedPlan.includes("month") || 
               normalizedPlan === "1 month" || 
               normalizedPlan === "1month" || 
               normalizedPlan === "monthly") {
      finalPlan = "monthly";
      durationDays = 30;
    } else {
      console.warn(`Unrecognized plan: ${normalizedPlan}, defaulting to monthly`);
      finalPlan = "monthly";
      durationDays = 30;
    }

    console.log(`Plan detected: ${finalPlan} (${durationDays} days)`);

    const amount = data.amount / 100;
    const startDate = new Date();
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    console.log(`Subscription: ${finalPlan}, ₦${amount}, ${startDate} to ${endDate}`);

    // ================= UPDATE SUBSCRIPTION =================
    // First, check if a subscription already exists
    let existingSubscription = await Subscription.findOne({ 
      userId: authenticatedUserId 
    });

    console.log("Existing subscription found:", !!existingSubscription);
    if (existingSubscription) {
      console.log("Existing subscription details:", {
        plan: existingSubscription.plan,
        status: existingSubscription.status,
        endDate: existingSubscription.endDate
      });
    }

    // Create or update subscription
    const subscription = await Subscription.findOneAndUpdate(
      { userId: authenticatedUserId },
      {
        userId: authenticatedUserId,
        status: "active",
        plan: finalPlan,
        durationDays: durationDays,
        amount: amount,
        currency: data.currency || "NGN",
        lastPaymentRef: transactionRef,
        paymentProvider: provider,
        startDate: startDate,
        endDate: endDate,
        updatedAt: new Date(),
        metadata: {
          ...data.metadata,
          paystackAmount: data.amount,
          planDetected: finalPlan,
        },
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    console.log(`✅ Subscription updated:`, {
      plan: subscription.plan,
      status: subscription.status,
      userId: subscription.userId,
      endDate: subscription.endDate
    });

    // ================= ALSO UPDATE ACCOUNT =================
    try {
      // Update the Account model if you have one
      const Account = require("../models/Account");
      await Account.findByIdAndUpdate(
        authenticatedUserId,
        {
          isSubscribed: true,
          subscriptionPlan: finalPlan,
          subscriptionEndDate: endDate,
        },
        { new: true }
      );
      console.log("✅ Account updated with subscription info");
    } catch (accountError) {
      console.log("Note: Could not update Account model:", accountError.message);
    }

    // ================= RESPONSE =================
    return res.json({
      success: true,
      status: "success",
      amount: amount,
      currency: data.currency || "NGN",
      plan: finalPlan,
      durationDays: durationDays,
      startDate: startDate,
      endDate: endDate,
      subscription: subscription,
      message: `Payment verified and ${finalPlan} subscription activated`,
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    
    return res.status(500).json({ 
      success: false,
      message: "Server error during payment verification",
      error: error.message,
    });
  }
};

module.exports = { verifyPaymentStatus };