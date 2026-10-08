export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id?: string;
  role: ChatRole;
  content: string;
  timestamp?: number;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    message: {
      role: ChatRole;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
  response_format?: 'b64_json' | 'url';
  negative_prompt?: string;
  seed?: number;
  steps?: number;
}

export interface ImageGenerationItem {
  b64_json?: string;
  url?: string;
  revised_prompt?: string | null;
}

export interface ImageGenerationResponse {
  created: number;
  data: ImageGenerationItem[];
}

export interface VoiceSessionConfig {
  system_prompt?: string;
  greeting?: string;
  voice?: string;
  language?: string;
  llm_model?: string;
  stt_model?: string;
  tts_model?: string;
  tts_provider?: string;
  max_duration_seconds?: number;
  webhook_url?: string;
  metadata?: Record<string, unknown>;
}

export interface VoiceSessionResponse {
  id: string;
  tenant_id?: string;
  status: string;
  config: VoiceSessionConfig;
  ws_url: string;
  token: string;
  created_at: string;
}

export interface TranscriptTurn {
  id?: string;
  turn_index?: number;
  user_transcript?: string;
  agent_response?: string;
  interrupted?: boolean;
  stt_ms?: number;
  first_token_ms?: number;
  tts_ttfb_ms?: number;
  eou_delay_ms?: number;
  first_audio_ms?: number;
  total_ms?: number;
  llm_model?: string;
  created_at?: string;
}

export type VoiceAgentState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'ended'
  | 'error';
