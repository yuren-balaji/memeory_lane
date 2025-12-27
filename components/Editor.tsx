
import React, { useState, useEffect, useRef } from 'react';
import { 
  GitCommit, Mic, X, Zap, Cpu, Headphones, Video, FileUp, Download, Play, Camera, Eye, Trash2
} from 'lucide-react';
import { Note, Commit, MLModelType, Asset, EmotionScore } from '../types';
import { mlEngine } from '../services/mlEngine';

interface EditorProps {
  note: Note;
  onUpdate: (note: Note) => void;
}

const Editor: React.FC<EditorProps> = ({ note, onUpdate }) => {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentBranch = note.branches[note.activeBranch];
  const headCommit = currentBranch.commits.find(c => c.id === currentBranch.head);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (headCommit) {
      setContent(headCommit.content);
      setAssets(headCommit.assets || []);
    }
  }, [note.id, note.activeBranch, headCommit]);

  useEffect(() => {
    const rec = mlEngine.getRecommendation(content);
    if (rec !== note.config.recommendedModel) {
      onUpdate({ ...note, config: { ...note.config, recommendedModel: rec } });
    }
  }, [content]);

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(prev => prev + "\n" + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  const handleSave = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const analysis = await mlEngine.analyzeNote(content, note.config.preferredModel);
      const autoMap = mlEngine.generateHierarchicalMap(content, assets);
      
      const clusters = analysis.emotions
        .filter(e => e.impact > 0.66)
        .map(e => e.label);

      const newCommit: Commit = {
        id: crypto.randomUUID(), 
        timestamp: Date.now(), 
        content, author: 'User', message: 'Neural Sync', 
        parentId: headCommit?.id || null, 
        analysis, assets: [...assets], autoMap
      };
      
      const updatedBranch = { ...currentBranch, commits: [...currentBranch.commits, newCommit], head: newCommit.id };
      onUpdate({ 
        ...note, 
        updatedAt: Date.now(), 
        clusters,
        branches: { ...note.branches, [note.activeBranch]: updatedBranch } 
      });
    } finally { setIsAnalyzing(false); }
  };

  const handleExport = () => {
    const data = JSON.stringify(note, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MemoryLane_${note.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMicToggle = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];
        mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
        mediaRecorder.current.onstop = () => {
          const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const id = `asset-audio-${Date.now()}`;
          setAssets(prev => [...prev, { id, type: 'audio', url, name: 'Neural Voice', blob }]);
          insertAtCursor(`\n[Asset Ref: ${id}]`);
        };
        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (err) { console.error(err); }
    } else {
      mediaRecorder.current?.stop();
      setIsRecording(false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      await new Promise(r => setTimeout(r, 1000));
      const canvas = document.createElement('canvas');
      canvas.width = 1280; canvas.height = 720;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const id = `asset-img-${Date.now()}`;
      setAssets(prev => [...prev, { id, type: 'image', url: dataUrl, name: 'Neural Frame' }]);
      insertAtCursor(`\n[Asset Ref: ${id}]`);
      stream.getTracks().forEach(t => t.stop());
    } catch (err) { console.error(err); }
  };

  const models: { id: MLModelType; label: string; desc: string }[] = [
    { id: 'lstm-neural', label: 'LSTM Neural', desc: 'Emotional depth' },
    { id: 'naive-bayes', label: 'Naive Bayes', desc: 'Linear logic' },
    { id: 'decision-tree', label: 'Decision Tree', desc: 'Deep structure' },
    { id: 'random-forest-lite', label: 'Random Forest', desc: 'Balanced' },
    { id: 'logistic-regression', label: 'Logistic Reg', desc: 'Rapid pulse' },
    { id: 'k-means-clustering', label: 'K-Means', desc: 'Pattern focus' }
  ];

  const getEmotionColor = (label: string) => {
    const colors: Record<string, string> = {
      'Love': '#f43f5e',
      'Passion': '#fb923c',
      'Caring': '#2dd4bf',
      'Insight': '#ef4444',
      'Openness': '#eab308',
      'Sadness': '#3b82f6',
      'Neutral': '#64748b'
    };
    return colors[label] || '#8b5cf6';
  };

  return (
    <div className="flex h-full bg-white dark:bg-slate-950 relative">
      <div className="flex-1 flex flex-col p-10 overflow-y-auto pb-48">
        
        {/* REFACTORED: Radial Synapse Gauges */}
        {headCommit?.analysis && (
          <div className="flex gap-8 mb-12 overflow-x-auto pb-6 scrollbar-hide">
            {headCommit.analysis.emotions.map((emo, idx) => {
              const color = getEmotionColor(emo.label);
              const strokeWidth = 8;
              const radius = 36;
              const circumference = 2 * Math.PI * radius;
              const scoreOffset = circumference - (emo.score * circumference);
              const impactOffset = circumference - (emo.impact * circumference);
              const isDominant = idx === 0;

              return (
                <div key={idx} className="flex flex-col items-center gap-4 group transition-all duration-500">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    {/* Background Soft Glow */}
                    <div className="absolute inset-0 rounded-full blur-2xl opacity-20 scale-75 group-hover:scale-100 transition-transform duration-700" style={{ backgroundColor: color }} />
                    
                    {/* Radial SVG Gauge */}
                    <svg className="w-full h-full -rotate-90 transform-gpu overflow-visible">
                      {/* Track Background */}
                      <circle cx="56" cy="56" r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-100 dark:text-slate-800" />
                      
                      {/* Score Ring (Inner) */}
                      <circle 
                        cx="56" cy="56" r={radius - 4} fill="transparent" stroke={color} strokeWidth={strokeWidth / 2} 
                        strokeDasharray={circumference} strokeDashoffset={scoreOffset} strokeLinecap="round"
                        className={`transition-all duration-[1.5s] ease-out opacity-40`}
                      />

                      {/* Impact Ring (Outer - Main) */}
                      <circle 
                        cx="56" cy="56" r={radius} fill="transparent" stroke={color} strokeWidth={strokeWidth} 
                        strokeDasharray={circumference} strokeDashoffset={impactOffset} strokeLinecap="round"
                        className={`transition-all duration-[2s] ease-out drop-shadow-[0_0_8px_rgba(0,0,0,0.2)] ${isDominant ? 'animate-pulse' : ''}`}
                      />
                    </svg>

                    {/* Central Percentage */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[14px] font-black tracking-tighter text-slate-900 dark:text-slate-100">
                        {Math.round(emo.impact * 100)}%
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Impact</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">
                        {emo.label}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Presence: {Math.round(emo.score * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Media Asset Bar */}
        <div className="flex flex-wrap gap-4 mb-10">
          {assets.map(asset => (
            <div key={asset.id} className="relative group p-4 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/50 w-56 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
               <div onClick={() => setPreviewAsset(asset)} className="cursor-pointer h-32 mb-3 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden">
                 {asset.type === 'image' ? <img src={asset.url} className="w-full h-full object-cover" /> : 
                  asset.type === 'audio' ? <Headphones size={32} className="text-brand-500" /> : <Video size={32} className="text-blue-500" />}
                 <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Play className="text-white drop-shadow-lg" size={32} /></div>
               </div>
               <div className="text-[9px] font-mono text-slate-400 truncate mb-1 px-1 tracking-tighter">REF: {asset.id}</div>
               <div className="text-[11px] font-black truncate text-slate-700 dark:text-slate-200 px-1 uppercase tracking-widest">{asset.name}</div>
               <button onClick={() => setAssets(prev => prev.filter(a => a.id !== asset.id))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
            </div>
          ))}
        </div>

        <textarea 
          ref={textareaRef} 
          value={content} 
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full text-2xl leading-relaxed text-slate-800 dark:text-slate-100 border-none focus:ring-0 resize-none mono bg-transparent placeholder-slate-200 dark:placeholder-slate-800"
          placeholder="Unfold your neural stream here..."
        />

        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => {
          const files = e.target.files;
          if (files) {
             Array.from(files).forEach(f => {
               const id = `asset-file-${Date.now()}`;
               const url = URL.createObjectURL(f);
               setAssets(prev => [...prev, { id, type: f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : 'audio', url, name: f.name }]);
               insertAtCursor(`\n[Asset Ref: ${id}]`);
             });
          }
        }} />

        {/* Neural Command Bar */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 px-8 py-5 rounded-[3.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.2)] flex items-center gap-2 z-40 transition-all">
          <button onClick={handleMicToggle} className={`p-4 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`} title="Mic Record"><Mic size={22} /></button>
          <button onClick={handleCameraCapture} className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400" title="Capture Frame"><Camera size={22} /></button>
          <button onClick={() => fileInputRef.current?.click()} className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400" title="Import Asset"><FileUp size={22} /></button>
          <button onClick={handleExport} className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-emerald-500" title="Export Synthesis"><Download size={22} /></button>
          
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-3" />

          <div className="relative">
            <button 
              onClick={() => setShowModelMenu(!showModelMenu)} 
              className={`p-4 px-6 rounded-full flex items-center gap-3 transition-all ${showModelMenu ? 'bg-brand-600 text-white shadow-xl shadow-brand-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600'}`} 
            >
              <Cpu size={22} />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] hidden sm:inline">{note.config.preferredModel.split('-')[0]}</span>
              {note.config.preferredModel === note.config.recommendedModel && (
                <Zap size={14} className="text-yellow-400 fill-yellow-400" />
              )}
            </button>
            {showModelMenu && (
              <div className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 w-72 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-4 animate-in fade-in slide-in-from-bottom-6 z-50">
                <div className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 border-b dark:border-slate-800 mb-3 tracking-widest">Inference Core</div>
                <div className="space-y-1">
                  {models.map(m => (
                    <button 
                      key={m.id} 
                      onClick={() => { onUpdate({ ...note, config: { ...note.config, preferredModel: m.id } }); setShowModelMenu(false); }}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between group ${note.config.preferredModel === m.id ? 'bg-brand-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <div>
                        <div className="font-black text-[11px] uppercase tracking-tight">{m.label}</div>
                        <div className="text-[9px] opacity-70">{m.desc}</div>
                      </div>
                      {note.config.recommendedModel === m.id && (
                        <Zap size={14} className="text-yellow-400 fill-yellow-400 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleSave} 
            disabled={isAnalyzing} 
            className="ml-3 bg-brand-600 hover:bg-brand-700 text-white px-10 py-4.5 rounded-full shadow-xl font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <GitCommit size={22} />}
            Commit Sync
          </button>
        </div>

        {/* Media Preview Modal */}
        {previewAsset && (
          <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-12">
             <button onClick={() => setPreviewAsset(null)} className="absolute top-12 right-12 text-white/30 hover:text-white p-5 transition-colors"><X size={48} /></button>
             <div className="max-w-4xl w-full flex flex-col items-center gap-10 animate-in zoom-in-95 duration-300">
                <div className="w-full bg-slate-900/40 p-12 rounded-[3.5rem] border border-white/5 flex flex-col items-center shadow-2xl">
                  {previewAsset.type === 'image' && <img src={previewAsset.url} className="max-h-[60vh] w-auto object-contain rounded-2xl shadow-2xl" />}
                  {previewAsset.type === 'audio' && (
                    <div className="flex flex-col items-center gap-8 w-full py-10">
                      <div className="p-10 bg-brand-500/10 rounded-full animate-pulse"><Headphones size={80} className="text-brand-400" /></div>
                      <audio src={previewAsset.url} controls autoPlay className="w-full max-w-xl h-12" />
                    </div>
                  )}
                  {previewAsset.type === 'video' && <video src={previewAsset.url} controls autoPlay className="w-full rounded-2xl shadow-2xl" />}
                </div>
                <div className="text-center text-white space-y-3">
                   <h3 className="font-black text-3xl tracking-tight uppercase">{previewAsset.name}</h3>
                   <div className="flex items-center justify-center gap-4 text-slate-500 font-mono text-xs">
                      <span>ID: {previewAsset.id}</span>
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-500/40" />
                      <p className="text-brand-400/80 font-sans font-bold uppercase tracking-widest">Active Neural Link</p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
