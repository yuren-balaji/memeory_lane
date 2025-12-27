
export type MLModelType = 
  | 'logistic-regression' 
  | 'random-forest-lite' 
  | 'lstm-neural' 
  | 'naive-bayes' 
  | 'k-means-clustering' 
  | 'decision-tree'
  | 'symbolic';

export interface EmotionScore {
  label: string;
  score: number; // Probability/Confidence
  impact: number; // Weighted impact (0-1)
}

export interface Asset {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  name: string;
  blob?: Blob;
  transcription?: string;
  analysis?: string; 
}

export interface Commit {
  id: string;
  timestamp: number;
  content: string;
  author: string;
  message: string;
  parentId: string | null;
  assets?: Asset[];
  analysis?: MLAnalysis;
  autoMap?: NodeData[]; 
}

export interface Branch {
  name: string;
  commits: Commit[];
  head: string;
}

export interface NodeData {
  id: string;
  label: string;
  type: 'paragraph' | 'sentence' | 'word' | 'group' | 'asset';
  emotion: string; 
  color: string;
  x: number;
  y: number;
  z: number; 
  parentId?: string;
}

export interface Note {
  id: string;
  title: string;
  branches: Record<string, Branch>;
  activeBranch: string;
  tags: string[];
  clusters: string[]; // Emotion clusters
  createdAt: number;
  updatedAt: number;
  type: 'text' | 'mindmap';
  config: {
    preferredModel: MLModelType;
    recommendedModel: MLModelType;
    is3D: boolean;
  };
}

export interface MLAnalysis {
  emotions: EmotionScore[];
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  modelUsed: MLModelType;
  loss: number;
  confidence: number;
}

export interface GlobalIntelligence {
  synapticDensity: number;
  emotionalEntropy: number;
  dominantThemes: string[];
  vaultHealth: number;
  mostUsedModel: MLModelType;
  totalInferences: number;
  clusters: Record<string, number>;
}
