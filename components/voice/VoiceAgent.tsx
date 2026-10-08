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
import { SelectDropdown } from '@/components/ui/select-dropdown';

interface LiveTranscriptItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
}

// Pietrastudio token aliases
const cream = '#f8f6f2';
const softCream = '#fffbe7';
const silver = '#c4c4c4';
const midGray = '#6b6b6b';
const inkBlack = '#000000';
const coral = '#ff5c3c';

export const VoiceAgent: React.FC = () => {
  const [state, setState] = useState<VoiceAgentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [selectedVoice, setSelectedVoice] = useState('shubh');
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [selectedModel, setSelectedModel] = useState('kimi-k2.5');
  const [greeting, setGreeting] = useState('Hello! I am your CallMissed AI assistant. How can I help you today?');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful, conversational AI assistant. Keep responses natural, brief, and concise.'
  );
  const [showSettings, setShowSettings] = useState(false);

  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([]);
  const [postCallTurns, setPostCallTurns] = useState<TranscriptTurn[] | null>(null);

  const roomRef = useRef<Room | null>(null);
  const audioElementsRef = useRef<HTMLMediaElement[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const cleanupCall = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (roomRef.current) {
      try { roomRef.current.disconnect(); } catch (e) { console.error('Error disconnecting room:', e); }
      roomRef.current = null;
    }
    audioElementsRef.current.forEach((el) => {
      try { el.pause(); el.remove(); } catch {}
    });
    audioElementsRef.current = [];
  }, []);

  useEffect(() => () => { cleanupCall(); }, [cleanupCall]);

  const startVoiceCall = async () => {
    try {
      setErrorMessage(null);
      setState('connecting');
      setTranscripts([]);
      setPostCallTurns(null);
      setCallDuration(0);
      setUserSpeaking(false);

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
      if (!res.ok) throw new Error(data?.error?.message || `Failed to create session (${res.status})`);

      const { wsUrl, token, id } = data;
      if (!wsUrl || !token) throw new Error('CallMissed media connection credentials were not returned.');

      setSessionId(id);

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          audioElementsRef.current.push(audioElement);
          document.body.appendChild(audioElement);
        }
      });

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
                updated[existingIdx] = { ...updated[existingIdx], text: seg.text };
              } else {
                updated.push({ id: segId, sender, text: seg.text, timestamp: Date.now() });
              }
            }
            return updated;
          });
        }
      );

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const isAgentSpeaking = speakers.some((s) => !s.isLocal);
        const isUserSpeaking = speakers.some((s) => s.isLocal);
        setUserSpeaking(isUserSpeaking);
        if (isAgentSpeaking) setState('speaking');
        else if (isUserSpeaking) setState('listening');
      });

      room.on(RoomEvent.Disconnected, () => { setState('ended'); cleanupCall(); });

      await room.connect(wsUrl, token);

      try {
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (micErr: unknown) {
        const msg = micErr instanceof Error ? micErr.message : 'Microphone access denied';
        throw new Error(`Microphone permission error: ${msg}. Please enable your microphone.`);
      }

      setState('listening');
      timerIntervalRef.current = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Voice session failed');
      setState('error');
      cleanupCall();
    }
  };

  const endVoiceCall = async () => {
    setState('ended');
    const activeSessionId = sessionId;
    cleanupCall();
    if (activeSessionId) {
      try {
        const res = await fetch(`/api/voice/transcript?id=${activeSessionId}`);
        const data = await res.json();
        if (data?.transcript && Array.isArray(data.transcript)) setPostCallTurns(data.transcript);
      } catch (e) { console.error('Failed to fetch call transcript:', e); }
    }
  };

  const toggleMute = async () => {
    if (!roomRef.current?.localParticipant) return;
    const newMutedState = !isMuted;
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
      setIsMuted(newMutedState);
    } catch (e) { console.error('Error toggling microphone:', e); }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCallActive = state === 'connecting' || state === 'listening' || state === 'speaking' || state === 'processing';

  const orbBg = () => {
    if (state === 'speaking') return coral;
    if (state === 'listening') return '#ffffff';
    if (state === 'connecting') return cream;
    return cream;
  };

  const orbBorder = () => {
    if (state === 'speaking' || state === 'listening') return `2px solid ${inkBlack}`;
    return `1px solid ${silver}`;
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#ffffff', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '9999px',
                border: `1px solid ${silver}`,
                background: cream,
                padding: '3px 10px',
                fontSize: '11px',
                letterSpacing: '0.143em',
                textTransform: 'uppercase',
                color: midGray,
                marginBottom: '12px',
              }}
            >
              <Radio style={{ width: '11px', height: '11px' }} />
              CallMissed Voice Session
            </span>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.64px',
                color: inkBlack,
                marginBottom: '8px',
              }}
            >
              Voice Agent
            </h1>
            <p style={{ fontSize: '14px', lineHeight: 1.5, letterSpacing: '-0.14px', color: midGray }}>
              Real-time WebRTC conversational voice interaction (STT → LLM → TTS).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isCallActive && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  border: `1px solid ${showSettings ? inkBlack : silver}`,
                  background: showSettings ? cream : '#ffffff',
                  padding: '7px 14px',
                  fontSize: '13px',
                  letterSpacing: '-0.01em',
                  color: showSettings ? inkBlack : midGray,
                  fontWeight: showSettings ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Sliders style={{ width: '14px', height: '14px' }} />
                Configuration
              </button>
            )}

            {isCallActive && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  border: `1px solid ${silver}`,
                  background: cream,
                  padding: '7px 14px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  color: inkBlack,
                }}
              >
                <Clock style={{ width: '14px', height: '14px', color: midGray }} />
                {formatDuration(callDuration)}
              </div>
            )}
          </div>
        </div>

        {/* Configuration Panel */}
        {showSettings && !isCallActive && (
          <div
            style={{
              marginBottom: '28px',
              borderRadius: '20px',
              border: `1px solid ${silver}`,
              background: cream,
              padding: '20px',
              boxShadow: 'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${silver}`,
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  letterSpacing: '0.143em',
                  textTransform: 'uppercase',
                  color: inkBlack,
                  fontWeight: 700,
                }}
              >
                <Sliders style={{ width: '12px', height: '12px' }} />
                Agent Settings
              </h3>
              <span style={{ fontSize: '11px', color: midGray, letterSpacing: '-0.01em' }}>Server-side session parameters</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
              <SelectDropdown
                label="Voice"
                value={selectedVoice}
                onChange={setSelectedVoice}
                options={SUPPORTED_VOICES.map((v) => ({ value: v.id, label: `${v.name} (${v.lang})` }))}
              />
              <SelectDropdown
                label="Language"
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                options={SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
              />
              <SelectDropdown
                label="Model"
                value={selectedModel}
                onChange={setSelectedModel}
                options={SUPPORTED_VOICE_MODELS.map((m) => ({ value: m.id, label: m.name }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Greeting', value: greeting, onChange: setGreeting, placeholder: 'e.g. Hello! How can I assist you today?' },
                { label: 'System Instructions', value: systemPrompt, onChange: setSystemPrompt, placeholder: 'e.g. You are a helpful assistant...' },
              ].map(({ label, value, onChange, placeholder }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.143em', textTransform: 'uppercase', color: midGray, marginBottom: '6px' }}>
                    {label}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      border: `1px solid ${silver}`,
                      background: '#ffffff',
                      padding: '7px 10px',
                      fontSize: '13px',
                      letterSpacing: '-0.01em',
                      color: inkBlack,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Experience */}
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '20px' }} className="voice-grid">
          {/* Left: Orb + Controls */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '20px',
              border: `1px solid ${silver}`,
              background: cream,
              padding: '32px 24px',
              minHeight: '420px',
              boxShadow: 'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px',
            }}
          >
            {/* Status badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                borderRadius: '9999px',
                background: '#ffffff',
                border: `1px solid ${silver}`,
                padding: '5px 14px',
                fontSize: '12px',
                letterSpacing: '-0.01em',
                color: inkBlack,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '9999px',
                  background:
                    state === 'idle' || state === 'ended' ? silver
                      : state === 'connecting' ? coral
                      : state === 'listening' ? '#57ad6a'
                      : state === 'speaking' ? coral
                      : coral,
                  animation: state === 'connecting' ? 'pulse 1.2s infinite' : 'none',
                }}
              />
              {state === 'idle' && 'Ready'}
              {state === 'connecting' && 'Connecting...'}
              {state === 'listening' && (userSpeaking ? 'Listening...' : 'Waiting...')}
              {state === 'speaking' && 'Agent speaking'}
              {state === 'processing' && 'Processing...'}
              {state === 'ended' && 'Call ended'}
              {state === 'error' && 'Error'}
            </div>

            {/* Orb */}
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '9999px',
                background: orbBg(),
                border: orbBorder(),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                margin: '24px 0',
              }}
            >
              {state === 'speaking' ? (
                <Volume2 style={{ width: '36px', height: '36px', color: '#ffffff' }} />
              ) : state === 'listening' ? (
                <Mic style={{ width: '36px', height: '36px', color: inkBlack }} />
              ) : state === 'connecting' ? (
                <RotateCcw style={{ width: '32px', height: '32px', color: midGray }} className="animate-spin" />
              ) : (
                <Mic style={{ width: '32px', height: '32px', color: silver }} />
              )}
            </div>

            {/* Hint */}
            <p
              style={{
                textAlign: 'center',
                fontSize: '13px',
                lineHeight: 1.5,
                letterSpacing: '-0.01em',
                color: midGray,
                maxWidth: '260px',
                marginBottom: '20px',
              }}
            >
              {state === 'idle' && 'Click below to start a natural voice conversation.'}
              {state === 'connecting' && 'Connecting to WebRTC media server...'}
              {state === 'listening' && 'Speak into your microphone. The agent will listen and reply.'}
              {state === 'speaking' && 'Agent is speaking. You can interrupt anytime.'}
              {state === 'ended' && 'Call finished. Start a new call or inspect the transcript.'}
              {state === 'error' && errorMessage}
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!isCallActive ? (
                <button
                  onClick={startVoiceCall}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: coral,
                    color: '#ffffff',
                    padding: '10px 22px',
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 0px 0px',
                  }}
                >
                  <Mic style={{ width: '15px', height: '15px' }} />
                  Start Conversation
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleMute}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '8px',
                      border: `1px solid ${isMuted ? inkBlack : silver}`,
                      background: isMuted ? inkBlack : '#ffffff',
                      color: isMuted ? '#ffffff' : inkBlack,
                      padding: '8px 14px',
                      fontSize: '13px',
                      letterSpacing: '-0.01em',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isMuted ? <MicOff style={{ width: '14px', height: '14px' }} /> : <Mic style={{ width: '14px', height: '14px' }} />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    onClick={endVoiceCall}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '8px',
                      border: 'none',
                      background: inkBlack,
                      color: '#ffffff',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <PhoneOff style={{ width: '14px', height: '14px' }} />
                    End
                  </button>
                </>
              )}
            </div>

            {errorMessage && (
              <div
                style={{
                  marginTop: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  borderRadius: '12px',
                  border: `1px solid ${silver}`,
                  background: softCream,
                  padding: '10px 12px',
                  fontSize: '12px',
                  letterSpacing: '-0.01em',
                  color: inkBlack,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <AlertCircle style={{ width: '14px', height: '14px', color: coral, flexShrink: 0, marginTop: '1px' }} />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Right: Transcript */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '20px',
              border: `1px solid ${silver}`,
              background: '#ffffff',
              padding: '20px',
              minHeight: '420px',
              boxShadow: 'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${silver}`,
                paddingBottom: '12px',
                marginBottom: '0',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <FileText style={{ width: '15px', height: '15px', color: inkBlack }} />
                <h3
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.143em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: inkBlack,
                  }}
                >
                  Transcript
                </h3>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  letterSpacing: '-0.01em',
                  color: midGray,
                }}
              >
                {isCallActive && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '9999px',
                      background: coral,
                    }}
                  />
                )}
                {isCallActive ? 'Live' : 'Session complete'}
              </span>
            </div>

            {/* Scroll area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: '340px',
              }}
            >
              {transcripts.length === 0 && !postCallTurns ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    flex: 1,
                    padding: '40px 0',
                    color: midGray,
                  }}
                >
                  <FileText style={{ width: '24px', height: '24px', marginBottom: '8px', color: silver }} />
                  <p style={{ fontSize: '13px', lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                    {isCallActive ? 'Listening for speech...' : 'Live transcription will appear here.'}
                  </p>
                </div>
              ) : (
                <>
                  {transcripts.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: t.sender === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: midGray,
                          marginBottom: '4px',
                          paddingLeft: '4px',
                          paddingRight: '4px',
                        }}
                      >
                        {t.sender === 'user' ? 'You' : 'Agent'}
                      </span>
                      <div
                        style={{
                          borderRadius: '12px',
                          padding: '9px 13px',
                          fontSize: '13px',
                          lineHeight: 1.5,
                          letterSpacing: '-0.01em',
                          maxWidth: '85%',
                          color: inkBlack,
                          background: t.sender === 'user' ? cream : softCream,
                          border: `1px solid ${silver}`,
                        }}
                      >
                        {t.text}
                      </div>
                    </div>
                  ))}

                  {postCallTurns && postCallTurns.length > 0 && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: `1px solid ${silver}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ fontSize: '11px', letterSpacing: '0.143em', textTransform: 'uppercase', color: midGray, fontWeight: 700 }}>
                        Server Turn History
                      </div>
                      {postCallTurns.map((turn, i) => (
                        <div
                          key={turn.id || i}
                          style={{
                            borderRadius: '10px',
                            background: cream,
                            border: `1px solid ${silver}`,
                            padding: '10px 12px',
                            fontSize: '12px',
                            letterSpacing: '-0.01em',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          {turn.user_transcript && (
                            <p style={{ color: inkBlack }}>
                              <span style={{ fontWeight: 700, color: midGray }}>User: </span>
                              {turn.user_transcript}
                            </p>
                          )}
                          {turn.agent_response && (
                            <p style={{ color: inkBlack }}>
                              <span style={{ fontWeight: 700, color: midGray }}>Agent: </span>
                              {turn.agent_response}
                            </p>
                          )}
                          {turn.total_ms && (
                            <p style={{ fontSize: '10px', color: silver }}>
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

            {/* Footer */}
            <div
              style={{
                paddingTop: '10px',
                borderTop: `1px solid ${silver}`,
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                letterSpacing: '-0.01em',
                color: silver,
                flexShrink: 0,
              }}
            >
              <span>WebRTC: livekit-client</span>
              <span>CallMissed Voice Session API</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 1024px) {
          .voice-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
