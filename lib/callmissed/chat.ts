import { callMissedFetch, getCallMissedApiKey, CallMissedError } from './client';
import { ChatCompletionRequest, ChatCompletionResponse } from '@/types/callmissed';

export const SUPPORTED_CHAT_MODELS = [
  { id: 'sarvam-105b', name: 'Sarvam 105B (Indic & English)', provider: 'Sarvam AI', speed: 'Fast' },
  { id: 'kimi-k2.5', name: 'Kimi K2.5', provider: 'Moonshot AI', speed: 'Fast' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', speed: 'Fast' },
  { id: 'gemma-4-31b', name: 'Gemma 4 31B', provider: 'Google', speed: 'Fast' },
  { id: 'gpt-5.6-luna', name: 'GPT 5.6 Luna', provider: 'OpenAI', speed: 'Flagship' },
];

export async function createChatCompletion(
  params: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const model = params.model || 'sarvam-105b';
  const body: ChatCompletionRequest = {
    model,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.max_tokens ?? 1024,
    stream: false,
  };

  return await callMissedFetch<ChatCompletionResponse>('/chat/completions', {
    method: 'POST',
    body,
  });
}

export async function createChatStream(params: ChatCompletionRequest): Promise<Response> {
  const apiKey = getCallMissedApiKey();
  const model = params.model || 'sarvam-105b';
  const baseUrl = process.env.CALLMISSED_BASE_URL || 'https://api.callmissed.com/v1';

  const body = {
    model,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.max_tokens ?? 1024,
    stream: true,
  };

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errJson: Record<string, unknown> | null = null;
      try {
        errJson = (await response.json()) as Record<string, unknown>;
      } catch {}
      const errObj = errJson?.error as Record<string, unknown> | undefined;
      const errMsg =
        (typeof errObj?.message === 'string' ? errObj.message : null) ||
        (typeof errJson?.message === 'string' ? errJson.message : null) ||
        `API error (${response.status})`;
      throw new CallMissedError(errMsg, response.status);
    }

    return response;
  } catch (err: unknown) {
    if (err instanceof CallMissedError) throw err;
    const msg = err instanceof Error ? err.message : 'Chat stream failed';
    throw new CallMissedError(`Failed to initiate chat stream: ${msg}`, 502);
  }
}
