const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const appFallbacks = {
    'com.whatsapp': (ctx) => {
        const sender = ctx.senderNames?.[0] || 'someone';
        const count = ctx.unreadCount || 0;
        return pickRandom([
            `${count} messages waiting. ${sender} is one of them.`,
            `WhatsApp open. Looks like ${sender} wants to connect.`,
            `${count} unread. The important ones won't wait long.`
        ]);
    },

    'com.google.android.gm': (ctx) => {
        const count = ctx.unreadCount || 0;
        return pickRandom([
            `${count} emails unread. Worth a quick scan.`,
            `Gmail open. ${count} waiting for your attention.`,
            `Inbox has ${count} new. Handle the urgent ones first.`
        ]);
    },

    'com.instagram.android': (ctx) => {
        const times = ctx.timesOpenedToday || 0;
        const count = ctx.unreadCount || 0;
        return pickRandom([
            `Instagram again. ${times} times today — what are you looking for?`,
            `Instagram open. ${count} new notifications.`,
            `Back on Instagram. Take what you need and move on.`
        ]);
    },

    'com.google.android.youtube': () => pickRandom([
        'YouTube open. Make it something worth your time.',
        'What are we watching today?',
        'YouTube. Evening entertainment or learning something new?'
    ]),

    'com.google.android.apps.maps': () => pickRandom([
        'Maps open. Where are we heading?',
        'Navigation ready. I hope it is somewhere good.',
        'Maps is ready when you are.'
    ]),

    'com.spotify.music': () => pickRandom([
        'Music time. Choose something that fits the mood.',
        'Spotify open. What does today feel like?',
        'Good choice. Music makes everything better.'
    ]),

    'com.google.android.GoogleCamera': () => pickRandom([
        'Camera ready. Capture something worth keeping.',
        'Good light right now. Make it count.',
        'Camera open. What are we shooting?'
    ]),

    'com.sec.android.app.camera': () => pickRandom([
        'Camera ready. Capture something worth keeping.',
        'Good light right now. Make it count.',
        'Camera open. What are we shooting?'
    ])
};

const nightFallbacks = [
    'It is late. {appName} can wait until morning.',
    'Past midnight. Maybe wrap up soon.',
    'Late night again. Take care of yourself.'
];

const stressFallbacks = [
    'Slow down. Everything will still be there in a moment.',
    'Take one breath. You have been switching a lot.',
    'It is okay to pause. Nothing is that urgent.'
];

const defaultFallbacks = [
    'App open. Make the most of it.',
    'Here we go. What are we doing here?',
    'I see you. What do you need right now?'
];

const getFallbackResponse = (ctx) => {
    try {
        const hour = parseInt(ctx.hourOfDay, 10) || 12;
        const stress = parseInt(ctx.stressScore, 10) || 0;
        const appName = ctx.appName || 'this app';

        // Night check first
        if (hour >= 22 || hour <= 5) {
            return pickRandom(nightFallbacks).replace('{appName}', appName);
        }

        // Stress check
        if (stress >= 7) {
            return pickRandom(stressFallbacks);
        }

        // App-specific fallback
        const packageName = ctx.packageName || '';
        if (appFallbacks[packageName]) {
            return appFallbacks[packageName](ctx);
        }

        // Unread notifications
        const unread = parseInt(ctx.unreadCount, 10) || 0;
        if (unread > 0) {
            return `${unread} notifications on ${appName}. Take a look.`;
        }

        // Times opened
        const times = parseInt(ctx.timesOpenedToday, 10) || 0;
        if (times > 3) {
            return `${appName} again — ${times} times today. Noticed that.`;
        }

        // Default
        return pickRandom(defaultFallbacks);
    } catch (err) {
        return 'Opening app. Make the most of it.';
    }
};

module.exports = { getFallbackResponse };
