// =======================================================
// CampusResolve - AI Chatbot Routes (/api/ai)
// =======================================================

const express = require("express");
const router = express.Router();
const { generateAIResponse } = require("../services/aiService");

/**
 * @route   POST /api/ai/chat
 * @desc    Get AI Chatbot response for student queries
 * @access  Public (Can optionally use auth context from client)
 */
router.post("/chat", async (req, res) => {
    try {
        const { message, history, context } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required."
            });
        }

        const result = await generateAIResponse(
            message.trim(),
            Array.isArray(history) ? history : [],
            context || {}
        );

        res.json({
            success: true,
            reply: result.reply,
            source: result.source
        });

    } catch (error) {
        console.error("AI Route Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate AI response. Please try again."
        });
    }
});

module.exports = router;
