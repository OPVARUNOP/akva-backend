const buildContextMessage = (ctx) => {
    const senders = ctx.senderNames && ctx.senderNames.length > 0
        ? ctx.senderNames.join(', ')
        : 'none';

    const chargingStatus = ctx.isCharging ? '(charging)' : '';

    return `User just opened ${ctx.appName} on their Android phone.
Previous app: ${ctx.previousApp || 'none'}.
Time: ${ctx.timeOfDay} (${ctx.hourOfDay}:00 on ${ctx.dayOfWeek}).
Unread notifications in ${ctx.appName}: ${ctx.unreadCount || 0}.
Senders waiting: ${senders}.
Times opened today: ${ctx.timesOpenedToday || 0}.
Battery: ${ctx.batteryPercent}% ${chargingStatus}.
Network: ${ctx.networkType || 'Unknown'}.
Stress score: ${ctx.stressScore || 0}/10.
User pattern: ${ctx.userPattern || 'Regular usage'}.
Generate a warm proactive voice response.`;
};

const validateContext = (body) => {
    const requiredFields = [
        'appName', 'packageName', 'timeOfDay', 'hourOfDay',
        'dayOfWeek', 'batteryPercent', 'deviceId'
    ];

    const missing = requiredFields.filter(field => {
        const val = body[field];
        return val === undefined || val === null || val === '';
    });

    if (missing.length > 0) {
        return { valid: false, missing };
    }

    return { valid: true, missing: [] };
};

const sanitizeContext = (body) => {
    return {
        appName: String(body.appName || '').substring(0, 100),
        packageName: String(body.packageName || '').substring(0, 150),
        previousApp: String(body.previousApp || '').substring(0, 100),
        timeOfDay: String(body.timeOfDay || 'afternoon').substring(0, 20),
        hourOfDay: parseInt(body.hourOfDay, 10) || 12,
        dayOfWeek: String(body.dayOfWeek || 'Monday').substring(0, 20),
        unreadCount: Math.max(0, parseInt(body.unreadCount, 10) || 0),
        senderNames: Array.isArray(body.senderNames)
            ? body.senderNames.slice(0, 5).map(s => String(s).substring(0, 50))
            : [],
        timesOpenedToday: Math.max(0, parseInt(body.timesOpenedToday, 10) || 0),
        batteryPercent: Math.min(100, Math.max(0, parseInt(body.batteryPercent, 10) || 100)),
        isCharging: Boolean(body.isCharging),
        networkType: String(body.networkType || 'Unknown').substring(0, 20),
        stressScore: Math.min(10, Math.max(0, parseInt(body.stressScore, 10) || 0)),
        userPattern: String(body.userPattern || '').substring(0, 200),
        deviceId: String(body.deviceId || '').substring(0, 100)
    };
};

module.exports = { buildContextMessage, validateContext, sanitizeContext };
