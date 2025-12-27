
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, Minimize2, MessageSquare, Terminal, Database, Shield } from 'lucide-react';
import { Note } from '../types';
import { mlEngine } from '../services/mlEngine';

interface ChatBotProps {
  notes: Note[];
  activeNote?: Note;
}

const ChatBot: React.FC<ChatBotProps> = ({ notes, activeNote }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string; isInsight?: boolean }[]>([
    { role: 'bot', text: "CogniBot Local Node initialized. My core is running privately on your device. I'm ready to synthesize your memory vault." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const generateLocalResponse = (query: string): { text: string; isInsight: boolean } => {
    const q = query.toLowerCase();
    
    // Detected Insight Request
    if (q.includes('insight') || q.includes('report') || q.includes('analysis') || q.includes('analyze') || q.includes('summarize')) {
      if (!activeNote) return { text: "To generate a cognitive report, please select a specific thought stream from the sidebar first.", isInsight: false };
      return { text: mlEngine.synthesizeInsight(activeNote), isInsight: true };
    }

    // Conversational Responses (Human-like, Analytical Persona)
    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return { text: "Hello. Synaptic monitoring is active. All local data streams are encrypted and stable.", isInsight: false };
    }
    if (q.includes('how are you')) {
      return { text: "Operational efficiency is at 100%. I'm currently holding your cognitive vault in isolated RAM.", isInsight: false };
    }
    if (q.includes('who are you') || q.includes('what are you')) {
      return { text: "I am CogniBot, a private local synthesizer. I use the Qwen-inspired local reasoning logic to process your cognitive data without ever touching the cloud.", isInsight: false };
    }
    if (q.includes('thank')) {
      return { text: "Understood. Maintaining cognitive integrity is my primary directive.", isInsight: false };
    }
    if (q.includes('help')) {
      return { text: "I can analyze your notes for emotional bias, generate structural mind maps, or provide a cross-vault synthesis. Ask for an 'insight report' to start.", isInsight: false };
    }

    return { text: "System ready. If you require a deep neural analysis of the current stream, just request an 'insight report'.", isInsight: false };
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Simulated "thinking" delay for the local synthesizer
    setTimeout(() => {
      const { text, isInsight } = generateLocalResponse(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text, isInsight }]);
      setIsTyping(false);
    }, 750);
  };

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="fixed bottom-12 right-12 bg-slate-900 dark:bg-slate-900 hover:bg-slate-800 text-white p-6 rounded-full shadow-[0_25px_60px_rgba(0,0,0,0.5)] transition-all hover:scale-110 z-50 flex items-center justify-center group border border-white/10">
      <MessageSquare size={32} className="group-hover:rotate-6 transition-transform" />
    </button>
  );

  return (
    <div className="fixed bottom-12 right-12 w-[28rem] h-[42rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[3.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] flex flex-col z-[60] overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
      <div className="p-8 border-b dark:border-slate-800 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-600 rounded-2xl text-white shadow-lg"><Bot size={24} /></div>
          <div>
            <h3 className="font-black text-lg uppercase tracking-widest text-white">CogniBot</h3>
            <div className="flex items-center gap-2 text-[10px] text-emerald-400 uppercase font-black tracking-widest">
               <Shield size={12} /> Local Offline Instance
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl text-slate-400 transition-colors"><Minimize2 size={24} /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth bg-slate-50 dark:bg-slate-950/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`p-3 rounded-2xl h-fit shadow-md transition-all ${m.role === 'user' ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-brand-600 text-white animate-in zoom-in-90'}`}>
              {m.role === 'user' ? <User size={18} /> : <Terminal size={18} />}
            </div>
            <div className={`max-w-[88%] p-6 text-sm font-medium leading-relaxed rounded-[2.2rem] shadow-sm ${
              m.role === 'user' 
                ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-tr-none border dark:border-slate-800' 
                : m.isInsight 
                  ? 'bg-slate-900 text-slate-200 border-2 border-brand-500/40 rounded-tl-none font-mono whitespace-pre-wrap leading-loose shadow-[0_10px_30px_rgba(139,92,246,0.1)]'
                  : 'bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/40 text-slate-800 dark:text-slate-200 rounded-tl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-4 px-2">
            <div className="p-3 bg-brand-600/10 rounded-2xl"><Sparkles size={18} className="text-brand-500 animate-spin-slow" /></div>
            <div className="text-[10px] font-black uppercase text-brand-500 tracking-[0.4em] animate-pulse">Running Local Inference...</div>
          </div>
        )}
      </div>

      <div className="p-7 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 p-3.5 rounded-[2.2rem] shadow-inner group focus-within:ring-2 focus-within:ring-brand-500/40 transition-all">
          <Database className="text-slate-400 ml-2" size={18} />
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
            placeholder="Search vault or ask for 'insight'..." 
            className="flex-1 bg-transparent border-none text-sm focus:ring-0 px-2 placeholder-slate-400 dark:text-white" 
          />
          <button onClick={handleSend} className="p-3.5 bg-brand-600 text-white rounded-2xl hover:bg-brand-700 transition-all shadow-lg active:scale-95"><Send size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
