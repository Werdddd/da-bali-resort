import { useEffect, useRef } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';

export interface SupportChatMessage {
  sender: string;
  text: string;
  id?: number;
  tempId?: number;
  has_heart?: number;
}

export interface StaffChatPanelProps {
  messages: SupportChatMessage[];
  draft: string;
  onDraftChange: (val: string) => void;
  onSend: (e: React.FormEvent) => void;
  onDeleteMessage?: (id: number) => void;
  onHeartClick?: (id: number) => void;
}

const HeartIcon = ({ className }: { className: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
);

export const StaffChatPanel = ({ messages, draft, onDraftChange, onSend, onDeleteMessage, onHeartClick }: StaffChatPanelProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Jump to the latest message whenever the panel is shown.
  useEffect(() => {
    setTimeout(scrollToBottom, 50);
  }, []);

  // Follow new messages only if the guest hasn't scrolled up to read older ones.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) {
      setTimeout(scrollToBottom, 50);
    }
  }, [messages]);

  return (
    <>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-coffee-50/30" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={`${msg.sender}-${msg.id || msg.tempId || i}`} className={`flex ${msg.sender === 'You' ? 'justify-start flex-row-reverse' : 'justify-start'} group relative items-center gap-2`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'You' ? 'bg-coffee-800 text-white rounded-tr-none' : 'bg-white text-coffee-900 border border-coffee-100 rounded-tl-none'}`}>
              <div className="flex justify-between items-start gap-2">
                <p className="text-[10px] opacity-50 mb-1">{msg.sender}</p>
                <div className="flex items-center gap-1">
                  {msg.sender === 'You' && msg.id && onDeleteMessage && (
                    <button
                      onClick={() => onDeleteMessage(msg.id!)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-300 hover:text-red-100 transition-opacity"
                      title="Delete message"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              {msg.text}
            </div>
            <div className="flex flex-col items-center gap-1">
              {msg.sender !== 'You' && msg.id && onHeartClick && (
                <button
                  onClick={() => onHeartClick(msg.id!)}
                  className={`p-1 transition-opacity ${msg.has_heart ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  title="React with heart"
                >
                  <HeartIcon className={`h-4 w-4 ${msg.has_heart ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`} />
                </button>
              )}
              {msg.sender === 'You' && msg.has_heart ? (
                <div className="p-1">
                  <HeartIcon className="h-4 w-4 fill-red-500 text-red-500" />
                </div>
              ) : null}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={onSend} className="p-3 border-t border-coffee-100 bg-white">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-coffee-50 p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-coffee-500"
          />
          <button type="submit" disabled={!draft.trim()} className="bg-coffee-800 text-white p-2 rounded-lg disabled:opacity-50" aria-label="Send">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </>
  );
};
