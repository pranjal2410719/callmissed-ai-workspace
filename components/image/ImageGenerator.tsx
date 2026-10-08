/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import {
  Download,
  Maximize2,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  Sliders,
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
  'A minimalist architectural pavilion in Kyoto, morning light, graphite pencil sketch',
  'A clean studio photograph of an industrial design chair against a white wall',
  'A vintage typewriter on a clean wooden desk with a single cup of black coffee',
  'Monochrome aerial landscape of mist rolling over mountain ridges',
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
    <div className="min-h-[calc(100vh-3.5rem)] bg-white text-[#0d0d0d] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2">
            <span className="rounded-[6px] border border-[#0000001a] bg-[#f9f9f9] px-2 py-0.5 text-xs font-normal text-[#5d5d5d]">
              Image Studio
            </span>
          </div>
          <h1 className="mt-2 text-[24px] font-semibold leading-[1.33] text-[#0d0d0d]">
            Image Studio
          </h1>
          <p className="mt-1 text-sm text-[#5d5d5d]">
            Generate images from natural-language prompts using CallMissed models.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Controls Column (Left) */}
          <div className="space-y-6 lg:col-span-5">
            {/* Prompt Card */}
            <div className="rounded-[10px] border border-[#0000001a] bg-[#f9f9f9] p-5">
              <label className="block text-xs font-medium uppercase tracking-wider text-[#5d5d5d] mb-2">
                Prompt Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                rows={4}
                className="w-full rounded-[10px] border border-[#0000001a] bg-white p-3 text-sm text-[#0d0d0d] placeholder-[#8f8f8f] outline-none focus:border-[#0d0d0d]"
              />

              {/* Sample Prompts */}
              <div className="mt-3">
                <div className="text-xs font-medium text-[#5d5d5d] mb-1.5">
                  Example prompts:
                </div>
                <div className="space-y-1.5">
                  {SAMPLE_PROMPTS.map((sp, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(sp);
                        handleGenerate(sp);
                      }}
                      className="w-full rounded-[8px] border border-[#0000001a] bg-white p-2 text-left text-xs text-[#5d5d5d] hover:text-[#0d0d0d] hover:bg-[#0000000d] transition-all truncate block"
                    >
                      &ldquo;{sp}&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              {/* Model & Size Selectors */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5d5d5d] mb-1.5">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full rounded-[10px] border border-[#0000001a] bg-white px-2.5 py-1.5 text-xs sm:text-sm text-[#0d0d0d] outline-none focus:border-[#0d0d0d]"
                  >
                    {SUPPORTED_IMAGE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.tier})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5d5d5d] mb-1.5">
                    Aspect Ratio & Size
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full rounded-[10px] border border-[#0000001a] bg-white px-2.5 py-1.5 text-xs sm:text-sm text-[#0d0d0d] outline-none focus:border-[#0d0d0d]"
                  >
                    {IMAGE_SIZE_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} ({p.desc})
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
                  className="flex items-center space-x-1 text-xs text-[#5d5d5d] hover:text-[#0d0d0d] font-medium"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>{showAdvanced ? 'Hide options' : 'More options'}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-2.5 space-y-2 rounded-[10px] border border-[#0000001a] bg-white p-3">
                    <div>
                      <label className="block text-xs font-normal text-[#5d5d5d] mb-1">
                        Negative prompt:
                      </label>
                      <input
                        type="text"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="e.g. blurry, low quality, distorted"
                        className="w-full rounded-[8px] border border-[#0000001a] bg-[#f9f9f9] px-2.5 py-1 text-xs text-[#0d0d0d] outline-none focus:border-[#0d0d0d]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={isLoading || !prompt.trim()}
                className="mt-6 flex w-full items-center justify-center space-x-2 rounded-[10px] bg-[#0d0d0d] px-4 py-2.5 font-medium text-sm text-white hover:bg-[#000000] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    <span>Generating image...</span>
                  </>
                ) : (
                  <span>Generate</span>
                )}
              </button>

              {error && (
                <div className="mt-4 flex items-start space-x-2.5 rounded-[10px] border border-[#0000001a] bg-white p-3 text-xs text-[#0d0d0d]">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#5d5d5d] mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Generation Error</p>
                    <p className="text-[#5d5d5d] mt-0.5">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Display & Gallery Column (Right) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Main Stage */}
            <div className="flex min-h-[460px] flex-col justify-center rounded-[10px] border border-[#0000001a] bg-[#f9f9f9] p-6 relative">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-20 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#0000001a] bg-white text-[#0d0d0d]">
                    <RotateCcw className="h-6 w-6 animate-spin text-[#0d0d0d]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0d0d0d]">
                    Rendering image...
                  </h3>
                  <p className="text-xs text-[#5d5d5d]">
                    Running model: <span className="font-mono text-[#0d0d0d]">{selectedModel}</span>
                  </p>
                </div>
              ) : currentImage ? (
                <div className="flex flex-col space-y-4">
                  {/* Image Display */}
                  <div className="relative group overflow-hidden rounded-[10px] border border-[#0000001a] bg-white flex items-center justify-center max-h-[500px]">
                    <img
                      src={getImageSrc(currentImage)}
                      alt={currentImage.prompt}
                      className="max-h-[500px] w-auto object-contain"
                    />

                    {/* Overlay Action Buttons */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                      <div className="text-xs text-white truncate max-w-md">
                        {currentImage.prompt}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIsZoomOpen(true)}
                          className="rounded-[8px] border border-[#0000001a] bg-white p-1.5 text-[#0d0d0d] hover:bg-[#f9f9f9] transition-colors"
                          title="Full screen view"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(currentImage)}
                          className="flex items-center space-x-1.5 rounded-[8px] bg-[#0d0d0d] px-3 py-1.5 text-xs font-medium text-white hover:bg-black transition-colors"
                          title="Download image"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metadata bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-white p-3 border border-[#0000001a] text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-[#0d0d0d]">
                        {currentImage.model}
                      </span>
                      <span className="text-[#5d5d5d]">{currentImage.size}</span>
                    </div>

                    <button
                      onClick={() => copyPromptText(currentImage.prompt)}
                      className="flex items-center space-x-1 text-[#5d5d5d] hover:text-[#0d0d0d] transition-colors"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#0d0d0d]" />
                          <span className="text-[#0d0d0d]">Copied</span>
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
                <div className="flex flex-col items-center justify-center space-y-2.5 text-center py-20 text-[#8f8f8f]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#0000001a] bg-white text-[#5d5d5d]">
                    <Layers className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-medium text-[#0d0d0d]">No image generated yet</h3>
                  <p className="text-xs text-[#5d5d5d] max-w-sm">
                    Enter a prompt to generate an image using CallMissed.
                  </p>
                </div>
              )}
            </div>

            {/* Session History Gallery */}
            {history.length > 0 && (
              <div className="rounded-[10px] border border-[#0000001a] bg-[#f9f9f9] p-4">
                <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-wider text-[#5d5d5d] mb-3">
                  <History className="h-3.5 w-3.5" />
                  <span>Session History ({history.length})</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {history.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setCurrentImage(img)}
                      className={`group relative aspect-square cursor-pointer overflow-hidden rounded-[8px] border transition-all ${
                        currentImage?.id === img.id
                          ? 'border-[#0d0d0d]'
                          : 'border-[#0000001a] hover:border-[#5d5d5d]'
                      }`}
                    >
                      <img
                        src={getImageSrc(img)}
                        alt={img.prompt}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                        <p className="text-[10px] text-white truncate">{img.prompt}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000080] p-4">
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-10 right-0 rounded-[8px] bg-white p-1.5 text-[#0d0d0d] border border-[#0000001a]"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={getImageSrc(currentImage)}
              alt={currentImage.prompt}
              className="max-h-[85vh] max-w-[85vw] rounded-[10px] object-contain bg-white border border-[#0000001a]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
