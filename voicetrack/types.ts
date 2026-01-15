
export interface CallLog {
  id: string;
  employeeName: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
  appName?: string; // 使用麦克风的应用名称
  appPackageName?: string; // 应用包名
}

export enum FilterRange {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface AppState {
  isMonitoring: boolean;
  employeeName: string | null;
  bootTime: number;
  lastCallStartTime: number | null;
  currentAppName?: string; // 当前使用麦克风的应用名称
  currentAppPackageName?: string; // 当前使用麦克风的应用包名
}
