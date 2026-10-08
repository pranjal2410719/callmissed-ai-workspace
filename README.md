# CallMissed AI Studio

A unified AI workspace demonstrating text chat, image generation, and real-time voice-agent interaction powered exclusively by the CallMissed API.

## About

This application is an end-to-end frontend engineering assignment built for CallMissed. It showcases multi-model conversational text chat, natural language text-to-image synthesis, and bi-directional conversational voice interaction over WebRTC.

## Features

- **AI Chat**: Multi-turn conversation with model selection (Sarvam 105B, Kimi K2.5, GPT-4o, Gemma 4 31B, GPT-5.6 Luna), markdown rendering (tables, code blocks, lists), and custom system instructions.
- **Image Studio**: Natural-language text-to-image synthesis with FLUX.2 Klein 9B, SDXL Lightning, and Phoenix 1.0, configurable aspect ratios, negative prompt parameters, fullscreen inspection, and in-session history.
- **Voice Agent**: Low-latency bi-directional voice conversation over WebRTC powered by CallMissed Voice Session API (STT -> LLM -> TTS), with live transcription deduplication, voice personas, and spoken language selection.

## Tech Stack

- Next.js (App Router, Turbopack)
- React
- TypeScript
- Tailwind CSS
- Radix UI
- LiveKit Client (WebRTC)
- CallMissed API

## Architecture

```text
Browser Client
      ↓
Next.js Application (App Router)
      ↓
Server-Side API Route Handlers
      ↓
CallMissed API Gateway (https://api.callmissed.com/v1)
```

The `CALLMISSED_API_KEY` is strictly confined to server-side route handlers (`/api/chat`, `/api/image`, `/api/voice/session`). The client never receives or stores the API key. For voice sessions, the server authenticates with CallMissed to mint a short-lived room token and media gateway URL, which the browser uses to establish a direct WebRTC stream.

## CallMissed Integration

- **Chat**: Communicates with `POST /v1/chat/completions` supporting multi-turn conversation and system prompt injection.
- **Image Studio**: Interacts with `POST /v1/images/generations` and `GET /v1/images/history` for image synthesis and history retrieval.
- **Voice Agent**: Calls `POST /v1/voice/sessions` to initiate a session and `GET /v1/voice/sessions/{id}/transcript` for post-call analysis, streaming real-time audio through `livekit-client`.

## Links

- **Live Demo**: [https://myai-tau-ten.vercel.app/](https://myai-tau-ten.vercel.app/)
- **Repository**: [https://github.com/pranjal2410719/callmissed-ai-workspace](https://github.com/pranjal2410719/callmissed-ai-workspace)

## Local Development

```bash
# 1. Clone the repository
git clone https://github.com/pranjal2410719/callmissed-ai-workspace.git
cd callmissed-ai-workspace

# 2. Install dependencies
npm install

# 3. Create environment configuration
cp .env.example .env.local

# 4. Add your API key in .env.local
# CALLMISSED_API_KEY=your_key_here

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the workspace.

## Environment Variables

- `CALLMISSED_API_KEY`: Secret API key obtained from the CallMissed developer dashboard. Must be kept strictly server-side.
- `CALLMISSED_BASE_URL` (optional): API base URL override (defaults to `https://api.callmissed.com/v1`).

## Security

The CallMissed API key is stored server-side in `.env.local` and is never exposed in client bundles or public requests. All external API requests are proxied through server route handlers. `.env*` files (except `.env.example`) are ignored by Git.

## Developer

Pranjal Yadav is a B.Tech CSE student at PSIT, Kanpur, and a frontend/full-stack developer focused on Next.js, React, TypeScript, and modern web applications.

He builds product interfaces and developer-focused software with an emphasis on clean architecture, API integration, responsive UX, and practical engineering.

- **GitHub**: [https://github.com/pranjal2410719](https://github.com/pranjal2410719)
- **LinkedIn**: [https://www.linkedin.com/in/-pranjal22/](https://www.linkedin.com/in/-pranjal22/)

## Assignment

This project was built as part of the Frontend Engineering Intern (Next.js) assessment for CallMissed.
