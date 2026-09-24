import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, MessageSquare, Phone } from 'lucide-react';
import { FaqChatResponse } from '../types';

interface FaqChatbotProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Signed-in guests also have the Support Chat bubble in the bottom-right corner, so the
  // chatbot stacks above it and can hand the conversation over to a staff member.
  isGuest: boolean;
  onOpenSupportChat?: () => void;
}

interface BotMessage {
  id: number;
  sender: 'bot' | 'guest';
  text: string;
  suggestions?: { id: number; question: string }[];
  showHandoff?: boolean;
}

const WELCOME_TEXT = "Hi! I'm the Da Bali Resort assistant. 🌴 Ask me anything about check-in, rooms, rates, payments, or amenities — or tap a question below.";
const FALLBACK_TEXT = "Sorry, I don't have an answer for that yet. Try rephrasing, pick one of these questions, or reach our staff directly.";

let nextMessageId = 1;

export const FaqChatbot = ({ isOpen, onOpenChange, isGuest, onOpenSupportChat }: FaqChatbotProps) => {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load the welcome message with the top FAQs as quick-reply chips the first time it opens.
  useEffect(() => {
    if (!isOpen || messages.length) return;
    const welcome: BotMessage = { id: nextMessageId++, sender: 'bot', text: WELCOME_TEXT };
    setMessages([welcome]);
    fetch('/api/faq')
      .then(res => (res.ok ? res.json() : []))
      .then((faqs: { id: number; question: string; category: string }[]) => {
        const starters = faqs.filter(f => f.category !== 'General').slice(0, 4);
        setMessages(prev => prev.map(m => (m.id === welcome.id ? { ...m, suggestions: starters } : m)));
      })
      .catch(e => console.error('Failed to load FAQ suggestions:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages, isTyping, isOpen]);

  const ask = async (payload: { message?: string; faqId?: number }, displayText: string) => {
    if (isTyping) return;
    setMessages(prev => [...prev, { id: nextMessageId++, sender: 'guest', text: displayText }]);
    setIsTyping(true);
    try {
      const [res] = await Promise.all([
        fetch('/api/faq/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        // Short pause so replies don't appear instantly and feel like a conversation.
        new Promise(resolve => setTimeout(resolve, 450)),
      ]);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data: FaqChatResponse = await res.json();
      setMessages(prev => [...prev, {
        id: nextMessageId++,
        sender: 'bot',
        text: data.matched && data.answer ? data.answer : FALLBACK_TEXT,
        suggestions: data.suggestions,
        showHandoff: !data.matched,
      }]);
    } catch (e) {
      console.error('FAQ chatbot request failed:', e);
      setMessages(prev => [...prev, {
        id: nextMessageId++,
        sender: 'bot',
        text: "Sorry, I'm having trouble right now. Please try again in a moment.",
        showHandoff: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    ask({ message: text }, text);
  };

  return (
    <div className={`fixed right-6 z-[100] ${isGuest ? 'bottom-24' : 'bottom-6'}`}>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white w-[calc(100vw-3rem)] max-w-sm h-[28rem] max-h-[calc(100vh-8rem)] rounded-2xl shadow-2xl border border-coffee-100 flex flex-col overflow-hidden"
          >
            <div className="bg-coffee-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <div>
                  <span className="font-bold block leading-tight">Resort Assistant</span>
                  <span className="text-[10px] text-coffee-300 uppercase tracking-widest">Automated FAQ</span>
                </div>
              </div>
              <button onClick={() => onOpenChange(false)} aria-label="Close chatbot"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-coffee-50/30">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'guest' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-line ${msg.sender === 'guest' ? 'bg-coffee-800 text-white rounded-tr-none' : 'bg-white text-coffee-900 border border-coffee-100 rounded-tl-none'}`}>
                    {msg.text}
                  </div>

                  {msg.showHandoff && (
                    <div className="mt-2 max-w-[85%]">
                      {isGuest && onOpenSupportChat ? (
                        <button
                          onClick={onOpenSupportChat}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#A3402A] hover:underline"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Chat with our staff
                        </button>
                      ) : (
                        <p className="flex items-center gap-1.5 text-xs text-coffee-600">
                          <Phone className="h-3.5 w-3.5" /> 09629724075 · dermagrace56@yahoo.com.ph
                        </p>
                      )}
                    </div>
                  )}

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                      {msg.suggestions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => ask({ faqId: s.id }, s.question)}
                          disabled={isTyping}
                          className="text-left text-xs px-3 py-1.5 rounded-full border border-[#A3402A]/30 text-[#5C3321] bg-[#FDF8F3] hover:bg-coffee-100 transition-colors disabled:opacity-50"
                        >
                          {s.question}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start">
                  <div className="bg-white border border-coffee-100 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-coffee-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-coffee-100 bg-white">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={500}
                  placeholder="Ask a question..."
                  className="flex-1 bg-coffee-50 p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-coffee-500"
                />
                <button type="submit" disabled={isTyping || !input.trim()} className="bg-coffee-800 text-white p-2 rounded-lg disabled:opacity-50" aria-label="Send">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onOpenChange(true)}
            className="bg-[#A3402A] text-white p-4 rounded-full shadow-xl"
            aria-label="Open FAQ chatbot"
            title="Ask our FAQ assistant"
          >
            <Bot className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
