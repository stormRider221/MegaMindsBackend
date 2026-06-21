const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    plan: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly'],
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'pending'],
        default: 'pending',
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'NGN',
    },
    durationDays: {
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
    },
    lastPaymentRef: {
        type: String,
    },
    paymentProvider: {
        type: String,
        enum: ['paystack', 'flutterwave', 'manual'],
        default: 'paystack',
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },
}, {
    timestamps: true
});

// ✅ MAKE SURE THIS EXPORT IS CORRECT
module.exports = mongoose.model('Subscription', subscriptionSchema);