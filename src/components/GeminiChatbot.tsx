import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Paperclip,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Copy,
  Check,
  Brain,
  Globe,
  Zap,
} from 'lucide-react';
import { ANATOMICAL_SYSTEMS, AnatomySystem } from '../utils/anatomyData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface GeminiChatbotProps {
  currentSystem?: AnatomySystem | null;
  uploadedMaterial?: string;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  currentSystem,
  uploadedMaterial,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        `Hello! I am your STOIC Chat Box AI Study Buddy, grounded in clinical anatomy, physiological mechanisms, and peer-reviewed biomedical literature.

Ask me anything about 3D structural layers, mechanical assembly, board exam clinical correlations, or your uploaded notes!`,
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deepThink, setDeepThink] = useState(true);
  const [useGrounding, setUseGrounding] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Explain mechanical lever classes in human skeletal joints (Class 1, 2, 3)',
    'Trace blood flow from right atrium through pulmonary & renal circulation',
    'Differentiate Upper Motor Neuron (UMN) vs Lower Motor Neuron (LMN) lesions',
    'How does the renal countercurrent multiplier create the osmotic gradient?',
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend = input) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          material: useGrounding ? uploadedMaterial : undefined,
          contextSystem: currentSystem?.name,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI reply.');
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chatbot error:', err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err.message || 'Unable to connect to Gemini API. Please check server status.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Direct Gemini Medical Intelligence</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            STOIC Chat Box
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Multi-modal medical AI assistant equipped with PubMed and Europe PMC
            literature grounding, first-principles clinical explanations, and
            high-yield board exam guidance.
          </p>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Chat Control Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-300 font-black text-xs">
              S
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>STOIC Chat Box</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-[10px] text-slate-400">
                Direct Gemini 3.8 / 2.5 Flash + Europe PMC Knowledge
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Deep Think Medical Reasoning Toggle */}
            <button
              onClick={() => setDeepThink(!deepThink)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                deepThink
                  ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-purple-600" />
              <span>Deep Reasoning</span>
            </button>

            {/* Literature & Notes Grounding Toggle */}
            <button
              onClick={() => setUseGrounding(!useGrounding)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                useGrounding
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grounded on Notes</span>
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div
          ref={scrollRef}
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4"
        >
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-rose-600 text-white'
                      : 'bg-purple-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`relative group rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.content}</div>

                  <div
                    className={`flex items-center justify-between gap-3 mt-2 text-[10px] ${
                      isUser ? 'text-rose-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{m.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => copyMessage(m.id, m.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-600 dark:hover:text-slate-200"
                        title="Copy message"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 mr-auto max-w-lg">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                <span>Thinking through biomedical mechanisms &amp; literature...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-bold shrink-0">Try:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-400 text-slate-600 dark:text-slate-300 whitespace-nowrap transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about anatomy, mechanics, pathology, or your notes..."
              className="flex-1 text-xs md:text-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
