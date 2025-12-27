
export type MLModelType = 'logistic-regression' | 'random-forest-lite' | 'transformer-lite' | 'lstm-neural';

export interface Commit {
  id: string;
  timestamp: number;
  content: string;
  author: string;
  message: string;
  parentId: string | null;
  assets?: Asset[];
  analysis?: MLAnalysis;
}

export interface Asset {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  name: string;
  transcription?: string;
}

export interface Branch {
  name: string;
  commits: Commit[];
  head: string;
}

export interface Note {
  id: string;
  title: string;
  branches: Record<string, Branch>;
  activeBranch: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  type: 'text' | 'mindmap' | 'kanban';
  config: {
    preferredModel: MLModelType;
    recommendedModel: MLModelType;
  };
}

export interface MLAnalysis {
  emotion: string;
  moodScore: number; 
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  modelUsed: MLModelType;
  loss: number;
  confidence: number;
  tensorStats?: {
    nodes: number;
    depth: number;
  };
}

export interface GlobalIntelligence {
  synapticDensity: number; // Interconnectedness of all notes
  emotionalEntropy: number; // Chaos/Stability of mood across vault
  dominantThemes: string[];
  vaultHealth: number; // 0-1 based on model convergence
}

export interface MLTrainingLog {
  timestamp: number;
  loss: number;
  accuracy: number;
  iterations: number;
  model: string;
}
