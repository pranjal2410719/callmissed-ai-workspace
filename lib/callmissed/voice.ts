import { callMissedFetch } from './client';
import { VoiceSessionConfig, VoiceSessionResponse, TranscriptTurn } from '@/types/callmissed';

export const SUPPORTED_VOICES = [
  { id: 'shubh', name: 'Shubh (Natural, Male)', lang: 'en-IN / hi-IN', provider: 'sarvam' },
  { id: 'maya', name: 'Maya (Professional, Female)', lang: 'en-IN / hi-IN', provider: 'sarvam' },
  { id: 'arun', name: 'Arun (Warm, Male)', lang: 'en-IN / hi-IN', provider: 'sarvam' },
  { id: 'priya', name: 'Priya (Friendly, Female)', lang: 'en-IN / hi-IN', provider: 'sarvam' },
  { id: 'aditi', name: 'Aditi (Crisp, Female)', lang: 'en-IN / hi-IN', provider: 'sarvam' },
];

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', name: 'English (India)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'en-US', name: 'English (US)' },
];

export const SUPPORTED_VOICE_MODELS = [
  { id: 'kimi-k2.5', name: 'Kimi K2.5 (Recommended for Voice)', desc: 'Low latency, natural cadence' },
  { id: 'sarvam-105b', name: 'Sarvam 105B', desc: 'Optimized for Indian languages & English' },
  { id: 'gemma-4-31b', name: 'Gemma 4 31B', desc: 'Fast general-purpose LLM' },
];

export async function createVoiceSession(
  config: VoiceSessionConfig = {}
): Promise<VoiceSessionResponse> {
  const body: VoiceSessionConfig = {
    system_prompt:
      config.system_prompt ||
      'You are a helpful and concise AI voice assistant. Keep answers natural, conversational, and limited to 1-2 sentences.',
    greeting: config.greeting || 'Hello! How can I help you today?',
    voice: config.voice || 'shubh',
    language: config.language || 'en-IN',
    llm_model: config.llm_model || 'kimi-k2.5',
    max_duration_seconds: config.max_duration_seconds || 600,
    ...(config.stt_model ? { stt_model: config.stt_model } : {}),
    ...(config.tts_model ? { tts_model: config.tts_model } : {}),
    ...(config.tts_provider ? { tts_provider: config.tts_provider } : {}),
  };

  return await callMissedFetch<VoiceSessionResponse>('/voice/sessions', {
    method: 'POST',
    body,
  });
}

export async function getVoiceSession(sessionId: string): Promise<VoiceSessionResponse> {
  return await callMissedFetch<VoiceSessionResponse>(`/voice/sessions/${sessionId}`, {
    method: 'GET',
  });
}

export async function getVoiceTranscript(
  sessionId: string,
  format: 'json' | 'txt' | 'srt' = 'json'
): Promise<TranscriptTurn[] | string> {
  return await callMissedFetch<TranscriptTurn[] | string>(
    `/voice/sessions/${sessionId}/transcript?format=${format}`,
    {
      method: 'GET',
    }
  );
}

export async function endVoiceSession(sessionId: string): Promise<void> {
  await callMissedFetch<void>(`/voice/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}
