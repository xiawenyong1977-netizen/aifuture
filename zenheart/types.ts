
export interface SutraSegment {
  id: number;
  text: string;
  meaning: string;
  visualPrompt: string;
  imageUrl: string; // 新增：静态图片地址
}

export interface ReadingSession {
  id: string;
  timestamp: number;
  completedSegments: number;
  totalSegments: number;
  duration: number; // seconds
}

export type View = 'home' | 'reading' | 'history' | 'completed';
