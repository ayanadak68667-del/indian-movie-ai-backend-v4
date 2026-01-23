const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { chatWithUser } = require('../services/geminiService');

// ✅ স্মার্ট লিমিট টেকনোলজি (প্রতি ইউজার ১৫ মিনিটে ৫টির বেশি মেসেজ দিতে পারবে না)
const aiAssistantLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // ১৫ মিনিট
    max: 5, 
    message: {
        status: 429,
        message: "CineDost-কে একটু বিশ্রাম দিন! ১৫ মিনিট পর আবার চেষ্টা করুন।"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * @route   POST /api/chat
 * @desc    Filmi Bharat AI Assistant (CineDost)
 */
router.post('/', aiAssistantLimiter, async (req, res) => {
    try {
        const { message } = req.body;

        // মেসেজ না থাকলে এরর রিটার্ন করবে
        if (!message || message.trim() === "") {
            return res.status(400).json({ error: "Message is required" });
        }

        console.log(`CineDost User Query: ${message}`);

        // ✅ geminiService কল করা হচ্ছে (আপনার লেটেস্ট কোড অনুযায়ী)
        const aiResponse = await chatWithUser(message);

        // সফল রেসপন্স
        res.json({
            success: true,
            reply: aiResponse,
            botName: "CineDost"
        });

    } catch (error) {
        console.error("Chat Endpoint Error:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "দুঃখিত! এই মুহূর্তে সার্ভার একটু ব্যস্ত আছে।" 
        });
    }
});

module.exports = router;
