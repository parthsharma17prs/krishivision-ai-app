import React, { useState } from 'react';
import { api } from '../../api/client';
import { AssistantChatResponse } from '../../types';
import { Bot, Send, Sparkles, User } from 'lucide-react';

export const AssistantPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; lang?: string; followups?: string[] }>>([
    {
      sender: 'bot',
      text: 'Namaste Rajesh ji! I am your **KrishiVision AI Assistant**. Ask me anything about your tomato crop, brown leaf spots, irrigation schedule, or fertilizer recommendations in **English, Hindi, or Hinglish**!',
      followups: [
        'Meri tomato ki leaves pe brown spots aa rahe hain',
        'When should I irrigate my tomato crop?',
        'Show my farm health score breakdown'
      ]
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const prompt = textToSend || query;
    if (!prompt.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: prompt }]);
    if (!textToSend) setQuery('');
    setLoading(true);

    try {
      const res: AssistantChatResponse = await api.chatAssistant(prompt);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.response_text,
          lang: res.detected_language,
          followups: res.suggested_followups
        }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <Bot className="w-3.5 h-3.5" />
          <span>Multilingual Agri Knowledge Base (EN / HI / Hinglish)</span>
        </div>
        <h1 className="text-2xl font-bold text-white">AI Farm Assistant</h1>
      </div>

      {/* Chat Messages Workspace */}
      <div className="flex-1 glass-card rounded-2xl p-6 border border-slate-800 overflow-y-auto space-y-4 flex flex-col">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${m.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400 border border-slate-700'}`}>
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${m.sender === 'user' ? 'bg-emerald-700 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'}`}>
              {m.lang && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40 inline-block mb-1">
                  Language: {m.lang}
                </span>
              )}
              <div className="whitespace-pre-line">{m.text}</div>

              {/* Followups */}
              {m.followups && m.followups.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5 mt-2">
                  <p className="text-[10px] text-slate-400 font-semibold">Suggested Prompts:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.followups.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(f)}
                        className="text-[11px] bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700/80 px-2.5 py-1 rounded-lg transition"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 p-3 rounded-xl w-fit">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>Consulting Agricultural Knowledge Base...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask farmer assistant... (e.g. 'Meri tomato ki leaves pe brown spots aa rahe hain')"
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={!query.trim() || loading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold p-3.5 rounded-xl transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
