import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import type { AgentMessage } from '../../lib/types';

interface ChatPaneProps {
  messages: AgentMessage[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
}

export const ChatPane: React.FC<ChatPaneProps> = ({ messages, onSendMessage, isThinking }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full w-full bg-white flex flex-col border-l border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white/50 backdrop-blur flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Bot className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            Supply Agent
            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20">ONLINE</span>
          </h2>
          <p className="text-xs text-slate-500">Powered by Gemini 2.5</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-none 
                ${msg.role === 'agent' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-200 text-slate-600'}`}>
              {msg.role === 'agent' ? <Bot size={16} /> : <User size={16} />}
            </div>

            <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'}`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
            <Bot className="w-12 h-12 text-slate-300" />
            <p>Connecting to Supply Chain OS...</p>
          </div>
        )}

        {isThinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center flex-none animate-pulse">
              <Sparkles size={16} />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white/90">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask specific questions about shipments, delays, or routes..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-800 
                focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-400"
            disabled={isThinking}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="absolute right-2 top-2 p-1.5 bg-white border border-slate-200 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-2 flex justify-center gap-4 text-[10px] text-slate-400">
          <span>Cmd + K to clear</span>
          <span>Enter to send</span>
        </div>
      </div>
    </div>
  );
};
