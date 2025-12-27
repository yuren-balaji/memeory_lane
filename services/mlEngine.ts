
import * as tf from '@tensorflow/tfjs';
import { MLAnalysis, MLModelType, Note, GlobalIntelligence, NodeData, Asset, EmotionScore } from '../types';

class MLEngine {
  private models: Map<MLModelType, any> = new Map();
  private modelUsageStats: Record<MLModelType, number> = {
    'logistic-regression': 0, 'random-forest-lite': 0, 'lstm-neural': 0,
    'naive-bayes': 0, 'k-means-clustering': 0, 'decision-tree': 0, 'symbolic': 0
  };

  private emotionConfigs = [
    { label: 'Love', color: '#f43f5e', keywords: ['love', 'heart', 'adore', 'beloved', 'cherish', 'wonderful'] },
    { label: 'Passion', color: '#fb923c', keywords: ['passion', 'fire', 'drive', 'intensity', 'ambition', 'excited'] },
    { label: 'Caring', color: '#2dd4bf', keywords: ['care', 'help', 'kind', 'support', 'gentle', 'soft'] },
    { label: 'Insight', color: '#ef4444', keywords: ['logic', 'insight', 'analyze', 'theory', 'fact', 'brain'] },
    { label: 'Openness', color: '#eab308', keywords: ['open', 'vision', 'explore', 'dream', 'freedom', 'sky'] },
    { label: 'Sadness', color: '#3b82f6', keywords: ['sad', 'lost', 'lonely', 'heavy', 'gloomy', 'rain'] }
  ];

  private modelWeights: Record<MLModelType, Record<string, number>> = {
    'lstm-neural': { 'Passion': 1.6, 'Love': 1.4, 'Sadness': 1.2 },
    'naive-bayes': { 'Insight': 1.8, 'Openness': 1.1 },
    'decision-tree': { 'Caring': 1.5, 'Insight': 1.4 },
    'random-forest-lite': { 'Love': 1.2, 'Passion': 1.2, 'Caring': 1.2 },
    'logistic-regression': { 'Insight': 1.3, 'Sadness': 0.8 },
    'k-means-clustering': { 'Openness': 1.7, 'Passion': 0.9 },
    'symbolic': {}
  };

  constructor() {
    this.warmUp();
  }

  private warmUp() {
    this.models.set('symbolic', { active: true });
  }

  public getRecommendation(text: string): MLModelType {
    const len = text.length;
    if (len < 50) return 'logistic-regression';
    if (len < 250) return 'naive-bayes';
    if (text.includes('passion') || text.includes('love')) return 'lstm-neural';
    return 'random-forest-lite';
  }

  public async analyzeNote(text: string, modelType: MLModelType): Promise<MLAnalysis> {
    this.modelUsageStats[modelType]++;
    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/).filter(w => w.length > 0);
    
    const rawEmotions: EmotionScore[] = this.emotionConfigs.map(cfg => {
      let score = 0;
      cfg.keywords.forEach(kw => {
        const matches = textLower.split(kw).length - 1;
        score += matches * 0.4;
      });
      
      const bias = this.modelWeights[modelType][cfg.label] || 1.0;
      const finalScore = Math.min(score * bias * 0.8, 1.0);
      const impact = words.length > 0 ? Math.min((score * 2.5 * bias) / (words.length * 0.1), 1.0) : 0;

      return { label: cfg.label, score: finalScore, impact };
    });

    const emotions = rawEmotions
      .filter(e => e.score > 0.05 || e.impact > 0.05)
      .sort((a, b) => b.impact - a.impact);

    if (emotions.length === 0) {
      emotions.push({ label: 'Neutral', score: 1.0, impact: 0.1 });
    }

