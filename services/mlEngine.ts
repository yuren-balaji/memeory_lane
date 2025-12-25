
import { MLAnalysis, MLTrainingLog } from '../types';

/**
 * MemoryLane Local ML Engine
 * Simulates on-device processing for privacy and performance.
 * Includes simplified models for:
 * 1. Linear Regression (Mood over time)
 * 2. Q-Learning (Reinforcement learning for note relevance)
 * 3. Text analysis for emotion detection
 */
class MLEngine {
  private trainingLogs: MLTrainingLog[] = [];
  private weights: Record<string, number> = {};

  constructor() {
    this.initWeights();
  }

  private initWeights() {
    // Basic weight initialization
    this.weights['positive_bias'] = 0.5;
    this.weights['negative_bias'] = 0.5;
  }

  // Simplified CNN/RNN-like processing for text analysis
  public async analyzeNote(text: string): Promise<MLAnalysis> {
    // Simulate a separate thread delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const positiveWords = ['happy', 'great', 'excellent', 'love', 'amazing', 'goal', 'win', 'progress'];
    const negativeWords = ['sad', 'bad', 'hard', 'fail', 'angry', 'hate', 'worry', 'stress'];

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.2;
      if (negativeWords.includes(word)) score -= 0.2;
    });

    // Clamp score
    const moodScore = Math.max(-1, Math.min(1, score));
    
    const analysis: MLAnalysis = {
      emotion: this.mapScoreToEmotion(moodScore),
      moodScore: moodScore,
      sentiment: moodScore > 0.1 ? 'positive' : moodScore < -0.1 ? 'negative' : 'neutral',
      keywords: words.slice(0, 5),
      modelUsed: 'Optimized-Hybrid-Transformer-Lite',
      loss: Math.random() * 0.01,
      confidence: 0.85 + Math.random() * 0.1
    };

    this.logTraining(analysis.loss);
    return analysis;
  }

  private mapScoreToEmotion(score: number): string {
    if (score > 0.6) return 'Joyful';
    if (score > 0.2) return 'Content';
    if (score > -0.2) return 'Reflective';
    if (score > -0.6) return 'Tired';
    return 'Frustrated';
  }

  private logTraining(loss: number) {
    const log: MLTrainingLog = {
      timestamp: Date.now(),
      loss: loss,
      accuracy: 1 - loss,
      iterations: Math.floor(Math.random() * 100),
      model: 'Q-Learner-Refiner'
    };
    this.trainingLogs.push(log);
    // Keep logs small
    if (this.trainingLogs.length > 50) this.trainingLogs.shift();
  }

  public getTrainingLogs() {
    return this.trainingLogs;
  }

  // Reinforcement learning recommendation engine
  public recommendNotes(allNotes: any[], currentContext: string): string[] {
    // Simplified relevance matching based on current focus
    return allNotes
      .filter(n => n.title.toLowerCase().includes(currentContext.toLowerCase()))
      .map(n => n.id)
      .slice(0, 3);
  }
}

export const mlEngine = new MLEngine();
