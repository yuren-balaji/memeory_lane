
import React, { useMemo } from 'react';
import { X, TrendingDown, Target, Zap, Brain, Activity, Clock } from 'lucide-react';
import { MLAnalysis } from '../types';
import { mlEngine } from '../services/mlEngine';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface MLDashboardProps {
  onClose: () => void;
  analysis?: MLAnalysis;
}

const MLDashboard: React.FC<MLDashboardProps> = ({ onClose, analysis }) => {
  const trainingLogs = useMemo(() => mlEngine.getTrainingLogs(), []);

  const chartData = useMemo(() => trainingLogs.map((log, i) => ({
    name: i,
    loss: log.loss * 1000, // Scale for visibility
    accuracy: log.accuracy * 100
  })), [trainingLogs]);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 text-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-500">
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Brain className="text-indigo-400" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">ML Core</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Local Neural Engine</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Current State */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} /> Current Inference
          </h3>
          {analysis ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                <span className="text-[10px] text-gray-500 block mb-1">Dominant Emotion</span>
                <span className="text-xl font-bold text-indigo-400">{analysis.emotion}</span>
              </div>
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                <span className="text-[10px] text-gray-500 block mb-1">Sentiment</span>
                <span className={`text-xl font-bold ${analysis.sentiment === 'positive' ? 'text-green-400' : 'text-orange-400'}`}>
                  {analysis.sentiment}
                </span>
              </div>
              <div className="col-span-2 bg-gray-800 p-4 rounded-2xl border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-gray-500">Confidence Score</span>
                  <span className="text-[10px] text-indigo-400">{(analysis.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${analysis.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-dashed border-gray-700 p-8 rounded-2xl text-center">
              <p className="text-sm text-gray-500">No active analysis. Start writing to trigger the engine.</p>
            </div>
          )}
        </section>

        {/* Training Performance */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingDown size={14} /> Model Convergence
          </h3>
          <div className="h-48 bg-gray-800/40 rounded-2xl p-2 border border-gray-800">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="loss" stroke="#818cf8" fillOpacity={1} fill="url(#colorLoss)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-gray-500 text-center italic">Tracking loss over the last {trainingLogs.length} updates.</p>
        </section>

        {/* Architecture Info */}
        <section className="bg-indigo-600/10 border border-indigo-500/20 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="text-indigo-400" size={16} />
            <h4 className="text-sm font-bold">Optimized Neural Network</h4>
          </div>
          <p className="text-xs text-indigo-200/70 leading-relaxed">
            MemoryLane uses a hybrid CNN-RNN architecture optimized for mobile-lite environments. 
            All data remains encrypted and processed on-device.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex items-center gap-2 text-[10px] text-indigo-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>Q-Learning: Active</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-indigo-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>RL Optimizer: Ready</span>
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
          <span className="flex items-center gap-1"><Clock size={10} /> Last Sync: Just Now</span>
          <span>v2.5.0-LITE</span>
        </div>
      </div>
    </div>
  );
};

export default MLDashboard;
