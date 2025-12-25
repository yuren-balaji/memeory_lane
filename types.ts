
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
  head: string; // ID of the latest commit
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
}

export interface MLAnalysis {
  emotion: string;
  moodScore: number; // -1 to 1
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  modelUsed: string;
  loss: number;
  confidence: number;
}

export interface MLTrainingLog {
  timestamp: number;
  loss: number;
  accuracy: number;
  iterations: number;
  model: string;
}
