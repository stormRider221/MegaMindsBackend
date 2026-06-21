// backend/routes/subscriptionPage.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Subscription = require("../models/Subscription");
const Account = require("../models/Account");
const Payment = require("../models/Payment");
const Student = require("../models/Student");

// Helper function to get plan price
const getPlanPrice = (plan) => {
    const prices = {
        'monthly': 2000,
        'quarterly': 5500,
        'yearly': 20000
    };
    return prices[plan?.toLowerCase()] || 0;
};

// Helper function to get plan display name
const getPlanDisplayName = (plan) => {
    const names = {
        'monthly': 'Monthly',
        'quarterly': 'Quarterly (3 months)',
        'yearly': 'Yearly (12 months)'
    };
    return names[plan?.toLowerCase()] || plan || 'No Plan';
};

router.get("/me", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        console.log("=== FETCHING SUBSCRIPTION ===");
        console.log("User ID:", userId);
        console.log("User object:", req.user);

        // Get account
        const account = await Account.findById(userId);
        console.log("Account found:", !!account);

        // Get subscription
        let subscription = await Subscription.findOne({ userId });
        
        // If not found with userId, try accountId
        if (!subscription && account?._id) {
            subscription = await Subscription.findOne({ userId: account._id });
        }
        
        console.log("Subscription found:", !!subscription);
        if (subscription) {
            console.log("Subscription details:", {
                status: subscription.status,
                plan: subscription.plan,
                endDate: subscription.endDate,
                startDate: subscription.startDate,
                userId: subscription.userId
            });
        }

        // Get scholar count
        const scholarCount = await Student.countDocuments({
            parentIds: userId
        });

        // ==============================
        // NO SUBSCRIPTION CASE
        // ==============================
        if (!subscription) {
            console.log("No subscription found - returning inactive");
            return res.json({
                accountName: (account?.name || "Parent").split(" ")[0],
                status: "inactive",
                isActive: false,
                plan: null,
                planDisplayName: 'No Plan',
                amount: 0,
                currency: "NGN",
                scholarCount: scholarCount || 0,
                startDate: null,
                endDate: null,
                daysRemaining: 0,
                durationDays: 0,
                hasSubscription: false,
            });
        }

        // ==============================
        // CHECK SUBSCRIPTION STATUS
        // ==============================
        const now = new Date();
        let status = subscription.status;

        // Auto-expire if endDate has passed
        if (status === "active" && subscription.endDate && subscription.endDate < now) {
            status = "expired";
            subscription.status = "expired";
            await subscription.save();
            console.log("Subscription auto-expired");
        }

        const isActive = status === "active" && subscription.endDate && subscription.endDate > now;
        
        console.log(`Subscription status: ${status}, isActive: ${isActive}`);

        // Calculate days remaining
        let daysRemaining = 0;
        if (isActive && subscription.endDate) {
            daysRemaining = Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24));
        }

        // Get plan price based on subscription plan
        const planPrice = getPlanPrice(subscription.plan);
        const planDisplayName = getPlanDisplayName(subscription.plan);

        // ==============================
        // SUCCESS RESPONSE
        // ==============================
        const responseData = {
            accountName: (account?.name || "Parent").split(" ")[0],
            
            // Subscription status
            status: status,
            isActive: isActive,
            hasSubscription: true,
            plan: subscription.plan,
            planDisplayName: planDisplayName,
            
            // Amount based on plan
            amount: planPrice,
            currency: "NGN",
            
            // Dates
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            daysRemaining: daysRemaining,
            
            // Scholars
            scholarCount: scholarCount || 0,
            
            // Additional info
            durationDays: subscription.durationDays || 30,
            lastPaymentRef: subscription.lastPaymentRef || null,
            paymentProvider: subscription.paymentProvider || null,
        };

        console.log("Sending response:", {
            status: responseData.status,
            isActive: responseData.isActive,
            plan: responseData.plan,
            amount: responseData.amount
        });

        return res.json(responseData);

    } catch (error) {
        console.error("SUBSCRIPTION ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch subscription",
            error: error.message,
        });
    }
});

// Debug route to check raw data
router.get("/debug", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log("=== DEBUG ROUTE ===");
        console.log("User ID:", userId);
        
        // Get raw data from database
        const subscription = await Subscription.findOne({ userId });
        const payments = await Payment.find({ userId }).sort({ createdAt: -1 }).limit(5);
        const account = await Account.findById(userId);
        
        // Get all subscriptions to see what's in the collection
        const allSubscriptions = await Subscription.find({});
        
        console.log("All subscriptions in DB:", allSubscriptions.length);
        console.log("Subscription IDs:", allSubscriptions.map(s => s.userId));
        
        res.json({
            userId: userId,
            account: account,
            subscription: subscription,
            payments: payments,
            allSubscriptions: allSubscriptions.map(s => ({
                userId: s.userId,
                plan: s.plan,
                status: s.status,
                endDate: s.endDate
            })),
            subscriptionExists: !!subscription,
            subscriptionStatus: subscription?.status,
            subscriptionPlan: subscription?.plan,
        });
    } catch (error) {
        console.error("Debug error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;