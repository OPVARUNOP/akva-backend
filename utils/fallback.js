const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── Conversation mode fallbacks ────────────────────────────
const getConversationFallback = (ctx) => {
    try {
        const speech = (ctx.userSpeech || '').toLowerCase();
        const battery = parseInt(ctx.batteryPercent, 10) || 100;
        const hour = parseInt(ctx.hourOfDay, 10) || 12;
        const unread = parseInt(ctx.unreadCount, 10) || parseInt(ctx.totalUnread, 10) || 0;

        if (speech.includes('battery')) {
            return `Your battery is at ${battery} percent.`;
        }
        if (speech.includes('time')) {
            return `It is ${hour} o'clock right now.`;
        }
        if (speech.includes('message') || speech.includes('unread') || speech.includes('notification')) {
            return `You have ${unread} unread messages.`;
        }

        return 'I am here. What do you need?';
    } catch (err) {
        return 'I am here. What do you need?';
    }
};

// ── Proactive app-open fallbacks (generic only — no per-app pre-written dialogues) ──
const nightFallbacks = [
    'It is late. Maybe wind down soon.',
    'Late night again. Take care of yourself.'
];

const stressFallbacks = [
    'Take a breath. Everything can wait a moment.',
    'It is okay to pause. Nothing is that urgent.'
];

const defaultFallbacks = [
    'I am here with you.',
    'Still here, still watching out for you.',
    'Right here whenever you need me.'
];

const getFallbackResponse = (ctx) => {
    try {
        const hour = parseInt(ctx.hourOfDay, 10) || 12;
        const stress = parseInt(ctx.stressScore, 10) || 0;

        // Night check
        if (hour >= 22 || hour <= 5) {
            return pickRandom(nightFallbacks);
        }

        // Stress check
        if (stress >= 7) {
            return pickRandom(stressFallbacks);
        }

        // Default — no per-app pre-written dialogues
        return pickRandom(defaultFallbacks);
    } catch (err) {
        return 'I am here with you.';
    }
};

module.exports = { getFallbackResponse, getConversationFallback };
