
export type TeachingModeId = 'lecture' | 'discussion' | 'practice' | 'digital';
export type TeachingActionId = 'encourage' | 'regulate' | 'open_q' | 'closed_q' | 'patrol';
export type EngagementLevel = 'high' | 'mid' | 'low';

export interface LogEntry {
  id: string;
  timestamp: string;
  label: string;
  type: 'mode' | 'action' | 'note' | 'engagement';
  value?: any;
}

export interface TeachingMode {
  id: TeachingModeId;
  label: string;
  color: string;
}

export interface TeachingAction {
  id: TeachingActionId;
  label: string;
  icon: string;
}
