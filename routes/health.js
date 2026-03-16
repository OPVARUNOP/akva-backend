const express = require('express');
const router = express.Router();
const { checkGeminiStatus } = require('../utils/gemini');

router.get('/', async (req, res) => {
    try {
        const geminiStatus = await checkGeminiStatus();

        return res.status(200).json({
            status: 'alive',
            service: 'AKVA Backend',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            gemini: geminiStatus
        });
    } catch (err) {
        return res.status(200).json({
            status: 'alive',
            service: 'AKVA Backend',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            gemini: 'unavailable'
        });
    }
});

module.exports = router;
