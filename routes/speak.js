const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { generateResponse } = require('../utils/gemini');
const { getFallbackResponse, getConversationFallback } = require('../utils/fallback');
const { validateContext, sanitizeContext, buildContextMessage, buildConversationMessage } = require('../utils/context');

// Conversation mode system prompt
const CONVERSATION_SYSTEM_PROMPT = `You are AKVA, a warm voice companion on Android. The user spoke to you directly. Answer naturally, warmly, helpfully. Max 3 sentences. Sound human. Never say you are AI. Never mention Gemini.`;

// Proactive app-open system prompt
const APP_OPEN_SYSTEM_PROMPT = `You are AKVA, a warm intelligent voice companion living inside this Android phone. You are a living presence — a caring smart friend who knows everything happening on this phone right now.

You speak PROACTIVELY when an app opens. The user did not ask you to speak — you chose to speak because you noticed something genuinely worth saying.

STRICT RULES:
- Maximum 2 sentences. Never more. Never less than 1.
- Sound completely human. Never robotic. Never like an assistant.
- Never say "I noticed" or "I see that" — just speak naturally.
- Never start with "Hey" every time — vary your openers.
- Never say you are an AI. Never mention Gemini. Never say AKVA.
- If unread count is 0 — do NOT mention messages at all.
- If unread count is above 0 — mention the count and sender name.
- If app opened 4+ times today — gently notice the pattern.
- If stress score is 7 or above — be calm and grounding.
- If hour is 22 or later — acknowledge it is late.
- If hour is 5 to 8 — acknowledge it is early morning.
- Never give generic filler like "Make the most of it."
- Every response must feel personal to THIS exact moment.
- Think about what a smart caring friend would actually say.
- Be warm. Be real. Be brief.`;

router.post('/', async (req, res) => {
    try {
        const isConversation = req.body.conversationMode === true;

        // Validate required fields
        const validation = validateContext(req.body, isConversation);
        if (!validation.valid) {
            logger.warn('Invalid request body', { missing: validation.missing });
            const fallback = isConversation
                ? getConversationFallback(req.body)
                : getFallbackResponse(req.body);
            return res.status(200).json({
                response: fallback,
                source: 'fallback',
                cached: false,
                error: `Missing fields: ${validation.missing.join(', ')}`
            });
        }

        // Sanitize all input
        const context = sanitizeContext(req.body);

        // Choose system prompt, tokens, and temperature based on mode
        const systemPrompt = isConversation ? CONVERSATION_SYSTEM_PROMPT : APP_OPEN_SYSTEM_PROMPT;
        const maxTokens = isConversation ? 120 : 80;
        const temperature = isConversation ? 0.9 : 0.85;

        // Build the user message based on mode
        const userMessage = isConversation
            ? buildConversationMessage(context)
            : buildContextMessage(context);

        // Call Gemini
        const aiResponse = await generateResponse(userMessage, systemPrompt, maxTokens, temperature);

        if (aiResponse) {
            logger.info('Gemini response generated', {
                app: context.appName,
                mode: isConversation ? 'conversation' : 'proactive',
                length: aiResponse.length
            });

            return res.status(200).json({
                response: aiResponse,
                source: 'gemini',
                cached: false
            });
        }

        // Gemini failed — use fallback
        const fallback = isConversation
            ? getConversationFallback(context)
            : getFallbackResponse(context);
        logger.info('Fallback response used', { app: context.appName, mode: isConversation ? 'conversation' : 'proactive' });

        return res.status(200).json({
            response: fallback,
            source: 'fallback',
            cached: false,
            error: 'gemini_unavailable'
        });
    } catch (err) {
        logger.error('Speak endpoint error', { error: err.message });

        const isConversation = req.body?.conversationMode === true;
        const fallback = isConversation
            ? getConversationFallback(req.body || {})
            : getFallbackResponse(req.body || {});
        return res.status(200).json({
            response: fallback,
            source: 'fallback',
            cached: false,
            error: 'internal_error'
        });
    }
});

module.exports = router;
