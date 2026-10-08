import { callMissedFetch } from './client';
import { ImageGenerationRequest, ImageGenerationResponse } from '@/types/callmissed';

export const SUPPORTED_IMAGE_MODELS = [
  { id: 'flux-2-klein-9b', name: 'FLUX.2 Klein 9B', tier: 'Free', bestFor: 'Photorealism & marketing' },
  { id: 'sdxl-lightning', name: 'SDXL Lightning', tier: 'Free', bestFor: 'Ultra-fast prototyping' },
  { id: 'phoenix-1.0', name: 'Phoenix 1.0', tier: 'Free', bestFor: 'Photorealistic portraits' },
  { id: 'lucid-origin', name: 'Lucid Origin', tier: 'Free', bestFor: 'Cinematic concept art' },
  { id: 'dreamshaper-8-lcm', name: 'Dreamshaper 8 LCM', tier: 'Free', bestFor: 'Stylized illustration' },
];

export const IMAGE_SIZE_PRESETS = [
  { label: 'Square (1:1)', value: '1024x1024', desc: '1024 × 1024 px' },
  { label: 'Portrait (3:4)', value: '768x1024', desc: '768 × 1024 px' },
  { label: 'Landscape (4:3)', value: '1024x768', desc: '1024 × 768 px' },
  { label: 'Wide (16:9)', value: '1536x1024', desc: '1536 × 1024 px' },
];

export async function generateImage(
  params: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  const model = params.model || 'flux-2-klein-9b';
  const body: Record<string, unknown> = {
    model,
    prompt: params.prompt,
    n: params.n ?? 1,
    size: params.size || '1024x1024',
    response_format: params.response_format || 'b64_json',
  };

  if (params.negative_prompt && params.negative_prompt.trim()) {
    body.negative_prompt = params.negative_prompt.trim();
  }

  if (params.seed !== undefined && params.seed !== null) {
    body.seed = params.seed;
  }

  return await callMissedFetch<ImageGenerationResponse>('/images/generations', {
    method: 'POST',
    body,
  });
}

export async function getImageHistory(limit: number = 20): Promise<Record<string, unknown>> {
  return await callMissedFetch<Record<string, unknown>>(`/images/history?limit=${limit}`, {
    method: 'GET',
  });
}
