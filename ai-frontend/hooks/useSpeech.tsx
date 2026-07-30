// hooks/useSpeech.ts
'use client';

import { useState, useEffect, useRef } from 'react';

export function useSpeech() {
  const [isMuted, setIsMuted] = useState(false);
  const [mode, setMode] = useState<'voice' | 'text'>('text'); // NEW: voice/text mode // Toggle switch state
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = (text: string, onComplete?: () => void) => {
    if (!synthRef.current || isMuted || mode !== 'voice' || !text) return;

    // Stop any ongoing speech before starting new speech
    synthRef.current.cancel();

    // Clean Markdown tags (*, #, code snippets) before reading text aloud
    const cleanText = text.replace(/[*#_`]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0; // Speed: 0.5 to 2.0
    utterance.pitch = 1.0; // Pitch: 0 to 2.0

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      onComplete?.();
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      onComplete?.();
    };
    
    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const stop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      stop(); // Stop audio if muting
    }
    setIsMuted(!isMuted);
  };

  const toggleMode = () => {
    if (mode === 'voice') {
      stop(); // Stop audio when switching to text mode
    }
    setMode(mode === 'voice' ? 'text' : 'voice');
  };

  return { 
    speak, 
    stop, 
    isMuted, 
    toggleMute, 
    isPlaying,
    mode,           // NEW: expose mode state
    toggleMode      // NEW: expose mode toggle
  };
}