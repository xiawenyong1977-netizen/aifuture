import { registerPlugin } from '@capacitor/core';

export interface MicrophoneMonitorPlugin {
  /**
   * 开始监听麦克风使用状态（完全不占用麦克风）
   */
  startMonitoring(): Promise<{ success: boolean }>;
  
  /**
   * 停止监听
   */
  stopMonitoring(): Promise<{ success: boolean }>;
  
  /**
   * 检查使用统计权限
   */
  checkUsageStatsPermission(): Promise<{ hasPermission: boolean; settingsIntent?: string }>;
  
  /**
   * 添加监听器，当检测到麦克风使用状态变化时触发
   */
  addListener(
    eventName: 'microphoneStateChanged',
    listenerFunc: (state: { isActive: boolean; timestamp: number; appName?: string; appPackageName?: string }) => void
  ): Promise<any>;
  
  /**
   * 移除所有监听器
   */
  removeAllListeners(): Promise<void>;
}

const MicrophoneMonitor = registerPlugin<MicrophoneMonitorPlugin>('MicrophoneMonitor');

export { MicrophoneMonitor };
