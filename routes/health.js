const router = require('express').Router();
const fetch = require('node-fetch');

router.get('/', async (req, res) => {
  let geminiStatus = 'unavailable';

  if (process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' &&
      process.env.GEMINI_API_KEY.length > 10) {
    geminiStatus = 'connected';
  }

  res.json({
    status: 'alive',
    service: 'AKVA Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    gemini: geminiStatus
  });
});

module.exports = router;
