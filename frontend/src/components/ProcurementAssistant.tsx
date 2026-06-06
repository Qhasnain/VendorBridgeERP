import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Send, Bot, User, Trash2, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ProcurementAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProcurementAssistant: React.FC<ProcurementAssistantProps> = ({ isOpen, onClose }) => {
  const { apiFetch } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `### Welcome to VendorBridge AI!
I am your procurement and intelligence assistant. I can parse natural language queries to explain spending stats, verify supplier ratings, and inspect invoice records.

Try asking:
- *Show spending summary*
- *Review Apex Solutions performance*
- *Explain invoice INV-2026-000001*`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const data = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error communicating with AI Engine: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat history cleared. How can I assist you with VendorBridge intelligence today?',
      },
    ]);
  };

  // Helper to render basic markdown patterns returned by backend
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-extrabold text-sm text-slate-900 dark:text-white mt-3 mb-1 flex items-center gap-1.5">
            <Sparkles size={14} className="text-secondary" />
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Bullets with bold parts
      if (line.startsWith('- ')) {
        const rawContent = line.replace('- ', '');
        const boldMatch = rawContent.match(/\*\*(.*?)\*\*(.*)/);
        if (boldMatch) {
          return (
            <li key={idx} className="ml-4 list-disc text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white font-semibold">{boldMatch[1]}</strong>
              {boldMatch[2]}
            </li>
          );
        }
        return (
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {rawContent}
          </li>
        );
      }
      // Bold inline blocks
      const boldMatchInline = line.match(/\*\*(.*?)\*\*(.*)/);
      if (boldMatchInline) {
        return (
          <p key={idx} className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 mb-1">
            <strong className="text-slate-900 dark:text-white font-semibold">{boldMatchInline[1]}</strong>
            {boldMatchInline[2]}
          </p>
        );
      }
      // Standard line
      return (
        <p key={idx} className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 mb-1">
          {line}
        </p>
      );
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
          />

          {/* Chat Sliding Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-16 px-6 bg-gradient-to-r from-primary to-accent dark:from-slate-950 dark:to-accent-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-accent">
                  <Bot size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">Procurement Assistant</h3>
                  <span className="text-[10px] text-gray-200 dark:text-slate-400 font-semibold uppercase tracking-wider">Local Reasoner Engine</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800 text-white/80 hover:text-white transition-colors"
                  title="Clear history"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800 text-white/80 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Conversation Window */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                      <Bot size={15} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 shadow-sm text-xs ${
                      msg.role === 'user'
                        ? 'bg-primary text-white font-medium rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700/50'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="space-y-1.5">{renderMessageContent(msg.content)}</div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 font-bold text-xs">
                      U
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                    <Bot size={15} />
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-slate-100 dark:border-slate-700/50 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce delay-75" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce delay-150" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSend}
              className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 items-center"
            >
              <input
                type="text"
                placeholder="Ask about spending summaries, suppliers..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-xs px-4 py-3 rounded-xl outline-none border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-premium shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
