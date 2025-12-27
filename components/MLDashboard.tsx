
import React, { useMemo, useState, useEffect } from 'react';
import { X, TrendingDown, Target, Zap, Brain, Activity, Clock, Cpu, Globe, PieChart } from 'lucide-react';
import { MLAnalysis, GlobalIntelligence } from '../types';
import { mlEngine } from '../services/mlEngine';
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MLDashboardProps {
  onClose: () => void;
  analysis?: MLAnalysis;
  globalIntel: GlobalIntelligence | null;
}

const MLDashboard: React.FC<MLDashboardProps> = ({ onClose, analysis, globalIntel }) => {
  const [tab, setTab] = useState<'current' | 'vault'>('current');
  const trainingLogs = useMemo(() => mlEngine.getTrainingLogs(), []);
  const chartData = useMemo(() => trainingLogs.map((log, i) => ({ name: i, accuracy: log.accuracy * 100 })), [trainingLogs]);

  return (
    <div className="fixed inset-y-0 right-0 w-[28rem] bg-slate-950 text-white shadow-2xl z-50 flex flex-col border-l border-slate-800">
      <div className="p-8 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 rounded-2xl"><Brain className="text-brand-400" size={28} /></div>
          <div><h2 className="font-extrabold text-xl leading-tight">Neural Command</h2><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Multi-Agent System</p></div>
        </div>
        <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-xl"><X size={24} /></button>
      </div>

      <div className="flex gap-4 p-6 border-b border-slate-800 bg-slate-900/20">
        <button onClick={() => setTab('current')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'current' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-slate-500'}`}>Current Inference</button>
        <button onClick={() => setTab('vault')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'vault' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-slate-500'}`}>Vault Intelligence</button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
        {tab === 'current' ? (
          <>
            <section className="space-y-6">
              <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><Target size={14} /> Active Agent</h3>
              {analysis ? (
                <div className="space-y-4">
                  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                      <Cpu size={16} className="text-brand-400" />
                      <span className="text-xs font-bold text-slate-300">Architecture: {analysis.modelUsed.replace('-', ' ').toUpperCase()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-brand-500/5 p-4 rounded-2xl border border-brand-500/10 text-center">
                        <span className="text-[10px] text-slate-500 block mb-1 uppercase">Emotion</span>
                        <span className="text-xl font-black text-brand-400">{analysis.emotion}</span>
                      </div>
                      <div className="bg-brand-500/5 p-4 rounded-2xl border border-brand-500/10 text-center">
                        <span className="text-[10px] text-slate-500 block mb-1 uppercase">Confidence</span>
                        <span className="text-xl font-black text-white">{(analysis.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 border border-dashed border-slate-800 text-center rounded-[2rem] text-slate-600 text-sm font-bold">Awaiting sensory input...</div>
              )}
            </section>
          </>
        ) : (
          <section className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><Globe size={14} /> Global Synthesis</h3>
            {globalIntel ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Synaptic Density</span>
                      <span className="text-2xl font-black text-brand-400">{(globalIntel.synapticDensity * 10).toFixed(1)}</span>
                   </div>
                   <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Stability</span>
                      <span className="text-2xl font-black text-green-400">{(globalIntel.vaultHealth * 100).toFixed(0)}%</span>
                   </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                   <span className="text-xs font-bold text-slate-400 mb-4 block">Dominant Conceptual Themes</span>
                   <div className="flex flex-wrap gap-2">
                      {globalIntel.dominantThemes.map(t => <span key={t} className="px-3 py-1 bg-brand-500/10 text-brand-400 rounded-full text-[10px] font-black border border-brand-500/20">{t}</span>)}
                   </div>
                </div>
              </div>
            ) : (
              <div className="p-12 border border-dashed border-slate-800 text-center rounded-[2rem] text-slate-600 text-sm font-bold">Syncing cognitive vault...</div>
            )}
          </section>
        )}
      </div>

      <div className="p-8 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-[10px] font-black text-slate-600 tracking-widest uppercase">
        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_#8b5cf6]" /> Multi-Agent Ready</span>
        <span>Neural Version 3.1.2</span>
      </div>
    </div>
  );
};

export default MLDashboard;
