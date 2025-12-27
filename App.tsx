
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Book, Plus, Search, Trash2, Settings, Share2, GitBranch, 
  Activity, Mic, Image as ImageIcon, ChevronRight, Sun, Moon, Zap, Brain, Globe
} from 'lucide-react';
import { Note, Commit, Branch, MLAnalysis, GlobalIntelligence } from './types';
import { getAllNotesFromDB, saveNoteToDB, deleteNoteFromDB } from './services/db';
import { mlEngine } from './services/mlEngine';
import Editor from './components/Editor';
import MLDashboard from './components/MLDashboard';
import NodeGraph from './components/NodeGraph';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMLStats, setShowMLStats] = useState(false);
  const [viewMode, setViewMode] = useState<'text' | 'graph'>('text');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalIntel, setGlobalIntel] = useState<GlobalIntelligence | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const loadData = async () => {
      const stored = await getAllNotesFromDB();
      if (stored && stored.length > 0) {
        setNotes(stored);
        const intel = await mlEngine.analyzeVault(stored);
        setGlobalIntel(intel);
      } else {
        const initial = createNewNote('Cognitive Origin');
        setNotes([initial]);
        saveNoteToDB(initial);
      }
    };
    loadData();
  }, []);

  const createNewNote = (title = 'New Memory'): Note => {
    const id = crypto.randomUUID();
    const firstCommit: Commit = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      content: 'Synthesizing ideas...',
      author: 'User',
      message: 'Neural Seed',
      parentId: null
    };

    return {
      id, title,
      branches: { 'main': { name: 'main', commits: [firstCommit], head: firstCommit.id } },
      activeBranch: 'main',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      type: 'text',
      config: {
        preferredModel: 'logistic-regression',
        recommendedModel: 'logistic-regression'
      }
    };
  };

  const handleAddNote = () => {
    const newNote = createNewNote();
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    saveNoteToDB(newNote);
  };

  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId), [notes, activeNoteId]);

  const handleUpdateNote = async (updatedNote: Note) => {
    const updatedNotes = notes.map(n => n.id === updatedNote.id ? updatedNote : n);
    setNotes(updatedNotes);
    await saveNoteToDB(updatedNote);
    // Refresh global insights on every update
    const intel = await mlEngine.analyzeVault(updatedNotes);
    setGlobalIntel(intel);
  };

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(q) || 
      n.branches[n.activeBranch].commits.slice(-1)[0].analysis?.emotion.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  return (
    <div className="flex h-screen w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-hidden">
      <aside className={`transition-all duration-300 bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col ${isSidebarOpen ? 'w-80' : 'w-0 opacity-0 overflow-hidden'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-xl shadow-lg">
              <Brain className="text-white" size={20} />
            </div>
            <span className="font-bold tracking-tight text-lg">MemoryLane</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg text-slate-500"><Sun size={18} /></button>
            <button onClick={handleAddNote} className="p-2 bg-brand-600 hover:bg-brand-700 rounded-lg text-white shadow-md"><Plus size={18} /></button>
          </div>
        </div>

        {globalIntel && (
          <div className="p-4 mx-4 my-2 bg-brand-600/5 border border-brand-500/20 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-brand-500 uppercase flex items-center gap-1"><Globe size={10}/> Vault Sync</span>
              <span className="text-[10px] text-brand-400">{(globalIntel.synapticDensity * 100).toFixed(0)}% Dense</span>
            </div>
            <div className="h-1 bg-brand-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500" style={{ width: `${globalIntel.vaultHealth * 100}%` }} />
            </div>
          </div>
        )}

        <div className="p-4"><div className="relative group">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input type="text" placeholder="Search cognitive clusters..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div></div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredNotes.map(note => (
            <div key={note.id} onClick={() => setActiveNoteId(note.id)} className={`group px-4 py-3 cursor-pointer rounded-xl transition-all border ${activeNoteId === note.id ? 'bg-white dark:bg-slate-800 border-brand-200 dark:border-brand-900 shadow-md translate-x-1' : 'border-transparent hover:bg-white dark:hover:bg-slate-800/50'}`}>
              <h3 className={`text-sm font-semibold truncate ${activeNoteId === note.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400'}`}>{note.title}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-slate-400 font-medium">{note.branches[note.activeBranch].commits.slice(-1)[0].analysis?.emotion || 'Analyzing...'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t dark:border-slate-800">
          <button onClick={() => setShowMLStats(!showMLStats)} className="flex items-center gap-3 text-xs font-semibold text-slate-500 hover:text-brand-600 w-full p-2">
            <Activity size={16} /> <span>Vault Intelligence Core</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-slate-950">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-r-xl z-10 shadow-lg border-l-0">
          <ChevronRight size={16} className={isSidebarOpen ? 'rotate-180' : ''} />
        </button>

        {activeNote ? (
          <>
            <header className="h-16 border-b dark:border-slate-800 px-8 flex items-center justify-between">
              <div className="flex items-center gap-6 flex-1">
                <input type="text" value={activeNote.title} onChange={(e) => handleUpdateNote({ ...activeNote, title: e.target.value })} className="text-xl font-bold bg-transparent border-none focus:ring-0 w-full max-w-md" />
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                  <button onClick={() => setViewMode('text')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'text' ? 'bg-white dark:bg-slate-700 shadow-md text-brand-600' : 'text-slate-500'}`}>Editor</button>
                  <button onClick={() => setViewMode('graph')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'graph' ? 'bg-white dark:bg-slate-700 shadow-md text-brand-600' : 'text-slate-500'}`}>Neural Map</button>
                </div>
              </div>
            </header>
            <div className="flex-1 overflow-hidden relative">
              {viewMode === 'text' ? <Editor note={activeNote} onUpdate={handleUpdateNote} /> : <NodeGraph note={activeNote} onUpdate={handleUpdateNote} />}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <Zap size={56} className="text-brand-500" />
            <h2 className="text-2xl font-bold">Initiate Cognition</h2>
            <button onClick={handleAddNote} className="px-8 py-3 bg-brand-600 text-white rounded-2xl shadow-xl font-bold flex items-center gap-2"><Plus size={20} /> New Thought Stream</button>
          </div>
        )}
        {showMLStats && <MLDashboard onClose={() => setShowMLStats(false)} analysis={activeNote?.branches[activeNote.activeBranch].commits.slice(-1)[0]?.analysis} globalIntel={globalIntel} />}
      </main>
    </div>
  );
};

export default App;
