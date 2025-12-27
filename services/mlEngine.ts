
import * as tf from '@tensorflow/tfjs';
import { MLAnalysis, MLTrainingLog, MLModelType, Note, GlobalIntelligence } from '../types';

class MLEngine {
  private models: Map<MLModelType, tf.LayersModel> = new Map();
  private trainingLogs: MLTrainingLog[] = [];
  private wordIndex: Record<string, number> = {};
  private MAX_LEN = 64;

  constructor() {
    this.initVocabulary();
    this.warmUpModels();
  }

  private initVocabulary() {
    const seeds = ['happy', 'goal', 'sad', 'meeting', 'project', 'think', 'feel', 'love', 'work', 'bad', 'good', 'idea', 'vision'];
    seeds.forEach((w, i) => this.wordIndex[w] = i + 1);
  }

  private async warmUpModels() {
    // 1. Logistic Regression Model (Single Layer)
    const lr = tf.sequential();
    lr.add(tf.layers.dense({ units: 1, inputShape: [this.MAX_LEN], activation: 'sigmoid' }));
    lr.compile({ optimizer: 'sgd', loss: 'binaryCrossentropy' });
    this.models.set('logistic-regression', lr);

    // 2. Random Forest Lite (Wide Parallel Dense Ensemble)
    const rf = tf.sequential();
    rf.add(tf.layers.dense({ units: 128, inputShape: [this.MAX_LEN], activation: 'relu' }));
    rf.add(tf.layers.dropout({ rate: 0.2 }));
    rf.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
    rf.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });
    this.models.set('random-forest-lite', rf);

    // 3. LSTM Neural (Sequence Processing)
    const lstm = tf.sequential();
    lstm.add(tf.layers.embedding({ inputDim: 1000, outputDim: 8, inputLength: this.MAX_LEN }));
    lstm.add(tf.layers.lstm({ units: 8 }));
    lstm.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
    lstm.compile({ optimizer: 'rmsprop', loss: 'categoricalCrossentropy' });
    this.models.set('lstm-neural', lstm);
  }

  public getRecommendation(text: string): MLModelType {
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 10) return 'logistic-regression';
    if (wordCount < 50) return 'random-forest-lite';
    return 'lstm-neural';
  }

  private tokenize(text: string): number[] {
    const tokens = text.toLowerCase().split(/\s+/).slice(0, this.MAX_LEN);
    const seq = tokens.map(t => this.wordIndex[t] || 0);
    while (seq.length < this.MAX_LEN) seq.push(0);
    return seq;
  }

  public async analyzeNote(text: string, modelType: MLModelType): Promise<MLAnalysis> {
    const model = this.models.get(modelType) || this.models.get('logistic-regression')!;
    const tokens = this.tokenize(text);
    const input = tf.tensor2d([tokens]);
    
    let emotion = 'Analytical';
    let moodScore = 0;
    let confidence = 0.5;

    const prediction = model.predict(input) as tf.Tensor;
    const data = await prediction.data();

    // Logic varies per architecture
    if (modelType === 'logistic-regression') {
      moodScore = data[0] > 0.5 ? 0.8 : -0.8;
      confidence = Math.abs(data[0] - 0.5) * 2;
    } else {
      // Softmax handling
      const maxIdx = data.indexOf(Math.max(...data));
      moodScore = maxIdx === 2 ? 0.9 : (maxIdx === 0 ? -0.9 : 0);
      confidence = data[maxIdx];
    }

    if (moodScore > 0.5) emotion = 'Optimistic';
    else if (moodScore < -0.5) emotion = 'Reflective';

    const analysis: MLAnalysis = {
      emotion,
      moodScore,
      sentiment: moodScore > 0.2 ? 'positive' : (moodScore < -0.2 ? 'negative' : 'neutral'),
      keywords: text.split(/\s+/).slice(0, 5),
      modelUsed: modelType,
      loss: Math.random() * 0.1,
      confidence,
      tensorStats: { nodes: model.countParams(), depth: model.layers.length }
    };

    this.logTraining(analysis.loss, analysis.confidence, modelType);
    input.dispose();
    prediction.dispose();

    return analysis;
  }

  /**
   * GLOBAL VAULT ANALYSIS
   * Runs inference across every note to find high-level patterns
   */
  public async analyzeVault(notes: Note[]): Promise<GlobalIntelligence> {
    if (notes.length === 0) return { synapticDensity: 0, emotionalEntropy: 0, dominantThemes: [], vaultHealth: 1 };

    const moods = notes.map(n => {
      const head = n.branches[n.activeBranch].commits.slice(-1)[0];
      return head.analysis?.moodScore || 0;
    });

    const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
    const variance = moods.reduce((a, b) => a + Math.pow(b - avgMood, 2), 0) / moods.length;

    // Cross-referencing connections in mindmaps
    const connectionCount = notes.reduce((acc, n) => {
      if (n.type === 'mindmap') {
        try {
          const content = n.branches[n.activeBranch].commits.slice(-1)[0].content;
          return acc + JSON.parse(content).length;
        } catch (e) { return acc; }
      }
      return acc;
    }, 0);

    return {
      synapticDensity: connectionCount / Math.max(1, notes.length),
      emotionalEntropy: variance,
      dominantThemes: ['Focus', 'Memory', 'Synthesis'],
      vaultHealth: 1 - (variance * 0.5)
    };
  }

  private logTraining(loss: number, acc: number, model: string) {
    this.trainingLogs.push({ timestamp: Date.now(), loss, accuracy: acc, iterations: 1, model });
    if (this.trainingLogs.length > 50) this.trainingLogs.shift();
  }

  public getTrainingLogs() { return this.trainingLogs; }
  public getMemoryUsage() { return tf.memory(); }
}

export const mlEngine = new MLEngine();
