
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Save, 
  History, 
  GitCommit, 
  GitPullRequest, 
  Mic, 
  Image as ImageIcon,
  CheckCircle,
  X,
  Plus,
  ArrowLeft,
  Terminal,
  Volume2,
  Package
} from 'lucide-react';
import { Note, Commit, Branch, Asset } from '../types';
import { mlEngine } from '../services/mlEngine';
import JSZip from 'jszip';

interface EditorProps {
  note: Note;
  onUpdate: (note: Note) => void;
}

const Editor: React.FC<EditorProps> = ({ note, onUpdate }) => {
  const [content, setContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const currentBranch = note.branches[note.activeBranch];
  const headCommit = currentBranch.commits.find(c => c.id === currentBranch.head);

  useEffect(() => {
    if (headCommit) {
      setContent(headCommit.content);
    }
  }, [note.id, note.activeBranch, headCommit]);

  const handleSave = async (msg = 'Manual Save') => {
    setIsAnalyzing(true);
    
    // ML Analysis in separate "thread" (simulated)
    const analysis = await mlEngine.analyzeNote(content);
    
    const newCommit: Commit = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      content: content,
      author: 'User',
      message: msg || commitMessage || `Updated on ${new Date().toLocaleString()}`,
      parentId: headCommit?.id || null,
      analysis: analysis
    };

    const updatedBranch: Branch = {
      ...currentBranch,
      commits: [...currentBranch.commits, newCommit],
      head: newCommit.id
    };

    const updatedNote: Note = {
      ...note,
      updatedAt: Date.now(),
      branches: {
        ...note.branches,
        [note.activeBranch]: updatedBranch
      }
    };

    onUpdate(updatedNote);
    setCommitMessage('');
    setIsAnalyzing(false);
  };

  const handleCreateBranch = () => {
    const branchName = prompt('Enter new branch name:');
    if (!branchName || note.branches[branchName]) return;

    const newBranch: Branch = {
      name: branchName,
      commits: [...currentBranch.commits],
      head: currentBranch.head
    };

    onUpdate({
      ...note,
      activeBranch: branchName,
      branches: {
        ...note.branches,
        [branchName]: newBranch
      }
    });
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Mock Speech to Text
      setTimeout(() => {
        setContent(prev => prev + ' [Audio Transcript: Thinking about my goals for this year.]');
        setIsRecording(false);
      }, 3000);
    }
  };

  const handleSpeak = () => {
    const speech = new SpeechSynthesisUtterance(content);
    window.speechSynthesis.speak(speech);
  };

  const exportZip = async () => {
    const zip = new JSZip();
    zip.file('note_content.txt', content);
    zip.file('metadata.json', JSON.stringify(note, null, 2));
    
    const commitsFolder = zip.folder('history');
    currentBranch.commits.forEach(c => {
      commitsFolder?.file(`${c.timestamp}.json`, JSON.stringify(c, null, 2));
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/\s+/g, '_')}_memorylane.zip`;
    a.click();
  };

  return (
    <div className="flex h-full bg-white relative">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full text-lg leading-relaxed text-gray-800 placeholder-gray-300 border-none focus:ring-0 resize-none mono"
          placeholder="Unleash your creativity..."
        />

        {/* Toolbar */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-gray-200 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-20">
          <button 
            onClick={toggleRecording}
            className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <Mic size={20} />
          </button>
          <button onClick={() => {}} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ImageIcon size={20} />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button onClick={handleSpeak} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <Volume2 size={20} />
          </button>
          <button onClick={() => {}} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <History size={20} />
          </button>
          <button 
            onClick={() => handleSave()}
            disabled={isAnalyzing}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Thinking...
              </span>
            ) : (
              <>
                <GitCommit size={18} />
                <span>Commit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* History / Git Sidebar */}
      {showHistory && (
        <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <History size={16} /> History
            </h3>
            <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-gray-100 rounded">
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <button 
              onClick={handleCreateBranch}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
            >
              <GitPullRequest size={14} /> New Branch
            </button>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Commits</label>
              <div className="space-y-2">
                {[...currentBranch.commits].reverse().map(commit => (
                  <div key={commit.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold text-gray-700 truncate mr-2">{commit.message}</span>
                      <span className="text-[9px] text-gray-400 whitespace-nowrap">{new Date(commit.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-2 italic mb-2">"{commit.content.slice(0, 50)}..."</p>
                    {commit.analysis && (
                      <div className="flex gap-1">
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px]">
                          {commit.analysis.emotion}
                        </span>
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[9px]">
                          {commit.analysis.sentiment}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-gray-200 space-y-2">
            <button onClick={exportZip} className="w-full py-2 bg-gray-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 hover:bg-gray-900">
              <Package size={14} /> Export memory.zip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
