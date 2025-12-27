
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, ChevronRight, Sun, Moon, Brain, Globe, Box, Activity, Trash2, FolderSync
} from 'lucide-react';
import { Note, Commit, GlobalIntelligence } from './types';
import { getAllNotesFromDB, saveNoteToDB, deleteNoteFromDB } from './services/db';
import { mlEngine } from './services/mlEngine';
import Editor from './components/Editor';
import MLDashboard from './components/MLDashboard';
import NodeGraph from './components/NodeGraph';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMLStats, setShowMLStats] = useState(false);
  const [viewMode, setViewMode] = useState<'text' | 'graph'>('text');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalIntel, setGlobalIntel] = useState<GlobalIntelligence | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);

  const seedNotes = async () => {
    const testNotesData = [
      { id: 'seed-1', title: 'Eternal Devotion', content: 'My heart feels so much love. I cherish every moment with my beloved. Adore this wonderful soul.', emotion: 'Love' },
      { id: 'seed-2', title: 'Strategic Analysis', content: 'We must analyze the facts and logic behind the theory. Hard insight suggests structural rethink.', emotion: 'Insight' },
      { id: 'seed-3', title: 'The Burning Drive', content: 'My passion is like fire! I feel so excited and driven. The intensity of ambition fuels my drive.', emotion: 'Passion' },
      { id: 'seed-4', title: 'Soft Horizons', content: 'Freedom and vision help me explore the open sky. I dream of freedom and open dreams.', emotion: 'Openness' }
    ];

    const seeded: Note[] = [];
    for (const t of testNotesData) {
      const nid = crypto.randomUUID();
      const cid = crypto.randomUUID();
      const analysis = await mlEngine.analyzeNote(t.content, 'lstm-neural');
      const clusters = analysis.emotions.filter(e => e.impact > 0.6).map(e => e.label);
      
      const note: Note = {
        id: nid, title: t.title, activeBranch: 'main', tags: [], createdAt: Date.now(), updatedAt: Date.now(),
        type: 'text', clusters, config: { preferredModel: 'lstm-neural', recommendedModel: 'lstm-neural', is3D: false },
        branches: { 'main': { name: 'main', head: cid, commits: [{ id: cid, timestamp: Date.now(), content: t.content, author: 'System', message: 'Cognitive Seed', parentId: null, assets: [], analysis, autoMap: mlEngine.generateHierarchicalMap(t.content) }] } }
      };
      await saveNoteToDB(note);
      seeded.push(note);
    }
    return seeded;
  };

  useEffect(() => {
    const load = async () => {
      let stored = await getAllNotesFromDB();
      if (!stored || stored.length === 0) {
        stored = await seedNotes();
      }
      setNotes(stored);
      setGlobalIntel(await mlEngine.analyzeVault(stored));
      setActiveNoteId(stored[0]?.id);
    };
    load();
  }, []);

  const handleAddNote = () => {
    const id = crypto.randomUUID();
    const cid = crypto.randomUUID();
    const newNote: Note = {
      id, title: 'Fresh Thought Stream', activeBranch: 'main', tags: [], clusters: [], createdAt: Date.now(), updatedAt: Date.now(), type: 'text',
      config: { preferredModel: 'lstm-neural', recommendedModel: 'lstm-neural', is3D: false },
      branches: { 'main': { name: 'main', head: cid, commits: [{ id: cid, timestamp: Date.now(), content: '', author: 'User', message: 'Origin', parentId: null, assets: [] }] } }
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(id);
    saveNoteToDB(newNote);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Purge this neural stream?')) return;
    await deleteNoteFromDB(id);
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    if (activeNoteId === id) setActiveNoteId(updated[0]?.id || null);
    setGlobalIntel(await mlEngine.analyzeVault(updated));
  };

  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId), [notes, activeNoteId]);

  const handleUpdate = async (n: Note) => {
    const updated = notes.map(x => x.id === n.id ? n : x);
    setNotes(updated);
    await saveNoteToDB(n);
    const intel = await mlEngine.analyzeVault(updated);
    setGlobalIntel(intel);
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-500">
      <aside className={`bg-slate-50 dark:bg-slate-900/80 backdrop-blur-3xl border-r dark:border-slate-800 transition-all flex flex-col ${isSidebarOpen ? 'w-88' : 'w-0 opacity-0 overflow-hidden'}`}>
        <div className="p-8 border-b dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-500/20"><Brain className="text-white" size={24} /></div>
             <span className="font-black text-xl tracking-tight uppercase tracking-[0.1em]">MemoryLane</span>
          </div>
          <button onClick={handleAddNote} className="p-3 bg-brand-600 hover:bg-brand-700 rounded-2xl text-white shadow-xl transition-all active:scale-90"><Plus size={22} /></button>
        </div>
        
        <div className="p-6">
          <div className="relative group">
            <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Filter neural clusters..." 
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm font-bold shadow-sm" 
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 custom-scrollbar">
          {notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.clusters.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))).map(note => (
            <div 
              key={note.id} 
              onClick={() => setActiveNoteId(note.id)} 
              className={`group px-5 py-4 cursor-pointer rounded-3xl transition-all relative border-2 ${activeNoteId === note.id ? 'bg-white dark:bg-slate-800 shadow-2xl translate-x-1 border-brand-500/20' : 'border-transparent hover:bg-white/50 dark:hover:bg-white/5'}`}
            >
              <h3 className="text-sm font-black truncate text-slate-800 dark:text-slate-200 uppercase tracking-tighter mb-2">{note.title}</h3>
              <div className="flex flex-wrap gap-2">
                {note.clusters.map(c => (
                  <span key={c} className="text-[9px] bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-brand-500/20">
                    {c}
                  </span>
                ))}
                {note.clusters.length === 0 && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Unmapped</span>}
              </div>
              <button onClick={(e) => handleDelete(note.id, e)} className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <div className="p-6 border-t dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
           <button onClick={() => setShowMLStats(true)} className="flex items-center justify-between w-full p-4 rounded-3xl bg-brand-600 text-white shadow-xl hover:bg-brand-700 transition-all">
              <div className="flex items-center gap-3"><Activity size={18} /><span className="text-xs font-black uppercase tracking-[0.2em]">Vault Intel</span></div>
              <ChevronRight size={18} />
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white dark:bg-slate-950">
        <header className="h-20 border-b dark:border-slate-800 px-10 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl z-30">
          <div className="flex items-center gap-8">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><ChevronRight className={isSidebarOpen ? 'rotate-180' : ''} /></button>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter">{activeNote?.title || 'Void Stream'}</span>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <FolderSync size={10} /> {activeNote?.activeBranch} branch
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex shadow-inner">
               <button onClick={() => setViewMode('text')} className={`px-6 py-2 text-xs font-black rounded-xl transition-all ${viewMode === 'text' ? 'bg-white dark:bg-slate-700 shadow-md text-brand-600 dark:text-brand-300' : 'text-slate-400'}`}>EDITOR</button>
               <button onClick={() => setViewMode('graph')} className={`px-6 py-2 text-xs font-black rounded-xl transition-all ${viewMode === 'graph' ? 'bg-white dark:bg-slate-700 shadow-md text-brand-600 dark:text-brand-300' : 'text-slate-400'}`}>SYNAPSE</button>
             </div>
             <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2" />
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 text-slate-400 hover:text-brand-500 transition-all">{isDarkMode ? <Sun size={24} /> : <Moon size={24} />}</button>
             <button onClick={() => activeNote && handleUpdate({ ...activeNote, config: { ...activeNote.config, is3D: !activeNote.config.is3D } })} className={`p-3 rounded-2xl transition-all ${activeNote?.config.is3D ? 'bg-brand-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`} title="3D Visualization"><Box size={24} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeNote ? (
            viewMode === 'text' ? (
              <Editor note={activeNote} onUpdate={handleUpdate} />
            ) : (
              <NodeGraph note={activeNote} onUpdate={() => {}} is3D={activeNote.config.is3D} />
            )
          ) : (
             <div className="h-full w-full flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-1000">
               <div className="p-10 bg-brand-500/10 rounded-full shadow-[0_0_100px_rgba(139,92,246,0.1)]"><Brain size={100} className="text-brand-500 opacity-20" /></div>
               <h2 className="text-3xl font-black tracking-tighter text-slate-400">SELECT A COGNITIVE STREAM</h2>
               <button onClick={handleAddNote} className="px-10 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95">Open New Origin</button>
             </div>
          )}
        </div>

        <ChatBot notes={notes} activeNote={activeNote} />
        {showMLStats && (
          <MLDashboard 
            onClose={() => setShowMLStats(false)} 
            analysis={activeNote ? activeNote.branches[activeNote.activeBranch].commits.slice(-1)[0].analysis : undefined} 
            globalIntel={globalIntel} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
