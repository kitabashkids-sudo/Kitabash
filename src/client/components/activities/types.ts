export interface ActivityData {
  id: string;
  phase: 'learn' | 'perform' | 'probe';
  type: string;
  title: string;
  instructions: string;
  config: any;
  hints: string[];
  points: number;
  answer_key?: any; // only present for staff previews
}

export interface GradeResult {
  score: number;
  correct: boolean;
  feedback: string;
  needsReview: boolean;
  detail?: Record<string, any>;
  maxScore?: number;
  attemptNumber?: number;
}

export interface ActivityProps {
  activity: ActivityData;
  value: any;
  setValue: (v: any) => void;
  locked: boolean;
  result: GradeResult | null;
  consentAudio?: boolean;
}
