
import { CallLog } from '../types';

const STORAGE_KEY = 'voice_track_logs';

export const saveCallLog = (log: CallLog) => {
  const existing = getCallLogs();
  existing.push(log);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};

export const getCallLogs = (): CallLog[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const clearLogs = () => {
  localStorage.removeItem(STORAGE_KEY);
};
