const logger = require('../utils/logger');

const authenticate = (req, res, next) => {
    try {
        const appId = req.headers['x-akva-app-id'];
        const version = req.headers['x-akva-version'];
        const deviceId = req.body?.deviceId;

        if (appId !== 'com.varun.akva') {
            logger.warn('Auth failed: invalid app ID', {
                ip: req.ip,
                appId: appId || 'missing'
            });
            return res.status(403).json({
                response: 'Unauthorized',
                source: 'error',
                error: 'Invalid app identifier'
            });
        }

        if (!version || typeof version !== 'string' || version.trim().length === 0) {
            logger.warn('Auth failed: missing version', { ip: req.ip });
            return res.status(403).json({
                response: 'Unauthorized',
                source: 'error',
                error: 'Missing version header'
            });
        }

        if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
            logger.warn('Auth failed: missing deviceId', { ip: req.ip });
            return res.status(403).json({
                response: 'Unauthorized',
                source: 'error',
                error: 'Missing device identifier'
            });
        }

        next();
    } catch (err) {
        logger.error('Auth middleware error', { error: err.message });
        next();
    }
};

module.exports = authenticate;
