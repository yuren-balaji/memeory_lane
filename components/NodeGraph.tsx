
import React, { useState, useEffect } from 'react';
import { Note } from '../types';
import { Plus, Maximize2, Minimize2, Share, Trash2 } from 'lucide-react';

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
    } catch (e) {
      setNodes([
        { id: '1', x: 200, y: 200, label: 'Central Idea' }
      ]);
    }
  }, [note.id]);

  const addNode = () => {
    const newNode: VisualNode = {
      id: crypto.randomUUID(),
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 400,
      label: 'New Concept'
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
      message: 'Visual Graph Update',
      parentId: head?.id || null
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
    <div className="w-full h-full bg-gray-50 relative overflow-hidden flex items-center justify-center">
      {/* Simulation of a Canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]" />
      
      <div className="relative w-full h-full p-20">
        {nodes.map(node => (
          <div 
            key={node.id}
            style={{ left: node.x, top: node.y }}
            className="absolute p-4 bg-white border-2 border-indigo-200 rounded-xl shadow-lg cursor-move min-w-[150px] transition-transform hover:scale-105 active:scale-95 group"
          >
            <input 
              value={node.label}
              onChange={(e) => {
                const updated = nodes.map(n => n.id === node.id ? { ...n, label: e.target.value } : n);
                setNodes(updated);
                // Debounced save would be better but keeping simple for example
              }}
              onBlur={() => saveGraph(nodes)}
              className="w-full text-center font-semibold text-gray-700 bg-transparent border-none focus:ring-0"
            />
            <div className="absolute -top-2 -right-2 hidden group-hover:flex">
                <button 
                  onClick={() => {
                    const updated = nodes.filter(n => n.id !== node.id);
                    setNodes(updated);
                    saveGraph(updated);
                  }}
                  className="p-1 bg-red-500 text-white rounded-full shadow-md"
                >
                  <Trash2 size={10} />
                </button>
            </div>
          </div>
        ))}

        {/* Decorative connections (simplified representation) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            {nodes.length > 1 && nodes.map((n, i) => i > 0 && (
                <line 
                  key={`line-${i}`}
                  x1={nodes[0].x + 75} y1={nodes[0].y + 25}
                  x2={n.x + 75} y2={n.y + 25}
                  stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5"
                />
            ))}
        </svg>
      </div>

      {/* Graph Controls */}
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <button onClick={addNode} className="p-3 bg-white border border-gray-200 rounded-xl shadow-md text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all">
          <Plus size={20} />
        </button>
        <button className="p-3 bg-white border border-gray-200 rounded-xl shadow-md text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all">
          <Maximize2 size={20} />
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-indigo-900 text-white px-6 py-2 rounded-full shadow-2xl text-xs font-medium flex items-center gap-3">
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          Neural Layouting Active
        </span>
        <div className="w-px h-3 bg-white/20" />
        <button className="hover:text-indigo-300">Reset View</button>
      </div>
    </div>
  );
};

export default NodeGraph;
