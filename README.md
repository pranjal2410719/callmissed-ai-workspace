# CallMissed AI Workspace

A unified, production-grade AI workspace demonstrating three core capabilities using exclusively the **CallMissed API**:

1. **AI Text Chat** (OpenAI-compatible chat completions with multi-model and Indic language support)
2. **AI Image Studio** (Text-to-image generation with customizable aspect ratios, model routing, and session gallery)
3. **Real-Time Voice Agent** (Full-duplex conversational voice interaction via WebRTC Voice Session API: STT -> LLM -> TTS)

---

## 1. Architectural Overview

```text
Browser Client (Next.js / React)
   |
   |-- HTTPS (JSON / REST)
   v
Next.js Route Handlers (Server-Side)
   |
   |-- Authenticated HTTPS (Bearer cm_...)
   v
CallMissed API Gateway (https://api.callmissed.com/v1)
   |
   |-- /chat/completions -----> LLM Inference (Sarvam 105B, Kimi K2.5, Gemma 4 31B, GPT-4o)
   |-- /images/generations ---> Image Generation (FLUX.2 Klein, SDXL Lightning, Phoenix 1.0)
   |-- /voice/sessions -------> LiveKit WebRTC Session Minting (JWT Token & Media Server URL)
                                     |
                                     v
   Browser <==== WebRTC Media Stream =====> CallMissed Media Server (STT -> LLM -> TTS)
```

### Security Architecture

- **Server-Side Credential Isolation:** The secret `CALLMISSED_API_KEY` is loaded exclusively inside server-side Route Handlers (`app/api/`) and the core CallMissed service library (`lib/callmissed/`).
- **No Secret Leakage:** The client never receives or stores the API key. In the voice flow, the server generates a short-lived connection JWT token from `POST /v1/voice/sessions` and forwards only `wsUrl` and `token` to the client.
- **Strict Environment Separation:** `.env*` files are excluded from Git version control in `.gitignore`.

---

## 2. Core Capabilities

### 1. AI Text Chat
- **Endpoint:** `POST /v1/chat/completions`
- **Supported Models:** `sarvam-105b` (Indic + English), `kimi-k2.5`, `gpt-4o`, `gemma-4-31b`, `gpt-5.6-luna`.
- **Capabilities:**
  - Multi-turn conversation history.
  - Custom system persona instructions.
  - Copy-to-clipboard for responses.
  - Keyboard shortcuts (Enter to send, Shift+Enter for newline).
  - Clear conversation management.
  - Error recovery and retry.

### 2. AI Image Studio
- **Endpoint:** `POST /v1/images/generations` and `GET /v1/images/history`
- **Supported Models:** `flux-2-klein-9b`, `sdxl-lightning`, `phoenix-1.0`, `lucid-origin`, `dreamshaper-8-lcm`.
- **Capabilities:**
  - Custom text prompt input with starter suggestions.
  - Multiple aspect ratio presets (1:1 Square, 3:4 Portrait, 4:3 Landscape, 16:9 Wide).
  - Negative prompt parameter support.
  - Inline base64 and signed URL image rendering.
  - Fullscreen high-resolution zoom modal.
  - In-session generation history gallery with one-click prompt reloading.
  - Single-click image download.

### 3. Real-Time Voice Agent
- **Endpoint:** `POST /v1/voice/sessions` and `GET /v1/voice/sessions/{id}/transcript`
- **Audio Transport:** WebRTC via `livekit-client`
- **Pipeline:** Speech-to-Text (`saaras:v3`) -> LLM (`kimi-k2.5` / `sarvam-105b`) -> Text-to-Speech (`bulbul:v3`)
- **Capabilities:**
  - Secure two-step session creation (server mints connection token, browser connects over WebRTC).
  - Real-time full-duplex speech interaction with automatic server-side Voice Activity Detection (VAD) and interruption handling.
  - Deterministic state machine (`IDLE`, `CONNECTING`, `LISTENING`, `PROCESSING`, `SPEAKING`, `ENDED`, `ERROR`).
  - Interactive voice activity visualizer responding to user audio input and agent speech playback.
  - Live transcription captions stream.
  - Voice selection (`shubh`, `maya`, `arun`, `priya`, `aditi`), language selection (`en-IN`, `hi-IN`, `en-US`), and custom spoken greeting.
  - Microphone mute/unmute control and clean session termination.
  - Post-call transcript retrieval with latency and turn breakdown.

