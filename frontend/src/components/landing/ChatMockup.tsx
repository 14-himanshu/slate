import { useState, useRef, useEffect } from 'react';

type Message = {
  id: string;
  sender: 'AK' | 'ME';
  name: string;
  time: string;
  text: string;
};

export default function ChatMockup() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'AK',
      name: 'Alex K.',
      time: '10:42 AM',
      text: 'Just deployed the WebSocket refactor. Latency is looking incredible.',
    },
    {
      id: '2',
      sender: 'ME',
      name: 'You',
      time: '10:43 AM',
      text: 'Seeing it now. Under 30ms globally. Huge win for the team! 🚀',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Scroll only the chat container, NOT the page
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'ME',
      name: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputValue.trim(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Simulate someone typing back after 1.5 seconds
    setTimeout(() => {
      setIsTyping(true);
      scrollToBottom();
      
      // Simulate their message arriving 2 seconds after typing starts
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev, 
          {
            id: Date.now().toString() + 'reply',
            sender: 'AK',
            name: 'Alex K.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: 'Awesome! Let\'s monitor the logs for the next hour.',
          }
        ]);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px]">
      {/* Sidebar */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col gap-6">
        <div>
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-500 uppercase tracking-wider mb-3">Channels</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-900 dark:text-white rounded-md text-sm cursor-pointer">
              <span className="font-medium"># engineering</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white rounded-md text-sm cursor-pointer transition-colors">
              <span># design</span>
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white rounded-md text-sm cursor-pointer transition-colors">
              <span># general</span>
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-500 uppercase tracking-wider mb-3">Direct Messages</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white rounded-md text-sm cursor-pointer transition-colors">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Alex K.</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white rounded-md text-sm cursor-pointer transition-colors">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Sarah M.</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/30 flex flex-col">
        <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6 shrink-0">
          <span className="font-semibold text-zinc-900 dark:text-white"># engineering</span>
        </div>
        
        <div ref={scrollContainerRef} className="flex-1 p-6 flex flex-col justify-start gap-6 overflow-y-auto custom-scrollbar">
          <div className="flex-1" /> {/* Spacer to push messages to bottom if few */}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 ${msg.sender === 'ME' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                msg.sender === 'ME' ? 'bg-indigo-600 text-white' : 'bg-indigo-600/20 text-indigo-500 dark:text-indigo-400'
              }`}>
                {msg.sender}
              </div>
              <div className={`flex flex-col ${msg.sender === 'ME' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  {msg.sender === 'ME' ? (
                    <>
                      <span className="text-xs text-zinc-900 dark:text-zinc-500">{msg.time}</span>
                      <span className="font-semibold text-zinc-900 dark:text-white text-sm">{msg.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-zinc-900 dark:text-white text-sm">{msg.name}</span>
                      <span className="text-xs text-zinc-900 dark:text-zinc-500">{msg.time}</span>
                    </>
                  )}
                </div>
                <p className={`text-sm p-3 rounded-2xl inline-block ${
                  msg.sender === 'ME' 
                    ? 'text-white bg-indigo-600 rounded-tr-sm' 
                    : 'text-zinc-800 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-tl-sm'
                }`}>
                  {msg.text}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
             <div className="flex items-center gap-2 text-xs text-zinc-900 dark:text-zinc-500 animate-in fade-in">
               <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded-full border border-zinc-300 dark:border-zinc-700/50">
                 <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]"></span>
                 <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                 <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
               </div>
               <span>Alex K. is typing...</span>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Message #engineering... (Try typing!)"
              className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 h-12 rounded-lg px-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              aria-label="Chat input"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              aria-label="Send message"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
