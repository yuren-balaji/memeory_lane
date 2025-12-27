
import React, { useState, useEffect } from 'react';
import { Note } from '../types';
import { Plus, Maximize2, Trash2, Zap } from 'lucide-react';

interface NodeGraphProps {
  note: Note;
  onUpdate: (note: Note) => void;
}

interface VisualNode {
  id: string;
  x: number;
  y: number;
  label: string;
}

const NodeGraph: React.FC<NodeGraphProps> = ({ note, onUpdate }) => {
  const [nodes, setNodes] = useState<VisualNode[]>([]);

  useEffect(() => {
    try {
      const head = note.branches[note.activeBranch].commits.slice(-1)[0];
      const parsedNodes = JSON.parse(head.content || '[]');
      if (Array.isArray(parsedNodes)) setNodes(parsedNodes);
      else throw new Error("Not array");
    } catch (e) {
      setNodes([
        { id: '1', x: 400, y: 300, label: 'Central Thought' }
      ]);
    }
  }, [note.id]);

  const addNode = () => {
    const newNode: VisualNode = {
      id: crypto.randomUUID(),
      x: 300 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      label: 'Subconscious link'
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    saveGraph(updated);
  };

  const saveGraph = (updatedNodes: VisualNode[]) => {
    const head = note.branches[note.activeBranch].commits.slice(-1)[0];
    const newCommit = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      content: JSON.stringify(updatedNodes),
      author: 'User',
      message: 'Neural Map Evolution',
      parentId: head?.id || null,
      analysis: head.analysis
    };

    onUpdate({
      ...note,
      branches: {
        ...note.branches,
        [note.activeBranch]: {
          ...note.branches[note.activeBranch],
          commits: [...note.branches[note.activeBranch].commits, newCommit],
          head: newCommit.id
        }
      }
    });
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center transition-colors">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:40px_40px] opacity-10" />
      
      <div className="relative w-full h-full">
        {nodes.map(node => (
          <div 
            key={node.id}
            style={{ left: node.x, top: node.y }}
            className="absolute p-5 bg-white dark:bg-slate-900 border-2 border-brand-200 dark:border-brand-900 rounded-[2rem] shadow-xl dark:shadow-brand-500/10 cursor-move min-w-[180px] transition-all hover:scale-105 active:scale-95 group backdrop-blur-md"
          >
            <input 
              value={node.label}
              onChange={(e) => {
                const updated = nodes.map(n => n.id === node.id ? { ...n, label: e.target.value } : n);
                setNodes(updated);
              }}
              onBlur={() => saveGraph(nodes)}
              className="w-full text-center font-bold text-slate-800 dark:text-slate-100 bg-transparent border-none focus:ring-0 outline-none p-0 text-sm"
            />
            <div className="absolute -top-3 -right-3 hidden group-hover:flex">
                <button 
                  onClick={() => {
                    const updated = nodes.filter(n => n.id !== node.id);
                    setNodes(updated);
                    saveGraph(updated);
                  }}
                  className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
            </div>
          </div>
        ))}

        {/* Dynamic Synaptic Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {nodes.length > 1 && nodes.map((n, i) => i > 0 && (
                <line 
                  key={`line-${i}`}
                  x1={nodes[0].x + 90} y1={nodes[0].y + 30}
                  x2={n.x + 90} y2={n.y + 30}
                  stroke="#6366f1" strokeWidth="2" strokeDasharray="10,5" className="opacity-30"
                />
            ))}
        </svg>
      </div>

      {/* Controls */}
      <div className="absolute top-10 right-10 flex flex-col gap-4">
        <button onClick={addNode} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-brand-500 hover:scale-110 transition-all">
          <Plus size={24} />
        </button>
        <button className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-slate-400 hover:scale-110 transition-all">
          <Maximize2 size={24} />
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/80 dark:bg-brand-600/20 backdrop-blur-2xl text-white px-8 py-3 rounded-[2rem] shadow-2xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-4">
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse shadow-[0_0_8px_#a78bfa]" />
          Synaptic Mapping Active
        </span>
        <div className="w-px h-4 bg-white/20" />
        <Zap size={14} className="text-brand-400" />
        <span>Cognitive View</span>
      </div>
    </div>
  );
};

export default NodeGraph;
