const log = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`);
};

const logger = {
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
    request: (req) => {
        log('info', `${req.method} ${req.path}`, {
            ip: req.ip || req.connection?.remoteAddress,
            deviceId: req.body?.deviceId ? req.body.deviceId.substring(0, 8) + '...' : 'none',
            userAgent: req.headers['user-agent']?.substring(0, 50) || 'unknown'
        });
    }
};

module.exports = logger;
