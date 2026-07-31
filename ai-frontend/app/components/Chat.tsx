// app/components/Chat.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { sendAgentMessage } from '@/lib/api';
import { useSpeech } from '@/hooks/useSpeech';

type LocalMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export default function ChatBot() {
  const { speak, isMuted, toggleMute, isPlaying } = useSpeech();

  const [messages, setMessages] = useState<LocalMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! 👋 I am your E-Commerce Support AI Assistant. Ask me about returns, shipping, product specs, or order calculations.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Auto-play assistant replies when they arrive
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === 'assistant' && last.text && !isMuted) {
      speak(last.text);
    }
  }, [messages, speak, isMuted]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isSending) return;

      const userMsg: LocalMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: text.trim(),
      };

      setMessages((m) => [...m, userMsg]);
      setInput(''); // Clear input box
      setIsSending(true);

      try {
        const resp = await sendAgentMessage({
          user_id: 'customer_101',
          message: userMsg.text,
        });

        const aiText = resp?.response ?? 'No response from agent.';
        const aiMsg: LocalMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: aiText,
        };

        setMessages((m) => [...m, aiMsg]);
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error ? `Communication error: ${err.message}` : 'Communication error';
        const aiMsg: LocalMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: errMsg,
        };
        setMessages((m) => [...m, aiMsg]);
      } finally {
        setIsSending(false);
      }
    },
    [isSending]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  // Auto-send message when speech recognition ends
  useEffect(() => {
    const handleSpeechResult = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const transcript = customEvent.detail;
      if (transcript && !isSending) {
        setInput(transcript);
        setTimeout(() => {
          sendMessage(transcript);
        }, 500); // 500ms delay before auto-submitting
      }
    };

    window.addEventListener('speechResult', handleSpeechResult);
    return () => {
      window.removeEventListener('speechResult', handleSpeechResult);
    };
  }, [isSending, sendMessage]);

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col h-screen">
      <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
        <h2 className="text-lg font-bold text-white">AI Assistant</h2>

        <button
          onClick={toggleMute}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            isMuted ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
          }`}
        >
          {isMuted ? '🔇 Voice OFF' : '🔊 Voice ON'}
          {isPlaying && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[80%] ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-100'}`}>
              <div className="flex justify-between items-center gap-4 mb-1">
                <span className="text-xs font-semibold opacity-75">{m.role === 'user' ? 'You' : 'AI Assistant'}</span>
                {m.role === 'assistant' && (
                  <button onClick={() => speak(m.text)} className="text-xs text-zinc-400 hover:text-white">
                    ▶ Listen
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white"
        />
        <button type="submit" disabled={isSending} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}