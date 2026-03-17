const fetch = require('node-fetch');
const logger = require('./logger');

/**
 * Generate a response from Gemini API.
 */
const generateResponse = async (userMessage, systemPrompt, maxTokens = 150, temperature = 0.8) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        logger.warn('Gemini API key not configured');
        return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body = {
        contents: [
            {
                role: 'user',
                parts: [{ text: `System instruction: ${systemPrompt}` }]
            },
            {
                role: 'model',
                parts: [{ text: 'Understood.' }]
            },
            {
                role: 'user',
                parts: [{ text: userMessage }]
            }
        ],
        generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens
        }
    };

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            logger.error('Gemini API error', { status: response.status, details: errData });
            return null;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text || text.trim().length === 0) {
            logger.warn('Gemini returned empty response');
            return null;
        }

        return text.trim();
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
    if (!apiKey || apiKey === 'your_gemini_api_key_here') return 'not_configured';

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
