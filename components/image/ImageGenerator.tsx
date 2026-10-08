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
  Sparkles,
  Square,
  Smartphone,
  Monitor,
  Flame,
  Palette,
} from 'lucide-react';
import { SUPPORTED_IMAGE_MODELS, IMAGE_SIZE_PRESETS } from '@/lib/callmissed/image';
import { SelectDropdown, SelectOption } from '@/components/ui/select-dropdown';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Flux } from '@/components/ui/svgs/modelIcons';

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

// Pietrastudio token aliases
const cream = '#f8f6f2';
const silver = '#c4c4c4';
const midGray = '#6b6b6b';
const inkBlack = '#000000';
const coral = '#ff5c3c';

function getImageModelLogo(id: string) {
  if (id.includes('flux')) return <Flux />;
  if (id.includes('lightning') || id.includes('sdxl')) return <Sparkles className="w-4 h-4 text-[#ff5c3c]" />;
  if (id.includes('phoenix')) return <Flame className="w-4 h-4 text-[#d97706]" />;
  if (id.includes('dreamshaper')) return <Palette className="w-4 h-4 text-[#8b5cf6]" />;
  return <Sparkles className="w-4 h-4 text-[#6b6b6b]" />;
}

function getSizeIcon(value: string) {
  if (value.includes('1024x1024')) return <Square className="w-3.5 h-3.5 text-[#6b6b6b]" />;
  if (value.includes('768x1024')) return <Smartphone className="w-3.5 h-3.5 text-[#6b6b6b]" />;
  return <Monitor className="w-3.5 h-3.5 text-[#6b6b6b]" />;
}

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('flux-2-klein-9b');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [tempNegative, setTempNegative] = useState(negativePrompt);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentImage, setCurrentImage] = useState<GeneratedImageItem | null>(null);
  const [history, setHistory] = useState<GeneratedImageItem[]>([]);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const modelOptions: SelectOption[] = SUPPORTED_IMAGE_MODELS.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.tier})`,
    logo: getImageModelLogo(m.id),
  }));

  const sizeOptions: SelectOption[] = IMAGE_SIZE_PRESETS.map((p) => ({
    value: p.value,
    label: `${p.label} (${p.desc})`,
    logo: getSizeIcon(p.value),
  }));

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
      if (!res.ok) throw new Error(data?.error?.message || `Image generation failed with status ${res.status}`);

      const item = data?.data?.[0];
      if (!item || (!item.b64_json && !item.url)) throw new Error('No image data returned from CallMissed API.');

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
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getImageSrc = (img: GeneratedImageItem) => {
    if (img.b64_json) return `data:image/png;base64,${img.b64_json}`;
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
    <div className="min-h-[calc(100vh-56px)] bg-white text-[#000000] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <span
            style={{
              display: 'inline-block',
              borderRadius: '9999px',
              border: `1px solid ${silver}`,
              background: cream,
              padding: '3px 10px',
              fontSize: '11px',
              letterSpacing: '0.143em',
              textTransform: 'uppercase',
              color: midGray,
              marginBottom: '12px',
              fontWeight: 400,
            }}
          >
            Image Studio
          </span>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.64px',
              color: inkBlack,
              marginBottom: '8px',
            }}
            className="sm:text-[32px]"
          >
            Generate Images
          </h1>
          <p className="text-sm text-[#6b6b6b]">
            Create images from natural-language prompts using CallMissed models.
          </p>
        </div>

        {/* Responsive Grid: Stacks on mobile, 2 columns on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Controls Column (Left) */}
          <div className="lg:col-span-5 space-y-6">
            <div
              style={{
                borderRadius: '20px',
                border: `1px solid ${silver}`,
                background: cream,
                padding: '20px',
                boxShadow: 'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  letterSpacing: '0.143em',
                  textTransform: 'uppercase',
                  color: midGray,
                  marginBottom: '8px',
                }}
              >
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                rows={4}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: `1px solid ${silver}`,
                  background: '#ffffff',
                  padding: '10px 12px',
                  fontSize: '13px',
                  letterSpacing: '-0.01em',
                  color: inkBlack,
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  boxShadow: 'rgba(193, 194, 222, 0.2) 1px 1px 1px 0px inset',
                }}
              />

              {/* Sample Prompts */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.143em', textTransform: 'uppercase', color: midGray, marginBottom: '8px' }}>
                  Examples
                </div>
                <div className="flex flex-col gap-1.5">
                  {SAMPLE_PROMPTS.map((sp, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setPrompt(sp); handleGenerate(sp); }}
                      style={{
                        borderRadius: '8px',
                        border: `1px solid ${silver}`,
                        background: '#ffffff',
                        padding: '8px 10px',
                        fontSize: '12px',
                        letterSpacing: '-0.01em',
                        color: midGray,
                        cursor: 'pointer',
                        textAlign: 'left',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        transition: 'all 0.15s',
                      }}
                      className="hover:border-[#000000] hover:text-[#000000]"
                      title={sp}
                    >
                      &ldquo;{sp}&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              {/* Model & Size - Responsive Dropdowns */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <SelectDropdown
                  label="Model"
                  value={selectedModel}
                  onChange={setSelectedModel}
                  options={modelOptions}
                  triggerClassName="w-full"
                />

                <SelectDropdown
                  label="Size"
                  value={selectedSize}
                  onChange={setSelectedSize}
                  options={sizeOptions}
                  triggerClassName="w-full"
                />
              </div>

              {/* Advanced Drawer Trigger */}
              <div className="mt-3.5 flex items-center justify-between">
                <Drawer open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <DrawerTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setTempNegative(negativePrompt)}
                      className="flex items-center gap-1.5 text-xs text-[#6b6b6b] hover:text-[#000000] font-medium"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Advanced Settings</span>
                      {negativePrompt.trim() && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5c3c]" />
                      )}
                    </button>
                  </DrawerTrigger>
                  <DrawerContent side="right">
                    <DrawerHeader>
                      <DrawerTitle>Advanced Generation Options</DrawerTitle>
                      <DrawerDescription>
                        Fine-tune synthesis parameters and negative prompts for CallMissed image models.
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-2">
                          Negative Prompt (What to exclude)
                        </label>
                        <textarea
                          value={tempNegative}
                          onChange={(e) => setTempNegative(e.target.value)}
                          rows={4}
                          placeholder="e.g., blurry, distorted faces, extra limbs, low resolution, watermark"
                          className="w-full rounded-lg border border-[#c4c4c4] bg-[#ffffff] p-3 text-sm text-[#000000] outline-none focus:border-[#000000] resize-none"
                        />
                        <p className="text-xs text-[#6b6b6b] mt-1.5">
                          Tells the generator what concepts and artifacts to actively avoid.
                        </p>
                      </div>

                      <div className="rounded-lg border border-[#c4c4c4] bg-[#f8f6f2] p-3.5 text-xs text-[#6b6b6b] space-y-1">
                        <span className="font-bold text-[#000000] block mb-1">Model Tip</span>
                        <p>• <strong>FLUX.2 Klein 9B</strong> excels at text rendering and accurate lighting.</p>
                        <p>• <strong>SDXL Lightning</strong> provides near real-time 4-step generation speed.</p>
                      </div>
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                      </DrawerClose>
                      <Button
                        size="sm"
                        onClick={() => {
                          setNegativePrompt(tempNegative);
                          setShowAdvanced(false);
                        }}
                      >
                        Apply Settings
                      </Button>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>

                {negativePrompt.trim() && (
                  <span className="text-[11px] text-[#ff5c3c]">
                    Negative prompt active
                  </span>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={isLoading || !prompt.trim()}
                style={{
                  marginTop: '18px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: coral,
                  color: '#ffffff',
                  padding: '11px 20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  cursor: isLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !prompt.trim() ? 0.35 : 1,
                  transition: 'all 0.15s',
                  boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 0px 0px',
                }}
              >
                {isLoading ? (
                  <><RotateCcw style={{ width: '16px', height: '16px' }} className="animate-spin" /><span>Generating...</span></>
                ) : (
                  <span>Generate Image</span>
                )}
              </button>

              {error && (
                <div
                  style={{
                    marginTop: '14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    borderRadius: '12px',
                    border: `1px solid ${silver}`,
                    background: '#fffbe7',
                    padding: '12px 14px',
                    fontSize: '12px',
                    letterSpacing: '-0.01em',
                    color: inkBlack,
                    boxShadow: 'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px',
                  }}
                >
                  <AlertCircle style={{ width: '15px', height: '15px', color: coral, flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: '2px' }}>Generation Error</p>
                    <p style={{ color: midGray }}>{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Display & Gallery Column (Right) */}
          <div className="lg:col-span-7 space-y-6">
            <div
              style={{
                borderRadius: '20px',
                border: `1px solid ${silver}`,
                background: cream,
                padding: '20px',
                minHeight: '460px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: 'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px',
              }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', padding: '40px 0' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: `1px solid ${silver}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <RotateCcw style={{ width: '22px', height: '22px', color: coral }} className="animate-spin" />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: inkBlack }}>Rendering image...</p>
                  <p style={{ fontSize: '12px', color: midGray, letterSpacing: '-0.01em' }}>Model: {selectedModel}</p>
                </div>
              ) : currentImage ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    className="group"
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '16px',
                      background: '#ffffff',
                      border: `1px solid ${silver}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      maxHeight: '460px',
                    }}
                  >
                    <img
                      src={getImageSrc(currentImage)}
                      alt={currentImage.prompt}
                      style={{ maxHeight: '460px', width: 'auto', objectFit: 'contain' }}
                      className="w-full h-auto"
                    />
                    <div
                      className="opacity-0 group-hover:opacity-100"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        padding: '16px',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <p style={{ fontSize: '11px', color: '#ffffff', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentImage.prompt}
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setIsZoomOpen(true)}
                          style={{
                            borderRadius: '8px',
                            border: `1px solid ${silver}`,
                            background: '#ffffff',
                            padding: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <Maximize2 style={{ width: '14px', height: '14px', color: inkBlack }} />
                        </button>
                        <button
                          onClick={() => handleDownload(currentImage)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '8px',
                            border: 'none',
                            background: coral,
                            padding: '6px 12px',
                            fontSize: '12px',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                        >
                          <Download style={{ width: '13px', height: '13px' }} />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metadata bar */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-2"
                    style={{
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: `1px solid ${silver}`,
                      padding: '10px 14px',
                      fontSize: '12px',
                      letterSpacing: '-0.01em',
                      color: midGray,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span style={{ color: inkBlack, fontWeight: 700 }}>{currentImage.model}</span>
                      <span>{currentImage.size}</span>
                    </div>
                    <button
                      onClick={() => copyPromptText(currentImage.prompt)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: midGray,
                        fontSize: '12px',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {copiedPrompt ? (
                        <><Check style={{ width: '13px', height: '13px', color: '#57ad6a' }} /><span style={{ color: '#57ad6a' }}>Copied</span></>
                      ) : (
                        <><Copy style={{ width: '13px', height: '13px' }} /><span>Copy Prompt</span></>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center', padding: '40px 0', color: midGray }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: `1px solid ${silver}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Layers style={{ width: '22px', height: '22px', color: midGray }} />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: inkBlack }}>No image generated yet</p>
                  <p style={{ fontSize: '12px', color: midGray, maxWidth: '280px', lineHeight: 1.5 }}>
                    Enter a prompt on the left to generate an image using CallMissed.
                  </p>
                </div>
              )}
            </div>

            {/* History Gallery */}
            {history.length > 0 && (
              <div
                style={{
                  borderRadius: '16px',
                  border: `1px solid ${silver}`,
                  background: cream,
                  padding: '16px',
                  boxShadow: 'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    letterSpacing: '0.143em',
                    textTransform: 'uppercase',
                    color: midGray,
                    marginBottom: '10px',
                  }}
                >
                  <History style={{ width: '13px', height: '13px' }} />
                  Session History ({history.length})
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {history.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setCurrentImage(img)}
                      className="group"
                      style={{
                        aspectRatio: '1',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        borderRadius: '10px',
                        border: `2px solid ${currentImage?.id === img.id ? coral : silver}`,
                        position: 'relative',
                        transition: 'all 0.15s',
                      }}
                    >
                      <img src={getImageSrc(img)} alt={img.prompt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div
                        className="opacity-0 group-hover:opacity-100"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'flex-end',
                          padding: '6px',
                          transition: 'opacity 0.15s',
                        }}
                      >
                        <p style={{ fontSize: '10px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {img.prompt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomOpen && currentImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            padding: '16px',
          }}
        >
          <div style={{ position: 'relative', maxHeight: '90vh', maxWidth: '90vw' }}>
            <button
              onClick={() => setIsZoomOpen(false)}
              style={{
                position: 'absolute',
                top: '-36px',
                right: 0,
                borderRadius: '8px',
                border: `1px solid ${silver}`,
                background: '#ffffff',
                padding: '6px',
                cursor: 'pointer',
              }}
            >
              <X style={{ width: '16px', height: '16px', color: inkBlack }} />
            </button>
            <img
              src={getImageSrc(currentImage)}
              alt={currentImage.prompt}
              style={{
                maxHeight: '85vh',
                maxWidth: '85vw',
                borderRadius: '16px',
                objectFit: 'contain',
                background: '#ffffff',
                border: `1px solid ${silver}`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
