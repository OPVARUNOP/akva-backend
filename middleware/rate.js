const logger = require('../utils/logger');
const { getFallbackResponse } = require('../utils/fallback');

// In-memory rate limit store: deviceId -> { minute, hour, day, lastMinuteReset, lastHourReset, lastDayReset }
const rateLimits = new Map();

const LIMITS = {
    perMinute: 20,
    perHour: 200,
    perDay: 1000
};

const getOrCreateEntry = (deviceId) => {
    const now = Date.now();

    if (!rateLimits.has(deviceId)) {
        rateLimits.set(deviceId, {
            minute: 0,
            hour: 0,
            day: 0,
            lastMinuteReset: now,
            lastHourReset: now,
            lastDayReset: now
        });
    }

    const entry = rateLimits.get(deviceId);

    // Reset per-minute counter
    if (now - entry.lastMinuteReset >= 60 * 1000) {
        entry.minute = 0;
        entry.lastMinuteReset = now;
    }

    // Reset per-hour counter
    if (now - entry.lastHourReset >= 60 * 60 * 1000) {
        entry.hour = 0;
        entry.lastHourReset = now;
    }

    // Reset per-day counter
    if (now - entry.lastDayReset >= 24 * 60 * 60 * 1000) {
        entry.day = 0;
        entry.lastDayReset = now;
    }

    return entry;
};

const rateLimit = (req, res, next) => {
    try {
        const deviceId = req.body?.deviceId;
        if (!deviceId) {
            return next();
        }

        const entry = getOrCreateEntry(deviceId);

        const exceeded =
            entry.minute >= LIMITS.perMinute ||
            entry.hour >= LIMITS.perHour ||
            entry.day >= LIMITS.perDay;

        if (exceeded) {
            logger.warn('Rate limit exceeded', {
                deviceId: deviceId.substring(0, 8) + '...',
                minute: entry.minute,
                hour: entry.hour,
                day: entry.day
            });

            // Return fallback response — never silence
            const fallback = getFallbackResponse(req.body || {});
            return res.status(200).json({
                response: fallback,
                source: 'fallback',
                cached: false,
                error: 'rate_limited'
            });
        }

        // Increment counters
        entry.minute++;
        entry.hour++;
        entry.day++;

        next();
    } catch (err) {
        logger.error('Rate limit middleware error', { error: err.message });
        next();
    }
};

// Cleanup stale entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours

    for (const [deviceId, entry] of rateLimits.entries()) {
        if (now - entry.lastDayReset > staleThreshold) {
            rateLimits.delete(deviceId);
        }
    }
}, 10 * 60 * 1000);

module.exports = rateLimit;
