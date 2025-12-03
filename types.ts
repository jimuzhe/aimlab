
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

export type CrosshairType = 'dot' | 'cross' | 'circle' | 'plus';

export type Language = 'en' | 'zh';

export interface GameSettings {
  targetCount: number;
  targetSize: number;
  duration: number;
  crosshair: CrosshairType;
  sensitivity: number;
  language: Language;
}

export interface TargetData {
  id: string;
  position: [number, number, number];
  createdAt: number;
  spawnTime: number; // For reaction time tracking
}

export interface HitData {
  time: number; // Timestamp relative to start
  reactionTime: number; // ms to kill
  distance: number;
}

export interface ScoreStats {
  score: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  avgReactionTime: number;
  hitHistory: HitData[];
}
