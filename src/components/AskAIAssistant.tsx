import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  User,
  Bot,
  Loader2,
  X,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { NormalizedCreditReport } from '../types';
import { useAuth } from '../context/AuthContext';
import { LegalDisclaimer } from './LegalDisclaimer';

interface AskAIAssistantProps {
  report: NormalizedCreditReport;
  isOpen: boolean;
  onClose?: () => void;
  isDrawer?: boolean;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AskAIAssistant: React.FC<AskAIAssistantProps> = ({
  report,
  isOpen,
  onClose,
  isDrawer = true,
}) => {
  const { authenticatedFetch } = useAuth();
  const quickQuestions = [
    'Why is my CIBIL score low?',
    'Which account is hurting my profile most?',
    'What should I fix first?',
    'Do I have any written-off accounts?',
    'Which accounts contain potential errors?',
    'Why is my credit utilization high?',
    'What documents do I need for disputes?',
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'ai',
      text: `Hello ${report.personal.name}! I am your AI credit assistant. I have reviewed your CIBIL report (Score: ${report.score.score}). What would you like me to explain about your accounts, overdue amounts, DPD records, or action plan?`,
      timestamp: 'Just now',
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const q = questionText || inputQuestion;
    if (!q.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await authenticatedFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          question: q.trim(),
          report,
          history: messages.slice(-4).map(m => ({ role: m.sender, content: m.text })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.answer || 'I could not retrieve an answer for that query.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('Failed to get answer.');
      }
    } catch (err) {
      console.error(err);
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'I am currently unable to reach the AI model, but based on your report: prioritize clearing any active overdue balances and keeping card utilization under 30% to stabilize your score.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Ask About My Credit Report
            </h3>
            <p className="text-[11px] text-slate-500">
              Grounded exclusively in your uploaded data
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-xs'
                  : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/60'
              }`}
            >
              {msg.text}
              <div
                className={`text-[9px] mt-1 text-right ${
                  msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                U
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs pl-9">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Analyzing your credit report...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions Chips */}
      <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Quick:</span>
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="text-[11px] font-medium text-slate-700 bg-white border border-slate-200/80 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors cursor-pointer shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={e => setInputQuestion(e.target.value)}
            placeholder="Ask a question about your CIBIL accounts..."
            disabled={isLoading}
            className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <LegalDisclaimer variant="compact" className="mt-2 text-[10px]" />
      </div>
    </div>
  );

  if (isDrawer) {
    return (
      <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {content}
      </div>
    );
  }

  return <div className="h-[650px] rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">{content}</div>;
};
