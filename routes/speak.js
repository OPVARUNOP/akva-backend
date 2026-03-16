const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { generateResponse } = require('../utils/gemini');
const { getFallbackResponse } = require('../utils/fallback');
const { validateContext, sanitizeContext } = require('../utils/context');

router.post('/', async (req, res) => {
    try {
        // Validate required fields
        const validation = validateContext(req.body);
        if (!validation.valid) {
            logger.warn('Invalid request body', { missing: validation.missing });
            const fallback = getFallbackResponse(req.body);
            return res.status(200).json({
                response: fallback,
                source: 'fallback',
                cached: false,
                error: `Missing fields: ${validation.missing.join(', ')}`
            });
        }

        // Sanitize all input
        const context = sanitizeContext(req.body);

        // Call Gemini
        const aiResponse = await generateResponse(context);

        if (aiResponse) {
            logger.info('Gemini response generated', {
                app: context.appName,
                length: aiResponse.length
            });

            return res.status(200).json({
                response: aiResponse,
                source: 'gemini',
                cached: false
            });
        }

        // Gemini failed — use fallback
        const fallback = getFallbackResponse(context);
        logger.info('Fallback response used', { app: context.appName });

        return res.status(200).json({
            response: fallback,
            source: 'fallback',
            cached: false,
            error: 'gemini_unavailable'
        });
    } catch (err) {
        logger.error('Speak endpoint error', { error: err.message });

        // Even on crash — return a response
        const fallback = getFallbackResponse(req.body || {});
        return res.status(200).json({
            response: fallback,
            source: 'fallback',
            cached: false,
            error: 'internal_error'
        });
    }
});

module.exports = router;
