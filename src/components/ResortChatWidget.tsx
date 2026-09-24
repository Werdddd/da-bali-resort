import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, MessageCircle, Headset } from 'lucide-react';
import { FaqAssistantPanel, useFaqAssistant } from './FaqAssistantPanel';
import { StaffChatPanel, StaffChatPanelProps } from './StaffChatPanel';

export type ChatTab = 'assistant' | 'staff';

interface ResortChatWidgetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: ChatTab;
  onTabChange: (tab: ChatTab) => void;
  // Only signed-in guests can message staff. Without it the widget is the FAQ assistant alone.
  staffChat?: StaffChatPanelProps & { unreadCount: number };
}

// Single bottom-right chat entry point: the automated FAQ assistant for everyone, plus the
// staff support conversation for signed-in guests.
export const ResortChatWidget = ({ isOpen, onOpenChange, activeTab, onTabChange, staffChat }: ResortChatWidgetProps) => {
  const assistant = useFaqAssistant();
  const unreadCount = staffChat?.unreadCount ?? 0;
  const tab: ChatTab = staffChat ? activeTab : 'assistant';

  useEffect(() => {
    if (isOpen && tab === 'assistant') assistant.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab]);

  // Unread staff replies take priority over whichever tab was last used.
  const open = () => {
    if (unreadCount > 0) onTabChange('staff');
    onOpenChange(true);
  };

  const tabs: { id: ChatTab; label: string; icon: typeof Bot; badge?: number }[] = [
    { id: 'assistant', label: 'Assistant', icon: Bot },
    { id: 'staff', label: 'Resort Support', icon: Headset, badge: unreadCount },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white w-[calc(100vw-3rem)] max-w-sm h-[30rem] max-h-[calc(100vh-6rem)] rounded-2xl shadow-2xl border border-coffee-100 flex flex-col overflow-hidden"
          >
            <div className="bg-coffee-900 text-white">
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {tab === 'assistant' ? <Bot className="h-5 w-5" /> : <span className="w-2 h-2 bg-green-500 rounded-full mx-1.5" />}
                  <div>
                    <span className="font-bold block leading-tight">{tab === 'assistant' ? 'Resort Assistant' : 'Resort Support'}</span>
                    <span className="text-[10px] text-coffee-300 uppercase tracking-widest">
                      {tab === 'assistant' ? 'Automated FAQ' : 'Chat with our staff'}
                    </span>
                  </div>
                </div>
                <button onClick={() => onOpenChange(false)} aria-label="Close chat"><X className="h-5 w-5" /></button>
              </div>

              {staffChat && (
                <div className="flex px-2" role="tablist">
                  {tabs.map(t => (
                    <button
                      key={t.id}
                      role="tab"
                      aria-selected={tab === t.id}
                      onClick={() => onTabChange(t.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold border-b-2 transition-colors ${tab === t.id ? 'border-white text-white' : 'border-transparent text-coffee-300 hover:text-white'}`}
                    >
                      <t.icon className="h-3.5 w-3.5" />
                      {t.label}
                      {!!t.badge && (
                        <span className="bg-red-500 text-white text-[10px] min-w-4 h-4 px-1 flex items-center justify-center rounded-full">{t.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {tab === 'staff' && staffChat ? (
              <StaffChatPanel {...staffChat} />
            ) : (
              <FaqAssistantPanel
                assistant={assistant}
                onRequestStaff={staffChat ? () => onTabChange('staff') : undefined}
              />
            )}
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={open}
            className="bg-[#A3402A] text-white p-4 rounded-full shadow-xl relative"
            aria-label="Open chat"
            title={staffChat ? 'Ask our assistant or chat with staff' : 'Ask our FAQ assistant'}
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
                {unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
