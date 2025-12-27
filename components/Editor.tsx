
import React, { useState, useEffect } from 'react';
import { History, GitCommit, GitPullRequest, Mic, Image as ImageIcon, X, Zap, Cpu, Layers } from 'lucide-react';
import { Note, Commit, Branch, MLModelType } from '../types';
import { mlEngine } from '../services/mlEngine';

interface EditorProps {
  note: Note;
  onUpdate: (note: Note) => void;
}

const Editor: React.FC<EditorProps> = ({ note, onUpdate }) => {
  const [content, setContent] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  
  const currentBranch = note.branches[note.activeBranch];
  const headCommit = currentBranch.commits.find(c => c.id === currentBranch.head);

  useEffect(() => {
    if (headCommit) setContent(headCommit.content);
    // Update recommendation whenever content changes significantly
    const rec = mlEngine.getRecommendation(content);
    if (rec !== note.config.recommendedModel) {
      onUpdate({ ...note, config: { ...note.config, recommendedModel: rec } });
    }
  }, [note.id, note.activeBranch, headCommit]);

  const handleSave = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await mlEngine.analyzeNote(content, note.config.preferredModel);
      const newCommit: Commit = {
        id: crypto.randomUUID(), timestamp: Date.now(), content, author: 'User', 
        message: 'Neural Update', parentId: headCommit?.id || null, analysis
      };
      const updatedBranch = { ...currentBranch, commits: [...currentBranch.commits, newCommit], head: newCommit.id };
      onUpdate({ ...note, updatedAt: Date.now(), branches: { ...note.branches, [note.activeBranch]: updatedBranch } });
    } finally { setIsAnalyzing(false); }
  };

  const models: { id: MLModelType; label: string; desc: string }[] = [
    { id: 'logistic-regression', label: 'Logistic Regression', desc: 'Best for short snippets' },
    { id: 'random-forest-lite', label: 'Random Forest Ensemble', desc: 'Robust for medium drafts' },
    { id: 'lstm-neural', label: 'LSTM Sequence', desc: 'Deep contextual journals' }
  ];

  return (
    <div className="flex h-full bg-white dark:bg-slate-950 relative">
      <div className="flex-1 flex flex-col p-10 overflow-y-auto">
        <textarea 
          value={content} onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full text-lg leading-relaxed text-slate-800 dark:text-slate-200 border-none focus:ring-0 resize-none mono bg-transparent"
          placeholder="Unleash your mind..."
        />

        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-6 z-20">
          <div className="relative">
            <button 
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-2 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-brand-500 font-bold text-xs"
            >
              <Cpu size={18} />
              <span>{note.config.preferredModel.replace('-', ' ').toUpperCase()}</span>
            </button>
            {showModelMenu && (
              <div className="absolute bottom-full mb-4 left-0 w-64 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl shadow-2xl p-2 animate-in slide-in-from-bottom-2">
                <div className="p-3 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-800 mb-2">Select Architecture</div>
                {models.map(m => (
                  <button 
                    key={m.id} onClick={() => { onUpdate({ ...note, config: { ...note.config, preferredModel: m.id } }); setShowModelMenu(false); }}
                    className={`w-full text-left p-3 rounded-2xl transition-all ${note.config.preferredModel === m.id ? 'bg-brand-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{m.label}</span>
                      {note.config.recommendedModel === m.id && <Zap size={10} className="text-yellow-400 fill-yellow-400"/>}
                    </div>
                    <div className={`text-[10px] ${note.config.preferredModel === m.id ? 'text-brand-100' : 'text-slate-500'}`}>{m.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
          <button onClick={() => setShowHistory(!showHistory)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400"><History size={22} /></button>
          <button onClick={handleSave} disabled={isAnalyzing} className="flex items-center gap-3 bg-brand-600 text-white px-8 py-3 rounded-3xl shadow-xl font-bold">
            {isAnalyzing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <GitCommit size={20} />}
            <span>Commit Thought</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Editor;