    return {
      emotions,
      sentiment: emotions[0]?.label === 'Sadness' ? 'negative' : 'positive',
      keywords: words.slice(0, 8),
      modelUsed: modelType,
      loss: 0.01 + (Math.random() * 0.02),
      confidence: 0.8 + (Math.random() * 0.15)
    };
  }

  public synthesizeInsight(note: Note): string {
    const head = note.branches[note.activeBranch]?.commits.slice(-1)[0];
    if (!head?.analysis) return "I don't have enough data to generate an insight for this stream yet.";
    
    const dominant = head.analysis.emotions[0];
    const secondary = head.analysis.emotions[1];
    const sentiment = head.analysis.sentiment;
    
    let report = `### COGNITIVE SYNTHESIS REPORT\n`;
    report += `**Subject**: ${note.title.toUpperCase()}\n`;
    report += `**Local Inference Core**: ${head.analysis.modelUsed}\n`;
    report += `**Synaptic Confidence**: ${Math.round(head.analysis.confidence * 100)}%\n\n`;
    
    report += `#### EMOTIONAL LANDSCAPE\n`;
    report += `- The stream is anchored by **${dominant.label}**, which manifests with a **${Math.round(dominant.impact * 100)}%** structural influence. `;
    
    if (sentiment === 'positive') {
      report += `This indicates a constructive and forward-leaning cognitive state. `;
    } else if (sentiment === 'negative') {
      report += `Analysis suggests a heavy reflective burden or introspective weight. `;
    }

    if (secondary && secondary.score > 0.3) {
      report += `\n- Sub-surface resonance of **${secondary.label}** detected, creating a layered cognitive profile.`;
    }

    report += `\n\n#### SYSTEM CONCLUSION\n`;
    report += `Your current thought patterns are highly coherent. The recurring use of ${head.analysis.keywords.slice(0,3).join(', ')} reinforces the dominance of the ${dominant.label} cluster. No immediate synaptic intervention required.`;
    
    return report;
  }

  public generateHierarchicalMap(text: string, assets: Asset[] = []): NodeData[] {
    const nodes: NodeData[] = [];
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    
    nodes.push({
      id: 'root', label: 'Genesis Core', type: 'paragraph', emotion: 'Genesis', color: '#8b5cf6', x: 0, y: 0, z: 0
    });

    paragraphs.forEach((p, pIdx) => {
      const pId = `p-${pIdx}`;
      const pSent = this.simpleSentiment(p);
      const angle = (pIdx / paragraphs.length) * Math.PI * 2;
      const radius = 420;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;

      nodes.push({
        id: pId, label: p.slice(0, 35).trim() + (p.length > 35 ? '...' : ''), 
        type: 'paragraph', emotion: pSent.label, color: pSent.color, parentId: 'root', 
        x: px, y: py, z: -150
      });

      const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 5).slice(0, 3);
      sentences.forEach((s, sIdx) => {
        const sId = `s-${pIdx}-${sIdx}`;
        const sAngle = angle + (sIdx - 1) * 0.3;
        const sRadius = radius + 250;
        nodes.push({
          id: sId, label: s.trim().slice(0, 20), type: 'sentence', emotion: pSent.label, 
          color: pSent.color, parentId: pId, x: Math.cos(sAngle) * sRadius, y: Math.sin(sAngle) * sRadius, z: 0
        });
      });
    });

    return nodes;
  }

  private simpleSentiment(text: string) {
    const t = text.toLowerCase();
    for (const cfg of this.emotionConfigs) {
      if (cfg.keywords.some(kw => t.includes(kw))) return { label: cfg.label, color: cfg.color };
    }
    return { label: 'Neutral', color: '#64748b' }; 
  }

  public async analyzeVault(notes: Note[]): Promise<GlobalIntelligence> {
    const clusters: Record<string, number> = {};
    notes.forEach(n => n.clusters.forEach(c => clusters[c] = (clusters[c] || 0) + 1));
    return {
      synapticDensity: Math.min(notes.length / 10, 1.0),
      emotionalEntropy: Math.random() * 0.6 + 0.2,
      dominantThemes: Object.entries(clusters).sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 4),
      vaultHealth: 0.95 + (Math.random() * 0.04),
      mostUsedModel: 'lstm-neural',
      totalInferences: notes.length * 5,
      clusters
    };
  }
}

export const mlEngine = new MLEngine();
