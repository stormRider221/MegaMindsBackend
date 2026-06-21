const crypto = require("crypto");
const Payment = require("../models/Payment");
const Subscription = require("../models/Subscription");
const Account = require("../models/Account");

const handlePaystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    const rawBody = req.body;

    // 🔐 Verify signature
    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    const signature = req.headers["x-paystack-signature"];

    if (hash !== signature) {
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(rawBody.toString());

    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const data = event.data;

    const transactionRef = data.reference;

    // 🔁 Prevent duplicates
    const existingPayment = await Payment.findOne({ transactionRef });
    if (existingPayment) return res.sendStatus(200);

    // 👤 Extract user info
    const userId = data.metadata?.userId;
    const plan = data.metadata?.plan || "monthly";

    if (!userId) return res.sendStatus(200);

    // 💳 1. SAVE PAYMENT
    const payment = await Payment.create({
      userId,
      email: data.customer.email,
      amount: data.amount / 100,
      currency: data.currency,
      provider: "paystack",
      transactionRef,
      status: "successful"
    });

    // 📦 2. CALCULATE SUBSCRIPTION DATES
    const planMap = {
      monthly: 1,
      quarterly: 3,
      yearly: 12
    };

    const months = planMap[plan] || 1;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    // 📦 3. CREATE / UPDATE SUBSCRIPTION
    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      {
        userId,
        plan,
        status: "active",
        startDate,
        endDate,
        lastPaymentRef: transactionRef
      },
      { upsert: true, new: true }
    );

    // 👤 4. UPDATE ACCOUNT
    await Account.findByIdAndUpdate(userId, {
      subscriptionStatus: "active",
      currentSubscriptionId: subscription._id,
      $push: {
        subscriptionHistory: subscription._id
      }
    });

    console.log("Subscription activated:", userId);

    return res.sendStatus(200);

  } catch (error) {
    console.error("Webhook error:", error);
    return res.sendStatus(500);
  }
};

module.exports = { handlePaystackWebhook };