/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Maximize2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  History,
  X,
  Layers,
} from 'lucide-react';
import { SUPPORTED_IMAGE_MODELS, IMAGE_SIZE_PRESETS } from '@/lib/callmissed/image';

interface GeneratedImageItem {
  id: string;
  url?: string;
  b64_json?: string;
  prompt: string;
  model: string;
  size: string;
  timestamp: number;
}

const SAMPLE_PROMPTS = [
  'A futuristic high-tech city in Kanpur with autonomous vehicles, cinematic lighting, 8k',
  'A cute robot reading an ancient illuminated manuscript in a cozy library, soft ambient lighting',
  'Hyperrealistic portrait of an Indian royal astronaut looking towards the stars, dramatic backlight',
  'Cyberpunk street food stall in Neo-Tokyo with glowing neon signs and rainy reflections',
];

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('flux-2-klein-9b');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentImage, setCurrentImage] = useState<GeneratedImageItem | null>(null);
  const [history, setHistory] = useState<GeneratedImageItem[]>([]);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleGenerate = async (presetPrompt?: string) => {
    const activePrompt = (presetPrompt !== undefined ? presetPrompt : prompt).trim();
    if (!activePrompt || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          model: selectedModel,
          size: selectedSize,
          negative_prompt: negativePrompt.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || `Image generation failed with status ${res.status}`);
      }

      const item = data?.data?.[0];
      if (!item || (!item.b64_json && !item.url)) {
        throw new Error('No image data returned from CallMissed API.');
      }

      const newImage: GeneratedImageItem = {
        id: `img-${Date.now()}`,
        url: item.url,
        b64_json: item.b64_json,
        prompt: activePrompt,
        model: selectedModel,
        size: selectedSize,
        timestamp: Date.now(),
      };

      setCurrentImage(newImage);
      setHistory((prev) => [newImage, ...prev]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageSrc = (img: GeneratedImageItem) => {
    if (img.b64_json) {
      return `data:image/png;base64,${img.b64_json}`;
    }
    return img.url || '';
  };

  const handleDownload = (img: GeneratedImageItem) => {
    const link = document.createElement('a');
    link.href = getImageSrc(img);
    link.download = `callmissed-${img.model}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyPromptText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2">
            <span className="rounded-md bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-400 border border-violet-500/20">
              CallMissed Image Studio
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            AI Image Studio
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Generate high-resolution visual assets using CallMissed&apos;s image generation API.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Controls Column (Left) */}
          <div className="space-y-6 lg:col-span-5">
            {/* Prompt Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                Prompt Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate in detail..."
                rows={4}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />

              {/* Sample Prompts */}
              <div className="mt-3">
                <div className="text-xs font-medium text-zinc-400 mb-1.5 flex items-center space-x-1">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  <span>Try an example prompt:</span>
                </div>
                <div className="space-y-1.5">
                  {SAMPLE_PROMPTS.map((sp, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(sp);
                        handleGenerate(sp);
                      }}
                      className="w-full rounded-lg bg-zinc-950/60 p-2 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800/80 transition-all truncate block"
                    >
                      &ldquo;{sp}&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              {/* Model & Size Selectors */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs sm:text-sm text-zinc-100 outline-none focus:border-violet-500"
                  >
                    {SUPPORTED_IMAGE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.tier})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Aspect Ratio & Size
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs sm:text-sm text-zinc-100 outline-none focus:border-violet-500"
                  >
                    {IMAGE_SIZE_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} - {p.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced toggle */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-zinc-200 font-medium"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>{showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-3 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Negative Prompt (Things to avoid)
                      </label>
                      <input
                        type="text"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="e.g. blurry, low quality, distorted"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={isLoading || !prompt.trim()}
                className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating Image...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate with CallMissed</span>
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 flex items-start space-x-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-200">Generation Error</p>
                    <p className="text-red-300/80 mt-0.5">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Display & Gallery Column (Right) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Main Stage */}
            <div className="flex min-h-[460px] flex-col justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl relative overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-20">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-600/10 border border-violet-500/20">
                    <Sparkles className="h-10 w-10 text-violet-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-base font-semibold text-zinc-100">
                      Rendering Visual Asset...
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                      CallMissed is running inference on <span className="text-violet-400 font-mono">{selectedModel}</span>
                    </p>
                  </div>
                  <div className="w-48 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ) : currentImage ? (
                <div className="flex flex-col space-y-4">
                  {/* Image Display */}
                  <div className="relative group overflow-hidden rounded-xl border border-zinc-800 bg-black flex items-center justify-center max-h-[500px]">
                    <img
                      src={getImageSrc(currentImage)}
                      alt={currentImage.prompt}
                      className="max-h-[500px] w-auto object-contain transition-transform duration-300"
                    />

                    {/* Overlay Action Buttons */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                      <div className="text-xs text-zinc-300 truncate max-w-md">
                        {currentImage.prompt}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIsZoomOpen(true)}
                          className="rounded-lg bg-zinc-900/80 p-2 text-white hover:bg-zinc-800 transition-colors backdrop-blur-sm"
                          title="Full screen view"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(currentImage)}
                          className="flex items-center space-x-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 shadow-md shadow-violet-600/30 transition-colors"
                          title="Download image"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metadata bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-950 p-3.5 border border-zinc-800/80 text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
                        {currentImage.model}
                      </span>
                      <span className="text-zinc-400">{currentImage.size}</span>
                    </div>

                    <button
                      onClick={() => copyPromptText(currentImage.prompt)}
                      className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 text-center py-20">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-500">
                    <Layers className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-300">Ready to Generate</h3>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Enter a prompt or pick an example to generate high quality images using CallMissed.
                  </p>
                </div>
              )}
            </div>

            {/* Session History Gallery */}
            {history.length > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                  <History className="h-4 w-4 text-violet-400" />
                  <span>Session Gallery ({history.length})</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {history.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setCurrentImage(img)}
                      className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl border transition-all ${
                        currentImage?.id === img.id
                          ? 'border-violet-500 ring-2 ring-violet-500/30'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <img
                        src={getImageSrc(img)}
                        alt={img.prompt}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                        <p className="text-[10px] text-zinc-200 truncate">{img.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {isZoomOpen && currentImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-12 right-0 rounded-full bg-zinc-800 p-2 text-white hover:bg-zinc-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={getImageSrc(currentImage)}
              alt={currentImage.prompt}
              className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
