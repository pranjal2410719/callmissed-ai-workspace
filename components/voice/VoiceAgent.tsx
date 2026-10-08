'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sliders,
  Volume2,
  AlertCircle,
  Radio,
  FileText,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { Room, RoomEvent, Track, Participant, TranscriptionSegment } from 'livekit-client';
import {
  SUPPORTED_VOICES,
  SUPPORTED_LANGUAGES,
  SUPPORTED_VOICE_MODELS,
} from '@/lib/callmissed/voice';
import { VoiceAgentState, TranscriptTurn } from '@/types/callmissed';

interface LiveTranscriptItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export const VoiceAgent: React.FC = () => {
  const [state, setState] = useState<VoiceAgentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Audio & Mute State
  const [isMuted, setIsMuted] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Configuration options
  const [selectedVoice, setSelectedVoice] = useState('shubh');
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [selectedModel, setSelectedModel] = useState('kimi-k2.5');
  const [greeting, setGreeting] = useState('Hello! I am your CallMissed AI assistant. How can I help you today?');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful, conversational AI assistant. Keep responses natural, brief, and concise.'
  );
  const [showSettings, setShowSettings] = useState(false);

  // Live Transcripts
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([]);
  const [postCallTurns, setPostCallTurns] = useState<TranscriptTurn[] | null>(null);

  // LiveKit Room ref & audio elements ref
  const roomRef = useRef<Room | null>(null);
  const audioElementsRef = useRef<HTMLMediaElement[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const cleanupCall = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (roomRef.current) {
      try {
        roomRef.current.disconnect();
      } catch (e) {
        console.error('Error disconnecting room:', e);
      }
      roomRef.current = null;
    }

    // Clean up attached audio elements
    audioElementsRef.current.forEach((el) => {
      try {
        el.pause();
        el.remove();
      } catch {}
    });
    audioElementsRef.current = [];
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  const startVoiceCall = async () => {
    try {
      setErrorMessage(null);
      setState('connecting');
      setTranscripts([]);
      setPostCallTurns(null);
      setCallDuration(0);
      setUserSpeaking(false);

      // 1. Create session via server route
      const res = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice: selectedVoice,
          language: selectedLanguage,
          llm_model: selectedModel,
          greeting: greeting.trim() || undefined,
          system_prompt: systemPrompt.trim() || undefined,
          max_duration_seconds: 600,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || `Failed to create session (${res.status})`);
      }

      const { wsUrl, token, id } = data;
      if (!wsUrl || !token) {
        throw new Error('CallMissed media connection credentials were not returned.');
      }

      setSessionId(id);

      // 2. Initialize LiveKit WebRTC client
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      // Handle subscribed tracks (Agent Audio)
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          audioElementsRef.current.push(audioElement);
          document.body.appendChild(audioElement);
        }
      });

      // Handle Live Transcription with incremental segment update & deduplication
      room.on(
        RoomEvent.TranscriptionReceived,
        (segments: TranscriptionSegment[], participant?: Participant) => {
          setTranscripts((prev) => {
            const updated = [...prev];
            for (const seg of segments) {
              if (!seg.text || !seg.text.trim()) continue;
              const isLocal = participant?.isLocal ?? false;
              const sender: 'user' | 'agent' = isLocal ? 'user' : 'agent';
              const segId = seg.id || `seg-${sender}-${Date.now()}`;

              const existingIdx = updated.findIndex((item) => item.id === segId);
              if (existingIdx >= 0) {
                // Update in-place to avoid duplicate bubble entries during streaming
                updated[existingIdx] = {
                  ...updated[existingIdx],
                  text: seg.text,
                };
              } else {
                // Append new segment
                updated.push({
                  id: segId,
                  sender,
                  text: seg.text,
                  timestamp: Date.now(),
                });
              }
            }
            return updated;
          });
        }
      );

      // Handle Active Speakers
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const isAgentSpeaking = speakers.some((s) => !s.isLocal);
        const isUserSpeaking = speakers.some((s) => s.isLocal);
        setUserSpeaking(isUserSpeaking);

        if (isAgentSpeaking) {
          setState('speaking');
        } else if (isUserSpeaking) {
          setState('listening');
        }
      });

      // Handle Disconnection
      room.on(RoomEvent.Disconnected, () => {
        setState('ended');
        cleanupCall();
      });

      // 3. Connect to media server
      await room.connect(wsUrl, token);

      // 4. Request microphone permission and publish local audio
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (micErr: unknown) {
        const msg = micErr instanceof Error ? micErr.message : 'Microphone access denied';
        throw new Error(`Microphone permission error: ${msg}. Please enable your microphone.`);
      }

      setState('listening');

      // Start call timer
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voice session failed';
      setErrorMessage(msg);
      setState('error');
      cleanupCall();
    }
  };

  const endVoiceCall = async () => {
    setState('ended');
    const activeSessionId = sessionId;
    cleanupCall();

    // Fetch final structured transcript
    if (activeSessionId) {
      try {
        const res = await fetch(`/api/voice/transcript?id=${activeSessionId}`);
        const data = await res.json();
        if (data?.transcript && Array.isArray(data.transcript)) {
          setPostCallTurns(data.transcript);
        }
      } catch (e) {
        console.error('Failed to fetch call transcript:', e);
      }
    }
  };

  const toggleMute = async () => {
    if (!roomRef.current?.localParticipant) return;
    const newMutedState = !isMuted;
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
      setIsMuted(newMutedState);
    } catch (e) {
      console.error('Error toggling microphone:', e);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCallActive = state === 'connecting' || state === 'listening' || state === 'speaking' || state === 'processing';

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white text-[#0d0d0d] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-[6px] border border-[#0000001a] bg-[#f9f9f9] px-2 py-0.5 text-xs font-normal text-[#5d5d5d] flex items-center space-x-1.5">
                <Radio className="h-3 w-3" />
                <span>CallMissed Voice Session</span>
              </span>
            </div>
            <h1 className="mt-2 text-[24px] font-semibold leading-[1.33] text-[#0d0d0d]">
              Voice Agent
            </h1>
            <p className="mt-1 text-sm text-[#5d5d5d]">
              Real-time WebRTC conversational voice interaction (STT → LLM → TTS).
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            {!isCallActive && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center space-x-1.5 rounded-[10px] px-3 py-1.5 text-xs sm:text-sm font-medium border transition-colors ${
                  showSettings
                    ? 'border-[#0d0d0d] bg-[#0000000d] text-[#0d0d0d]'
                    : 'border-[#0000001a] bg-white text-[#5d5d5d] hover:text-[#0d0d0d] hover:bg-[#0000000d]'
                }`}
              >
                <Sliders className="h-4 w-4" />
                <span>Configuration</span>
              </button>
            )}

            {isCallActive && (
              <div className="flex items-center space-x-1.5 rounded-[10px] border border-[#0000001a] bg-[#f9f9f9] px-3 py-1.5 text-xs text-[#0d0d0d] font-mono">
                <Clock className="h-3.5 w-3.5 text-[#5d5d5d]" />
                <span>{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Drawer */}
        {showSettings && !isCallActive && (
          <div className="mb-8 rounded-[10px] border border-[#0000001a] bg-[#f9f9f9] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#0000001a] pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0d0d0d] flex items-center space-x-2">
                <Sliders className="h-3.5 w-3.5" />
                <span>Agent Settings</span>
              </h3>
              <span className="text-xs text-[#5d5d5d]">Server-side session parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#5d5d5d] mb-1">
                  Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full rounded-[8px] border border-[#0000001a] bg-white px-2.5 py-1.5 text-xs sm:text-sm text-[#0d0d0d] outline-none focus:border-[#0d0d0d]"
                >
                  {SUPPORTED_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5d5d5d] mb-1">
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full rounded-[8px] border border-[#0000001a] bg-white px-2.5 py-1.5 text-xs sm:text-sm text-[#0d0d0d] outline-none focus:border-[#0d0d0d]"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5d5d5d] mb-1">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-[8px] border border-[#0000001a] bg-white px-2.5 py-1.5 text-xs sm:text-sm text-[#0d0d0d] outline-none focus:border-[#0d0d0d]"
                >
                  {SUPPORTED_VOICE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-[#5d5d5d] mb-1">
                  Agent Greeting:
                </label>
                <input
                  type="text"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="w-full rounded-[8px] border border-[#0000001a] bg-white px-2.5 py-1.5 text-xs sm:text-sm text-[#0d0d0d] outline-none focus:border-[#0d0d0d]"
                  placeholder="e.g. Hello! How can I assist you today?"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5d5d5d] mb-1">
                  Instructions:
                </label>
                <input
                  type="text"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full rounded-[8px] border border-[#0000001a] bg-white px-2.5 py-1.5 text-xs sm:text-sm text-[#0d0d0d] outline-none focus:border-[#0d0d0d]"
                  placeholder="e.g. You are a helpful assistant..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Voice Agent Experience */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Voice Indicator & Controls Column (Left) */}
          <div className="flex flex-col items-center justify-between rounded-[10px] border border-[#0000001a] bg-[#f9f9f9] p-8 lg:col-span-6 min-h-[460px]">
            {/* Status indicator badge */}
            <div className="flex items-center space-x-2 rounded-[10px] bg-white px-3 py-1 border border-[#0000001a]">
              <span
                className={`h-2 w-2 rounded-full ${
                  state === 'idle'
                    ? 'bg-[#8f8f8f]'
                    : state === 'connecting'
                    ? 'bg-[#0d0d0d] animate-pulse'
                    : state === 'speaking'
                    ? 'bg-[#0d0d0d]'
                    : state === 'listening'
                    ? 'bg-[#0d0d0d]'
                    : state === 'ended'
                    ? 'bg-[#8f8f8f]'
                    : 'bg-[#0d0d0d]'
                }`}
              />
              <span className="text-xs font-medium text-[#0d0d0d]">
                {state === 'idle' && 'Ready'}
                {state === 'connecting' && 'Connecting...'}
                {state === 'listening' && (userSpeaking ? 'Listening to you...' : 'Listening')}
                {state === 'speaking' && 'Agent speaking...'}
                {state === 'processing' && 'Processing...'}
                {state === 'ended' && 'Call ended'}
                {state === 'error' && 'Connection error'}
              </span>
            </div>

            {/* Restrained Central Voice Orb */}
            <div className="my-8 flex items-center justify-center">
              <div
                className={`flex h-36 w-36 items-center justify-center rounded-full border transition-all duration-300 ${
                  state === 'speaking'
                    ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white'
                    : state === 'listening'
                    ? 'border-[#0d0d0d] bg-white text-[#0d0d0d]'
                    : state === 'connecting'
                    ? 'border-[#0000001a] bg-[#f9f9f9] text-[#0d0d0d]'
                    : 'border-[#0000001a] bg-white text-[#5d5d5d]'
                }`}
              >
                {state === 'speaking' ? (
                  <Volume2 className="h-10 w-10 text-white" />
                ) : state === 'listening' ? (
                  <Mic className="h-10 w-10 text-[#0d0d0d]" />
                ) : state === 'connecting' ? (
                  <RotateCcw className="h-8 w-8 text-[#0d0d0d] animate-spin" />
                ) : (
                  <Mic className="h-8 w-8 text-[#8f8f8f]" />
                )}
              </div>
            </div>

            {/* Hint message */}
            <p className="text-center text-xs text-[#5d5d5d] max-w-xs mb-4">
              {state === 'idle' && 'Click below to start a natural voice conversation.'}
              {state === 'connecting' && 'Connecting to WebRTC media server...'}
              {state === 'listening' && 'Speak into your microphone. The agent will listen and reply.'}
              {state === 'speaking' && 'Agent is speaking. You can interrupt anytime.'}
              {state === 'ended' && 'Call finished. Start a new call or inspect the transcript.'}
              {state === 'error' && errorMessage}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2.5 w-full justify-center">
              {!isCallActive ? (
                <button
                  onClick={startVoiceCall}
                  className="flex items-center space-x-2 rounded-[10px] bg-[#0d0d0d] px-5 py-2.5 font-medium text-sm text-white hover:bg-black transition-all"
                >
                  <Mic className="h-4 w-4" />
                  <span>Start Conversation</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleMute}
                    className={`flex items-center space-x-1.5 rounded-[10px] px-3.5 py-2 text-xs font-medium border border-[#0000001a] transition-all ${
                      isMuted
                        ? 'bg-[#0d0d0d] text-white'
                        : 'bg-white text-[#0d0d0d] hover:bg-[#0000000d]'
                    }`}
                  >
                    {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                  </button>

                  <button
                    onClick={endVoiceCall}
                    className="flex items-center space-x-1.5 rounded-[10px] bg-[#0d0d0d] px-4 py-2 text-xs font-medium text-white hover:bg-black transition-all"
                  >
                    <PhoneOff className="h-3.5 w-3.5" />
                    <span>End</span>
                  </button>
                </>
              )}
            </div>

            {errorMessage && (
              <div className="mt-4 flex items-start space-x-2 rounded-[10px] border border-[#0000001a] bg-white p-2.5 text-xs text-[#0d0d0d] w-full">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#5d5d5d] mt-0.5" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Real-Time Transcript Column (Right) */}
          <div className="flex flex-col rounded-[10px] border border-[#0000001a] bg-white p-5 min-h-[460px]">
            <div className="flex items-center justify-between border-b border-[#0000001a] pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-[#0d0d0d]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0d0d0d]">Transcript</h3>
              </div>
              <span className="text-xs text-[#8f8f8f]">
                {isCallActive ? 'Live stream' : 'Session complete'}
              </span>
            </div>

            {/* Transcript Scroll Window */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[380px]">
              {transcripts.length === 0 && !postCallTurns ? (
                <div className="flex flex-col items-center justify-center text-center py-16 text-[#8f8f8f]">
                  <FileText className="h-6 w-6 text-[#8f8f8f] mb-1.5" />
                  <p className="text-xs">
                    {isCallActive
                      ? 'Listening for speech...'
                      : 'Live transcription will appear here.'}
                  </p>
                </div>
              ) : (
                <>
                  {transcripts.map((t) => (
                    <div
                      key={t.id}
                      className={`flex flex-col ${
                        t.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <span className="text-[10px] font-medium uppercase text-[#8f8f8f] mb-0.5 px-1">
                        {t.sender === 'user' ? 'You' : 'Agent'}
                      </span>
                      <div
                        className={`rounded-[10px] px-3 py-2 text-xs sm:text-sm max-w-[85%] leading-relaxed ${
                          t.sender === 'user'
                            ? 'bg-[#f9f9f9] border border-[#0000001a] text-[#0d0d0d]'
                            : 'bg-white text-[#0d0d0d]'
                        }`}
                      >
                        {t.text}
                      </div>
                    </div>
                  ))}

                  {/* Post call turns if retrieved */}
                  {postCallTurns && postCallTurns.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#0000001a] space-y-2">
                      <div className="text-xs font-semibold text-[#5d5d5d]">
                        Server Turn History:
                      </div>
                      {postCallTurns.map((turn, i) => (
                        <div key={turn.id || i} className="space-y-1 rounded-[8px] bg-[#f9f9f9] p-2.5 border border-[#0000001a] text-xs">
                          {turn.user_transcript && (
                            <p className="text-[#0d0d0d]">
                              <span className="font-semibold text-[#5d5d5d]">User: </span>
                              {turn.user_transcript}
                            </p>
                          )}
                          {turn.agent_response && (
                            <p className="text-[#0d0d0d]">
                              <span className="font-semibold text-[#5d5d5d]">Agent: </span>
                              {turn.agent_response}
                            </p>
                          )}
                          {turn.total_ms && (
                            <p className="text-[10px] text-[#8f8f8f]">
                              Total: {turn.total_ms}ms • STT: {turn.stt_ms ?? '-'}ms • TTS: {turn.tts_ttfb_ms ?? '-'}ms
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div ref={transcriptEndRef} />
                </>
              )}
            </div>

            {/* Architecture Footer Note */}
            <div className="pt-3 border-t border-[#0000001a] text-[11px] text-[#8f8f8f] flex items-center justify-between">
              <span>WebRTC: livekit-client</span>
              <span>CallMissed Voice Session API</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
