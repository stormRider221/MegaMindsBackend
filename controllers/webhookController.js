const crypto = require("crypto");
const Payment = require("../models/Payment");
const Subscription = require("../models/Subscription");
const Account = require("../models/Account");

const handlePaystackWebhook = async (req, res) => {
  try {
    console.log("========== PAYSTACK WEBHOOK ==========");

    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Ensure we always have a Buffer
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));

    const signature = req.headers["x-paystack-signature"];

    // Verify signature
    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.log("❌ Invalid Paystack signature");
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(rawBody.toString());

    console.log("Webhook Event:", event.event);

    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const data = event.data;

    console.log("Reference:", data.reference);

    const transactionRef = data.reference;

    // Prevent duplicate processing
    const existingPayment = await Payment.findOne({ transactionRef });

    if (existingPayment) {
      console.log("Payment already processed.");
      return res.sendStatus(200);
    }

    const userId = data.metadata?.userId;
    const plan = data.metadata?.plan || "monthly";

    if (!userId) {
      console.log("No userId found in metadata.");
      return res.sendStatus(200);
    }

    // Save payment
    await Payment.create({
      userId,
      email: data.customer.email,
      amount: data.amount / 100,
      currency: data.currency,
      provider: "paystack",
      transactionRef,
      status: "successful"
    });

    // Determine subscription duration
    const durationMap = {
      monthly: 30,
      quarterly: 90,
      yearly: 365
    };

    const durationDays = durationMap[plan] || 30;

    const startDate = new Date();
    const endDate = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000
    );

    // Create / Update subscription
    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      {
        userId,
        plan,
        status: "active",
        isActive: true,
        startDate,
        endDate,
        durationDays,
        amount: data.amount / 100,
        currency: data.currency,
        paymentProvider: "paystack",
        lastPaymentRef: transactionRef,
        updatedAt: new Date()
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Update account
    await Account.findByIdAndUpdate(userId, {
      subscriptionStatus: "active",
      currentSubscriptionId: subscription._id,
      isSubscribed: true,
      subscriptionPlan: plan,
      subscriptionEndDate: endDate,
      $push: {
        subscriptionHistory: subscription._id
      }
    });

    console.log("✅ Subscription activated for:", userId);

    return res.sendStatus(200);

  } catch (error) {
    console.error("❌ Webhook error:", error);
    return res.sendStatus(500);
  }
};

module.exports = { handlePaystackWebhook };