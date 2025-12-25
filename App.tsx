
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Book, 
  Plus, 
  Search, 
  Trash2, 
  Settings, 
  Share2, 
  GitBranch, 
  Activity, 
  Mic, 
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
  Save,
  Clock,
  Layout,
  Share,
  FileText,
  Package
} from 'lucide-react';
import { Note, Commit, Branch, MLAnalysis } from './types';
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

  // Initialize data
  useEffect(() => {
    const loadNotes = async () => {
      const stored = await getAllNotesFromDB();
      if (stored && stored.length > 0) {
        setNotes(stored);
      } else {
        // Create initial welcome note
        const initialNote = createNewNote('Welcome to MemoryLane');
        setNotes([initialNote]);
        saveNoteToDB(initialNote);
      }
    };
    loadNotes();
  }, []);

  const createNewNote = (title = 'Untitled Note', type: 'text' | 'mindmap' = 'text'): Note => {
    const id = crypto.randomUUID();
    const firstCommit: Commit = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      content: type === 'text' ? 'Start writing your thoughts...' : '{}',
      author: 'User',
      message: 'Initial Commit',
      parentId: null
    };

    const mainBranch: Branch = {
      name: 'main',
      commits: [firstCommit],
      head: firstCommit.id
    };

    return {
      id,
      title,
      branches: { 'main': mainBranch },
      activeBranch: 'main',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      type: type === 'text' ? 'text' : 'mindmap'
    };
  };

  const handleAddNote = () => {
    const newNote = createNewNote();
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    saveNoteToDB(newNote);
  };

  const activeNote = useMemo(() => 
    notes.find(n => n.id === activeNoteId), 
    [notes, activeNoteId]
  );

  const handleUpdateNote = async (updatedNote: Note) => {
    const updatedNotes = notes.map(n => n.id === updatedNote.id ? updatedNote : n);
    setNotes(updatedNotes);
    await saveNoteToDB(updatedNote);
  };

  const handleDeleteNote = async (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    if (activeNoteId === id) setActiveNoteId(updated[0]?.id || null);
    await deleteNoteFromDB(id);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`transition-all duration-300 bg-white border-r border-gray-200 flex flex-col ${isSidebarOpen ? 'w-72' : 'w-0 opacity-0'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-indigo-600">
            <Book size={20} />
            <span>MemoryLane</span>
          </div>
          <button onClick={handleAddNote} className="p-1 hover:bg-gray-100 rounded text-gray-500">
            <Plus size={18} />
          </button>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search notes..." 
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredNotes.map(note => (
            <div 
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className={`group px-4 py-3 cursor-pointer border-l-4 transition-colors ${activeNoteId === note.id ? 'bg-indigo-50 border-indigo-500' : 'border-transparent hover:bg-gray-50'}`}
            >
              <div className="flex justify-between items-start">
                <h3 className={`text-sm font-medium truncate ${activeNoteId === note.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {note.title || 'Untitled'}
                </h3>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-400">{new Date(note.updatedAt).toLocaleDateString()}</span>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded">{note.type}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => setShowMLStats(!showMLStats)}
            className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors w-full"
          >
            <Activity size={14} />
            <span>ML Analysis Engine</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
        {/* Toggle Sidebar Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 p-1 rounded-r-md z-10 shadow-sm hover:bg-gray-50 transition-colors"
        >
          {isSidebarOpen ? <ChevronRight size={14} className="rotate-180" /> : <ChevronRight size={14} />}
        </button>

        {activeNote ? (
          <>
            <header className="h-14 border-b border-gray-200 px-6 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <input 
                  type="text" 
                  value={activeNote.title}
                  onChange={(e) => handleUpdateNote({ ...activeNote, title: e.target.value })}
                  className="text-lg font-semibold bg-transparent border-none focus:ring-0 text-gray-800"
                  placeholder="Note title..."
                />
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button 
                    onClick={() => setViewMode('text')}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${viewMode === 'text' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                  >
                    Editor
                  </button>
                  <button 
                    onClick={() => setViewMode('graph')}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${viewMode === 'graph' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                  >
                    Brain Map
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                  <GitBranch size={14} />
                  <span>{activeNote.activeBranch}</span>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 tooltip" title="Share">
                  <Share2 size={18} />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-hidden relative">
              {viewMode === 'text' ? (
                <Editor 
                  note={activeNote} 
                  onUpdate={handleUpdateNote} 
                />
              ) : (
                <NodeGraph 
                  note={activeNote}
                  onUpdate={handleUpdateNote}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
              <Book size={40} className="text-gray-200" />
            </div>
            <p>Select a note or create a new one to begin your journey.</p>
            <button 
              onClick={handleAddNote}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
            >
              Start Recording Memories
            </button>
          </div>
        )}

        {/* Floating ML Analytics Panel */}
        {showMLStats && (
          <MLDashboard 
            onClose={() => setShowMLStats(false)} 
            analysis={activeNote?.branches[activeNote.activeBranch].commits.slice(-1)[0]?.analysis}
          />
        )}
      </main>
    </div>
  );
};

export default App;
