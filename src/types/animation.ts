export type AnimationProperty =
  | "position"
  | "size"
  | "rotation"
  | "opacity"
  | "scale";

export interface Keyframe {
  id: string;
  time: number; // in milliseconds
  properties: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    rotation?: number;
    opacity?: number;
    scale?: { x: number; y: number };
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
}

export interface Timeline {
  id: string;
  objectId: string;
  keyframes: Keyframe[];
  duration: number; // in milliseconds
}

export interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  timelines: Timeline[];
}
