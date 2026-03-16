require('dotenv').config();

const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const authenticate = require('./middleware/auth');
const rateLimit = require('./middleware/rate');
const speakRoute = require('./routes/speak');
const healthRoute = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Log every request
app.use((req, res, next) => {
    logger.request(req);
    next();
});

// ── Routes ─────────────────────────────────────────────────
// Health check — no auth required
app.use('/health', healthRoute);

// Main AI endpoint — auth + rate limiting
app.use('/akva/speak', authenticate, rateLimit, speakRoute);

// Root
app.get('/', (req, res) => {
    res.status(200).json({
        service: 'AKVA Backend Server',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            speak: 'POST /akva/speak'
        },
        author: 'Varun'
    });
});

// ── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} does not exist`
    });
});

// ── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(200).json({
        response: 'Something unexpected happened. I am still here.',
        source: 'fallback',
        error: 'server_error'
    });
});

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
    logger.info(`AKVA Server is alive on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Gemini API Key: ${process.env.GEMINI_API_KEY ? 'configured' : 'NOT SET'}`);
});

module.exports = app;
