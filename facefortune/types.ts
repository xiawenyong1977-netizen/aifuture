
export enum FortuneStatus {
  EXCELLENT = '大吉',
  GOOD = '吉',
  NEUTRAL = '平',
  BAD = '凶',
  DANGEROUS = '大凶'
}

export interface FortuneResult {
  isCompliant: boolean;
  complianceReason?: string;
  faceAnalysis: {
    forehead: string;
    eyes: string;
    nose: string;
    mouth: string;
    overall: string;
  };
  eventAnalysis: {
    status: FortuneStatus;
    score: number;
    summary: string;
    advice: string[];
    remedy: string;
  };
  timeReflection: string;
}

export interface AppState {
  image: string | null;
  event: string;
  isAnalyzing: boolean;
  result: FortuneResult | null;
  error: string | null;
}
