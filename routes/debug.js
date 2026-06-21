const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// Import models
const Subscription = require("../models/Subscription");
const Account = require("../models/Account");

// Debug route - check what's in the database
router.get("/subscriptions", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("=== DEBUG: Checking database ===");
        console.log("User ID:", userId);
        
        // Find user's subscription
        const subscription = await Subscription.findOne({ userId });
        console.log("Subscription found:", !!subscription);
        
        // Find user's account
        const account = await Account.findById(userId);
        console.log("Account found:", !!account);
        
        // Count all subscriptions
        const totalSubscriptions = await Subscription.countDocuments();
        console.log("Total subscriptions in DB:", totalSubscriptions);
        
        // Get all subscriptions (limit to 10)
        const allSubscriptions = await Subscription.find({}).limit(10);
        
        res.json({
            success: true,
            data: {
                userId: userId,
                userAccount: account,
                userSubscription: subscription,
                totalSubscriptions: totalSubscriptions,
                allSubscriptions: allSubscriptions.map(s => ({
                    userId: s.userId,
                    plan: s.plan,
                    status: s.status,
                    endDate: s.endDate,
                    amount: s.amount,
                    startDate: s.startDate
                }))
            }
        });
    } catch (error) {
        console.error("Debug error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Check auth status
router.get("/auth-check", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("=== AUTH CHECK ===");
        console.log("User ID:", userId);
        console.log("User email:", req.user.email);
        
        res.json({
            success: true,
            userId: userId,
            user: {
                id: req.user.id,
                email: req.user.email,
                accountId: req.user.accountId || req.user.id
            }
        });
    } catch (error) {
        console.error("Auth check error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;