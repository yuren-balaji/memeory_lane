
import React, { useState, useEffect, useRef } from 'react';
import { Note, NodeData } from '../types';
import { Move, Rotate3d, Target, RefreshCw, ZoomIn, ZoomOut, Zap } from 'lucide-react';

interface NodeGraphProps {
  note: Note;
  onUpdate: (note: Note) => void;
  is3D?: boolean;
}

const NodeGraph: React.FC<NodeGraphProps> = ({ note, onUpdate, is3D = false }) => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.5, rotateX: -15, rotateY: 15 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragButton, setDragButton] = useState<number | null>(null);
  const dragRef = useRef({ lastX: 0, lastY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const head = note.branches[note.activeBranch].commits.slice(-1)[0];
    if (head?.autoMap && head.autoMap.length > 0) {
      setNodes(head.autoMap);
    } else {
      setNodes([{ id: 'root', label: 'Genesis Core', type: 'paragraph', emotion: 'Genesis', color: '#8b5cf6', x: 0, y: 0, z: 0 }]);
    }
  }, [note.id, note.activeBranch]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragButton(e.button);
    dragRef.current = { lastX: e.clientX, lastY: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragRef.current.lastX;
    const deltaY = e.clientY - dragRef.current.lastY;
    
    if (is3D) {
      if (dragButton === 2) {
        setTransform(p => ({ ...p, rotateY: p.rotateY + deltaX * 0.5, rotateX: p.rotateX - deltaY * 0.5 }));
      } else {
        setTransform(p => ({ ...p, x: p.x + deltaX * (1/p.scale), y: p.y + deltaY * (1/p.scale) }));
      }
    } else {
      setTransform(p => ({ ...p, x: p.x + deltaX, y: p.y + deltaY }));
    }
    dragRef.current = { lastX: e.clientX, lastY: e.clientY };
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing ${is3D ? 'perspective-[2500px]' : ''}`}
      onMouseDown={handleMouseDown} 
      onMouseMove={handleMouseMove} 
      onMouseUp={() => setIsDragging(false)}
      onWheel={(e) => setTransform(p => ({ ...p, scale: Math.min(Math.max(p.scale - e.deltaY * 0.001 * p.scale, 0.05), 5) }))}
      onContextMenu={(e) => is3D && e.preventDefault()}
    >
      <style>{`
        @keyframes pulse-link {
          0% { stroke-dashoffset: 100; opacity: 0.2; }
          50% { opacity: 0.7; }
          100% { stroke-dashoffset: 0; opacity: 0.2; }
        }
        @keyframes float-particle {
          0% { transform: translate(0, 0); }
          50% { transform: translate(100px, 50px); }
          100% { transform: translate(0, 0); }
        }
        .synapse-link {
          animation: pulse-link 4s linear infinite;
        }
        .neural-particle {
          animation: float-particle 20s ease-in-out infinite;
        }
      `}</style>

      {/* Atmospheric Neural Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-40">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="neural-particle absolute rounded-full bg-brand-500/20 blur-2xl"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * -20}s`
            }}
          />
        ))}
      </div>

      <div 
        className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1.5px,transparent_1.5px)] [background-size:120px_120px] opacity-[0.06] pointer-events-none"
        style={{ transform: `scale(${transform.scale}) translate(${transform.x * 0.05}px, ${transform.y * 0.05}px)` }}
      />
      
      <div 
        className="relative transform-style-3d transition-transform duration-150 ease-out"
        style={{ 
          transform: is3D 
            ? `translateZ(-600px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
            : `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
        }}
      >
        <svg className="absolute top-0 left-0 w-0 h-0 pointer-events-none overflow-visible transform-style-3d">
          <defs>
            <filter id="neural-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {nodes.map(node => {
            if (!node.parentId) return null;
            const parent = nodes.find(n => n.id === node.parentId);
            if (!parent) return null;
            return (
              <g key={`link-group-${node.id}`}>
                <line 
                  x1={parent.x} y1={parent.y} 
                  x2={node.x} y2={node.y} 
                  stroke={node.color} 
                  strokeWidth="4" 
                  strokeOpacity="0.08" 
                  style={{ transform: is3D ? `translateZ(${node.z}px)` : '' }}
                />
                <line 
                  className="synapse-link"
                  x1={parent.x} y1={parent.y} 
                  x2={node.x} y2={node.y} 
                  stroke={node.color} 
                  strokeWidth="2.5" 
                  strokeDasharray="12, 20"
                  filter="url(#neural-glow)"
                  style={{ transform: is3D ? `translateZ(${node.z}px)` : '' }}
                />
              </g>
            );
          })}
        </svg>

        {nodes.map(node => (
          <div 
            key={node.id} 
            style={{ 
              transform: `translate(-50%, -50%) ${is3D ? `translateZ(${node.z}px)` : ''}`, 
              left: node.x, 
              top: node.y, 
              backgroundColor: node.color, 
              boxShadow: `0 0 60px ${node.color}33`, 
              zIndex: Math.floor(node.z + 5000) 
            }} 
            className="absolute p-5 rounded-[2.5rem] min-w-[210px] border border-white/40 backdrop-blur-3xl transition-all hover:scale-110 hover:shadow-[0_0_90px_rgba(139,92,246,0.4)] group select-none cursor-pointer"
          >
            <div className="text-[10px] font-black uppercase text-white/70 mb-2 tracking-[0.25em]">{node.type}</div>
            <div className="text-xs font-black text-white leading-tight mb-4 drop-shadow-lg">{node.label}</div>
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-[9px] font-black text-white/95 bg-black/40 px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-inner border border-white/5">{node.emotion}</span>
              <Zap size={15} className="text-white/50 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 px-12 py-6 bg-slate-900/90 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.4)] z-50 animate-in slide-in-from-bottom-10 duration-700">
        <div className="flex items-center gap-5">
           <div className={`p-4 rounded-2xl ${is3D ? 'bg-brand-600 shadow-[0_0_35px_rgba(139,92,246,0.6)]' : 'bg-slate-800'}`}>
              {is3D ? <Rotate3d className="text-white" size={26} /> : <Move className="text-white" size={26} />}
           </div>
           <div className="flex flex-col">
             <span className="text-[11px] font-black text-white uppercase tracking-[0.35em] leading-none">{is3D ? 'Synaptic Space' : 'Neural Connections'}</span>
             <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-2">Cognitive Map Explorer</span>
           </div>
        </div>
        <div className="w-px h-12 bg-white/10" />
        <div className="flex items-center gap-4">
           <button onClick={() => setTransform(p => ({ ...p, scale: p.scale * 1.2 }))} className="p-2 text-slate-400 hover:text-white transition-colors"><ZoomIn size={22} /></button>
           <button onClick={() => setTransform(p => ({ ...p, scale: p.scale * 0.8 }))} className="p-2 text-slate-400 hover:text-white transition-colors"><ZoomOut size={22} /></button>
           <button onClick={() => setTransform({ x: 0, y: 0, scale: 0.5, rotateX: -15, rotateY: 15 })} className="p-3.5 hover:bg-white/5 rounded-2xl text-brand-400 hover:text-brand-300 transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2"><RefreshCw size={16} /> Recenter Matrix</button>
        </div>
      </div>
    </div>
  );
};

export default NodeGraph;
