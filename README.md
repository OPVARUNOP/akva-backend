# AKVA Backend Server

> AI middleware for the AKVA Living Phone OS — by Varun

## Overview

This is the production backend server for AKVA. It acts as a secure middleware between the AKVA Android app and Google Gemini API. The API key lives **only on this server** — never in the app.

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **AI**: Google Gemini 1.5 Flash REST API
- **Deploy**: Railway.app

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Server info |
| GET | `/health` | No | Health check + Gemini status |
| POST | `/akva/speak` | Yes | Main AI response endpoint |

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env and add your Gemini API key
npm install
npm start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | Environment (production/development) |

## Deploy to Railway

1. Push this `backend` folder to a Git repo
2. Connect the repo to [Railway.app](https://railway.app)
3. Add environment variable: `GEMINI_API_KEY=your_key`
4. Railway auto-detects `Procfile` and deploys

## Request Format (POST /akva/speak)

**Headers:**
```
x-akva-app-id: com.varun.akva
x-akva-version: 1.0.0
Content-Type: application/json
```

**Body:**
```json
{
  "appName": "WhatsApp",
  "packageName": "com.whatsapp",
  "previousApp": "Instagram",
  "timeOfDay": "evening",
  "hourOfDay": 19,
  "dayOfWeek": "Monday",
  "unreadCount": 5,
  "senderNames": ["Priya", "Rahul"],
  "timesOpenedToday": 3,
  "batteryPercent": 67,
  "isCharging": false,
  "networkType": "WiFi",
  "stressScore": 4,
  "userPattern": "Usually active evenings",
  "deviceId": "hashed_device_id"
}
```

**Response:**
```json
{
  "response": "Priya and Rahul are waiting on WhatsApp. 5 messages to catch up on.",
  "source": "gemini",
  "cached": false
}
```

## Rate Limits

- 20 requests per minute per device
- 200 requests per hour per device
- 1000 requests per day per device

When rate limited, a fallback response is returned — AKVA never goes silent.

## Security

- All requests require `x-akva-app-id: com.varun.akva`
- All requests require `x-akva-version` header
- All requests require `deviceId` in body
- API key stored only in server environment variables
- No user data is stored beyond rate limiting windows