---

## 3. Project Structure

```text
├── app/
│   ├── layout.tsx               # Root layout and metadata
│   ├── page.tsx                 # Main unified AI workspace
│   ├── globals.css              # Tailwind CSS styles and theme
│   ├── chat/
│   │   └── page.tsx             # Direct route for Chat interface
│   ├── image/
│   │   └── page.tsx             # Direct route for Image Studio
│   ├── voice/
│   │   └── page.tsx             # Direct route for Voice Agent
│   └── api/
│       ├── status/
│       │   └── route.ts         # Server-side API key configuration check
│       ├── chat/
│       │   └── route.ts         # Server route for chat completions
│       ├── image/
│       │   └── route.ts         # Server route for image generation & history
│       └── voice/
│           ├── session/
│           │   └── route.ts     # Server route for minting WebRTC voice sessions
│           └── transcript/
│               └── route.ts     # Server route for fetching session transcripts
├── components/
│   ├── layout/
│   │   └── Navbar.tsx           # Header with branding, status indicator, and tabs
│   ├── chat/
│   │   └── ChatInterface.tsx    # Interactive chat UI component
│   ├── image/
│   │   └── ImageGenerator.tsx   # Image studio UI component
│   └── voice/
│       └── VoiceAgent.tsx       # WebRTC voice agent UI component
├── lib/
│   └── callmissed/
│       ├── client.ts            # Base HTTP client with error normalization
│       ├── chat.ts              # Chat API integration & model catalog
│       ├── image.ts             # Image generation API integration & presets
│       └── voice.ts             # Voice Session API integration & configuration
├── types/
│   └── callmissed.ts            # TypeScript definitions for requests & responses
├── .env.example                 # Example environment variable file
├── package.json                 # Dependencies and build scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# CallMissed API Secret Key (Required)
# Get your API key at https://console.callmissed.com/developer/keys
CALLMISSED_API_KEY=cm_your_actual_key_here

# Optional: Override base URL (default: https://api.callmissed.com/v1)
# CALLMISSED_BASE_URL=https://api.callmissed.com/v1
```

> **Important:** Never use `NEXT_PUBLIC_CALLMISSED_API_KEY`. The key is exclusively accessed server-side.

---

## 5. Local Development Setup

### Prerequisites
- Node.js 18.18+ or 20+
- npm 9+

### Installation & Run

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set your CallMissed API key:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your key: CALLMISSED_API_KEY=cm_...
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Production Build & Deployment

### Build Verification
To run the type checker, linter, and production build:

```bash
npm run build
```

To run the built application:
```bash
npm run start
```

### Deploying to AWS / Vercel / Cloud Hosts
1. Push the repository to GitHub.
2. In your hosting platform settings (e.g. AWS Amplify, Vercel, ECS, or EC2):
   - Add the environment variable `CALLMISSED_API_KEY`.
   - Set the build command to `npm run build`.
   - Set the start command to `npm start`.
3. Verify that the production deployment can reach `https://api.callmissed.com`.

---

## 7. Design Standards & Compliance

- **No Emojis:** Zero emojis are used across UI elements, labels, buttons, headings, or error messages.
- **Consistent Semantic Icons:** Semantic icons are powered by `lucide-react`.
- **Real CallMissed Integration:** Chat, image generation, and voice sessions interact exclusively with official CallMissed endpoints.
- **Responsive Layout:** Optimized for mobile (375px+), tablet (768px+), and desktop (1440px+).
