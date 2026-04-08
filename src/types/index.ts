// Types for the Myopia App

export type PatternType = 
  | 'random' | 'horizontal' | 'vertical' | 'circle' | 'figureEight'
  | 'triangle' | 'squarePath' | 'rectangle' | 'parallelogram' | 'rhombus'
  | 'trapezoid' | 'kite' | 'pentagon' | 'hexagon' | 'heptagon' | 'octagon'
  | 'nonagon' | 'decagon' | 'hexagram' | 'decagram' | 'oval' | 'superellipse'
  | 'deltoid' | 'randomized' | 'peekaboo';

export type ObjectShape = 'circle' | 'square' | 'image';
export type BgType = 'color' | 'preset' | 'custom';
export type MusicSource = 'none' | 'preset' | 'custom';

export interface Point {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface PatternState {
  waypoints: Point[];
  currentWaypointIndex: number;
  segmentProgress: number;
  angle: number;
  directionX: number;
  directionY: number;
  noiseOffsetX: number;
  noiseOffsetY: number;
  noiseOffsetZ: number;
}

export interface PeekabooState {
  isVisible: boolean;
  timer: number | null;
}

export interface Session {
  startTime: number;
  speed: number;
  pattern: PatternType;
  durationMs: number;
}

export interface ExerciseConfig {
  pattern: PatternType;
  speedMultiplier: number;
  bounceEnabled: boolean;
  bounceIntensity: number;
  objectSize: number;
  objectOpacity: number;
  objectShape: ObjectShape;
  objectColor: string;
  bgType: BgType;
  bgColor: string;
  bgPreset: string;
  musicSource: MusicSource;
  musicPreset: string;
  musicVolume: number;
}

export type PatternFunction = (
  areaWidth: number,
  areaHeight: number,
  objectWidth: number,
  objectHeight: number,
  delta: number
) => Point;
