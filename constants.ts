
import { TeachingMode, TeachingAction } from './types';

export const SUBJECTS = ['國文', '英文', '數學', '物理', '化學', '生物', '地科', '歷史', '地理', '公民', '資訊', '體育', '藝術'];

export const TEACHING_MODES: TeachingMode[] = [
  { id: 'lecture', label: '講述教學', color: 'amber' },
  { id: 'discussion', label: '小組討論', color: 'amber' },
  { id: 'practice', label: '實作/演算', color: 'amber' },
  { id: 'digital', label: '數位運用', color: 'amber' },
];

export const TEACHING_ACTIONS: TeachingAction[] = [
  { id: 'encourage', label: '正向鼓勵', icon: '✨' },
  { id: 'regulate', label: '糾正規範', icon: '🛡️' },
  { id: 'open_q', label: '開放提問', icon: '❓' },
  { id: 'closed_q', label: '封閉提問', icon: '📍' },
  { id: 'patrol', label: '巡視走動', icon: '🚶' },
];

export const ENGAGEMENT_CONFIG = {
  high: { label: '高', color: 'text-green-400', bg: 'bg-green-400' },
  mid: { label: '中', color: 'text-yellow-400', bg: 'bg-yellow-400' },
  low: { label: '低', color: 'text-red-400', bg: 'bg-red-400' },
};
