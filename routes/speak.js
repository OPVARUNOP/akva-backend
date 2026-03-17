const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { generateResponse } = require('../utils/gemini');
const { getFallbackResponse, getConversationFallback } = require('../utils/fallback');

router.post('/', async (req, res) => {
    try {
        const { requestMode, userMessage, systemPrompt, userSpeech } = req.body;

        logger.info('Speak request received', { mode: requestMode, app: req.body.appName });

        // Determination of parameters based on mode
        let maxTokens = 150;
        let temperature = 0.8;

        if (requestMode === 'command') {
            maxTokens = 300;
            temperature = 0.1; // Low temperature for consistent JSON
        } else if (requestMode === 'conversation') {
            maxTokens = 200;
            temperature = 0.9;
        }

        // Call Gemini
        const aiResponse = await generateResponse(
            userMessage || userSpeech || "Hello",
            systemPrompt,
            maxTokens,
            temperature
        );

        if (aiResponse) {
            return res.status(200).json({
                response: aiResponse,
                source: 'gemini'
            });
        }

        // Fallback logic
        let fallback = "I'm here.";
        if (requestMode === 'conversation') {
            fallback = getConversationFallback(req.body);
        } else if (requestMode === 'observer') {
            fallback = getFallbackResponse(req.body);
        }

        return res.status(200).json({
            response: fallback,
            source: 'fallback'
        });

    } catch (err) {
        logger.error('Speak endpoint error', { error: err.message });
        return res.status(200).json({
            response: "I'm having a bit of trouble connecting right now.",
            source: 'error'
        });
    }
});

module.exports = router;
