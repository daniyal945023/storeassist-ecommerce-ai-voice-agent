'use client';

import { useState, useEffect } from 'react';
import { ingestDocuments, sendAgentMessage, searchDocuments } from '../lib/api';
import { ChatMessage } from '@/lib/types';
import { useSpeech } from '@/hooks/useSpeech';
import { Volume2, VolumeX } from 'lucide-react'; // Add icons for voice toggle
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  Send,
  Search,
  DatabaseZap,
  FileText,
  Sparkles,
  Loader2,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function Home() {
  // --- State for Document Ingestion ---
  const [audioMessageId, setAudioMessageId] = useState<string | null>(null);
  
  // Fixed destructuring - include all needed variables from useSpeech
  const { 
    speak, 
    isMuted, 
    toggleMute, 
    isPlaying, 
    mode, 
    toggleMode,
    isListening,
    transcript,
    setTranscript,
    toggleListening
  } = useSpeech();
  
  const [voiceMode, setVoiceMode] = useState(false);
  const [docId, setDocId] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('policies');
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);

  // --- State for Direct Document Search ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // --- State for AI Chat ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! 👋 I am your E-Commerce Support AI Assistant. Ask me about store return policies, shipping specs, product details, or ask me to calculate order totals with discounts and tax!',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Add event listener for speech results:
  useEffect(() => {
    const handleSpeechResult = (event: Event) => {
      const customEvent = event as CustomEvent;
      setInputMessage(customEvent.detail);
    };

    window.addEventListener('speechResult', handleSpeechResult);
    return () => {
      window.removeEventListener('speechResult', handleSpeechResult);
    };
  }, []);

  // Handle Document Upload
  const handleIngestSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!docId || !content) return;

    setIsIngesting(true);
    setIngestStatus(null);

    try {
      const response = await ingestDocuments({
        id: docId,
        content,
        category,
      });
      setIngestStatus(`✅ ${response.response}`);
      setDocId('');
      setContent('');
    } catch (err: unknown) {
      const error = err as Error;
      setIngestStatus(`❌ Error: ${error.message || 'Failed to ingest document'}`);
    } finally {
      setIsIngesting(false);
    }
  };

  // Handle Direct Document Search
  const handleSearchSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setSearchResults(null);

    try {
      const response = await searchDocuments({
        query: searchQuery,
        num_results: 2,
      });
      setSearchResults(response.response || 'No matching store documents found.');
    } catch (err: unknown) {
      const error = err as Error;
      setSearchResults(`❌ Error: ${error.message || 'Search failed'}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Chat Submit
  const handleChatSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !transcript.trim()) || isSending) return;

    const userText = inputMessage || transcript;
    setInputMessage('');
    setTranscript(''); // Clear transcript after submission

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const response = await sendAgentMessage({
        user_id: 'customer_101',
        message: userText,
      });

      if (mode === 'voice') {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: '',
          isAudio: true,
        };
        setMessages((prev) => [...prev, aiMsg]);
        
        speak(response.response, () => {
          setMessages((prev) => prev.filter(msg => msg.id !== aiMsg.id));
        });
      } else {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: response.response,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: unknown) {
      const error = err as Error;
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ Communication error: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight tracking-tight">
                StoreAssist
              </h1>
              <p className="text-xs text-muted-foreground leading-tight">
                AI Customer Support
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto grid grid-cols-1 gap-6 p-4 md:grid-cols-12 md:p-6">
        {/* Left Column: Knowledge Management & Direct Search */}
        <section className="md:col-span-4 flex flex-col gap-6">
          {/* Form 1: Add Store Knowledge */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <DatabaseZap className="size-4 text-primary" />
                Add Store Knowledge
              </CardTitle>
              <CardDescription>
                Ingest product specs, FAQs, or return policies into ChromaDB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIngestSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="doc-id">Document ID</Label>
                  <Input
                    id="doc-id"
                    type="text"
                    placeholder="e.g. policy_returns_30day"
                    value={docId}
                    onChange={(e) => setDocId(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val ?? 'policies')}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policies">Policies &amp; Returns</SelectItem>
                      <SelectItem value="products">Product Specs</SelectItem>
                      <SelectItem value="shipping">Shipping &amp; Delivery</SelectItem>
                      <SelectItem value="faqs">General FAQs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    rows={3}
                    placeholder="e.g. Customers can return items within 30 days of purchase for a full refund..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={isIngesting} className="w-full">
                  {isIngesting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Ingesting...
                    </>
                  ) : (
                    <>
                      <FileText className="size-4" />
                      Add Knowledge
                    </>
                  )}
                </Button>
              </form>

              {ingestStatus && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-xs leading-relaxed">
                  {ingestStatus.startsWith('✅') ? (
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  ) : (
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                  )}
                  <span className="text-muted-foreground">
                    {ingestStatus.replace(/^(✅|❌)\s*/, '')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form 2: Direct Search */}
          <Card className="flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="size-4 text-primary" />
                Direct Knowledge Search
              </CardTitle>
              <CardDescription>
                Search the store database directly without invoking the AI agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3">
                <Input
                  type="text"
                  placeholder="e.g. return window for electronics"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isSearching}
                  className="w-full"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="size-4" />
                      Search Knowledge Base
                    </>
                  )}
                </Button>
              </form>

              {searchResults && (
                <ScrollArea className="max-h-48 rounded-lg border bg-muted/50">
                  <div className="whitespace-pre-wrap p-3 text-xs leading-relaxed text-muted-foreground">
                    {searchResults}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right Column: AI Customer Agent Chat */}
        <section className="md:col-span-8">
          <Card className="flex h-[650px] flex-col overflow-hidden py-0 gap-0">
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b bg-muted/30 p-4">
              <div className="relative flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="size-5 text-primary" />
                <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">Support Agent Chat</h2>
                <p className="truncate text-xs text-muted-foreground">
                  Queries policies, product details, &amp; calculates order costs automatically.
                </p>
              </div>
              {/* Voice Response Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMode}
                className="ml-auto flex items-center gap-1.5 text-xs"
              >
                {mode === 'voice' ? (
                  <>
                    <VolumeX className="size-4 text-muted-foreground" />
                    <span className="hidden sm:inline">Voice Mode</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="size-4 text-primary" />
                    <span className="hidden sm:inline">Text Mode</span>
                  </>
                )}
                {isPlaying && <span className="size-2 rounded-full bg-primary animate-ping" />}
              </Button>
            </div>
            <Badge variant="outline" className="ml-auto hidden shrink-0 gap-1.5 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-primary" />
              Online
            </Badge>

            {/* Chat Message Box */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="size-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.sender === 'user'
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm border bg-muted/50 text-foreground'
                        } ${msg.isAudio ? 'flex items-center justify-center p-4' : ''}`}
                    >
                      {msg.isAudio ? (
                        // Voice mode: Show glowing sphere animation
                        <div className="flex flex-col items-center gap-3">
                          {/* Glowing Sphere */}
                          <div className="relative">
                            <div className="size-8 rounded-full bg-primary/20 animate-pulse" />
                            <div className="absolute inset-0 size-8 rounded-full bg-primary/40 animate-ping" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="size-4 rounded-full bg-primary" />
                            </div>
                          </div>
                          {/* Subtle text hint */}
                          <div className="text-xs text-muted-foreground opacity-70">
                            AI is speaking...
                          </div>
                        </div>
                      ) : (
                        // Text mode: Show text
                        msg.text
                      )}
                    </div>
                    {msg.sender === 'user' && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="size-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isSending && (
                  <div className="flex items-end gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="size-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Agent is thinking &amp; checking tools...
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Input Footer */}
            <form onSubmit={handleChatSubmit} className="flex gap-2 bg-muted/30 p-4">
              <Input
                type="text"
                placeholder="Ask about returns, product specs, or order totals with discounts..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-background"
              />
              <Button
                type="button"
                variant={isListening ? "default" : "outline"}
                size="icon"
                onClick={toggleListening}
                className="mr-2"
                aria-label="Toggle voice input"
              >
                {isListening ? (
                  <MicOff className="size-4" />
                ) : (
                  <Mic className="size-4" />
                )}
              </Button>
              <Button
                type="submit"
                size="icon"
                disabled={isSending || (!inputMessage.trim() && !transcript.trim())}
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </form>

            {isListening && transcript && (
              <div className="px-4 pb-2">
                <div className="text-xs text-muted-foreground italic bg-muted/20 rounded-lg p-2">
                  Listening: {transcript}
                </div>
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}