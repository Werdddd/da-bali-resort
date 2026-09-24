import { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare, Phone } from 'lucide-react';
import { FaqChatResponse } from '../types';

interface BotMessage {
  id: number;
  sender: 'bot' | 'guest';
  text: string;
  suggestions?: { id: number; question: string }[];
  showHandoff?: boolean;
}

const WELCOME_TEXT = "Hi! I'm the Da Bali Resort assistant. 🌴 Ask me anything about check-in, rooms, rates, payments, or amenities — or tap a question below.";
const FALLBACK_TEXT = "Sorry, I don't have an answer for that yet. Try rephrasing, pick one of these questions, or reach our staff directly.";

// The conversation lives in the chat widget (not the panel) so it survives switching tabs
// and closing/reopening the widget.
export const useFaqAssistant = () => {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const nextId = useRef(1);
  const started = useRef(false);

  // Posts the welcome message with the top FAQs as quick-reply chips. Only runs once.
  const start = () => {
    if (started.current) return;
    started.current = true;
    const welcomeId = nextId.current++;
    setMessages([{ id: welcomeId, sender: 'bot', text: WELCOME_TEXT }]);
    fetch('/api/faq')
      .then(res => (res.ok ? res.json() : []))
      .then((faqs: { id: number; question: string; category: string }[]) => {
        const starters = faqs.filter(f => f.category !== 'General').slice(0, 4);
        setMessages(prev => prev.map(m => (m.id === welcomeId ? { ...m, suggestions: starters } : m)));
      })
      .catch(e => console.error('Failed to load FAQ suggestions:', e));
  };

  const ask = async (payload: { message?: string; faqId?: number }, displayText: string) => {
    if (isTyping) return;
    setMessages(prev => [...prev, { id: nextId.current++, sender: 'guest', text: displayText }]);
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
        id: nextId.current++,
        sender: 'bot',
        text: data.matched && data.answer ? data.answer : FALLBACK_TEXT,
        suggestions: data.suggestions,
        showHandoff: !data.matched,
      }]);
    } catch (e) {
      console.error('FAQ chatbot request failed:', e);
      setMessages(prev => [...prev, {
        id: nextId.current++,
        sender: 'bot',
        text: "Sorry, I'm having trouble right now. Please try again in a moment.",
        showHandoff: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return { messages, draft, setDraft, isTyping, start, ask };
};

export type FaqAssistant = ReturnType<typeof useFaqAssistant>;

interface FaqAssistantPanelProps {
  assistant: FaqAssistant;
  // Signed-in guests can hand the conversation over to staff; visitors get contact details instead.
  onRequestStaff?: () => void;
}

export const FaqAssistantPanel = ({ assistant, onRequestStaff }: FaqAssistantPanelProps) => {
  const { messages, draft, setDraft, isTyping, ask } = assistant;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    ask({ message: text }, text);
  };

  return (
    <>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-coffee-50/30">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'guest' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-line ${msg.sender === 'guest' ? 'bg-coffee-800 text-white rounded-tr-none' : 'bg-white text-coffee-900 border border-coffee-100 rounded-tl-none'}`}>
              {msg.text}
            </div>

            {msg.showHandoff && (
              <div className="mt-2 max-w-[85%]">
                {onRequestStaff ? (
                  <button
                    onClick={onRequestStaff}
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
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            placeholder="Ask a question..."
            className="flex-1 bg-coffee-50 p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-coffee-500"
          />
          <button type="submit" disabled={isTyping || !draft.trim()} className="bg-coffee-800 text-white p-2 rounded-lg disabled:opacity-50" aria-label="Send">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </>
  );
};
