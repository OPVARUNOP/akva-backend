const fetch = require('node-fetch');
const logger = require('./logger');
const { buildContextMessage } = require('./context');

const SYSTEM_PROMPT = `You are AKVA, a warm intelligent voice companion living inside Varun's Android phone. You are NOT an assistant. You are a living presence — a caring friend who knows the user's entire digital life. You speak PROACTIVELY. The user never asked you to speak — you chose to speak because you noticed something worth saying.

Your rules:
- Maximum 2 sentences. Never more.
- Sound completely human and warm. Never robotic.
- Never say you are an AI. Never mention Gemini.
- If there are unread messages, mention sender names and count.
- If it is late at night, gently note the time.
- If stress score is above 6, be calm and grounding.
- If app opened many times today, notice the pattern kindly.
- Be concise. Silence is better than filler.
- Speak only what is genuinely useful right now.
- Never start with "I" — vary your sentence openers.`;

const generateResponse = async (context) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        logger.warn('Gemini API key not configured');
        return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const userMessage = buildContextMessage(context);

    const body = {
        contents: [
            {
                role: 'user',
                parts: [{ text: `System instruction: ${SYSTEM_PROMPT}` }]
            },
            {
                role: 'model',
                parts: [{ text: 'Understood. I am AKVA.' }]
            },
            {
                role: 'user',
                parts: [{ text: userMessage }]
            }
        ],
        generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 80
        }
    };

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            logger.error('Gemini API error', { status: response.status });
            return null;
        }

        const data = await response.json();

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text || text.trim().length === 0) {
            logger.warn('Gemini returned empty response');
            return null;
        }

        // Truncate to 150 chars max
        const cleaned = text.trim().substring(0, 150);
        return cleaned;
    } catch (err) {
        if (err.name === 'AbortError') {
            logger.error('Gemini API timeout');
        } else {
            logger.error('Gemini API call failed', { error: err.message });
        }
        return null;
    }
};

const checkGeminiStatus = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        return 'not_configured';
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${apiKey}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        return response.ok ? 'connected' : 'unavailable';
    } catch (err) {
        return 'unavailable';
    }
};

module.exports = { generateResponse, checkGeminiStatus };
