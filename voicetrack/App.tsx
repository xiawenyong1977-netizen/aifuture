
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, CallLog } from './types';
import { getCallLogs, saveCallLog } from './services/db';
import Dashboard from './components/Dashboard';
import SetupScreen from './components/SetupScreen';
import StatusBanner from './components/StatusBanner';
import { MicrophoneMonitor } from './src/plugins/MicrophoneMonitor';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    isMonitoring: false,
    employeeName: localStorage.getItem('vt_employee_name'),
    bootTime: Date.now(),
    lastCallStartTime: null,
  });

  const [logs, setLogs] = useState<CallLog[]>([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);
  
  const listenerRef = useRef<any>(null);

  useEffect(() => {
    const loadedLogs = getCallLogs();
    setLogs(loadedLogs);
    console.log('初始化：从 localStorage 加载了', loadedLogs.length, '条记录');
  }, []);

  const handleStopCall = useCallback((endTime: number) => {
    setAppState(prev => {
      if (prev.lastCallStartTime && prev.employeeName) {
        const duration = Math.floor((endTime - prev.lastCallStartTime) / 1000);
        if (duration >= 3) { // 过滤极短时间的噪声
          const newLog: CallLog = {
            id: crypto.randomUUID(),
            employeeName: prev.employeeName,
            startTime: prev.lastCallStartTime,
            endTime: endTime,
            duration: duration,
          };
                      // 保存到 localStorage
                      saveCallLog(newLog);
                      console.log('通话记录已保存到 localStorage:', newLog);
                      
                      // 更新日志列表状态（使用函数式更新确保获取最新状态）
                      setLogs(prevLogs => {
                        const updated = [newLog, ...prevLogs];
                        console.log('更新日志列表，当前记录数:', updated.length);
                        return updated;
                      });
                      
                      // 验证保存是否成功
                      setTimeout(() => {
                        const savedLogs = getCallLogs();
                        console.log('验证：从 localStorage 读取的记录数:', savedLogs.length);
                        if (savedLogs.length > 0) {
                          console.log('最新记录:', savedLogs[0]);
                        }
                      }, 100);
        } else {
          console.log('通话时长太短，已过滤:', duration, '秒');
        }
      } else {
        console.log('没有有效的通话开始时间，无法保存记录');
      }
      return { ...prev, lastCallStartTime: null };
    });
    setIsMicActive(false);
  }, []);

  const handleStartCall = useCallback((startTime: number) => {
    setAppState(prev => {
      console.log('开始通话记录，开始时间:', new Date(startTime).toLocaleString());
      return { ...prev, lastCallStartTime: startTime };
    });
    setIsMicActive(true);
  }, []);

  const toggleMonitoring = async (active: boolean) => {
    setPermError(null);
    if (active) {
      try {
        // 检查平台
        const { Capacitor } = await import('@capacitor/core');
        const platform = Capacitor.getPlatform();
        console.log('当前平台:', platform);
        
        // 检查使用统计权限
        if (platform === 'android') {
          const permResult = await MicrophoneMonitor.checkUsageStatsPermission();
          console.log('使用统计权限检查结果:', permResult);
          if (!permResult.hasPermission) {
            setPermError('需要授权"使用情况访问权限"才能识别使用麦克风的应用。请前往：设置 -> 应用 -> 特殊应用访问 -> 使用情况访问权限');
            // 可以在这里打开设置页面
            // const { App } = await import('@capacitor/app');
            // await App.openUrl({ url: 'android.settings.USAGE_ACCESS_SETTINGS' });
            return;
          }
        }
        
        // 使用原生插件，完全不占用麦克风
        console.log('开始调用 MicrophoneMonitor.startMonitoring()');
        const result = await MicrophoneMonitor.startMonitoring();
        console.log('MicrophoneMonitor.startMonitoring() 结果:', result);
        
        if (result.success) {
          // 添加监听器
          console.log('添加监听器...');
          listenerRef.current = await MicrophoneMonitor.addListener(
            'microphoneStateChanged',
            (state: { isActive: boolean; timestamp: number; appName?: string; appPackageName?: string }) => {
              console.log('收到麦克风状态变化:', state);
              console.log('  - isActive:', state.isActive);
              console.log('  - appName:', state.appName);
              console.log('  - appPackageName:', state.appPackageName);
              
              if (state.isActive) {
                // 检测到其他应用使用麦克风
                setAppState(prev => {
                  if (!prev.lastCallStartTime) {
                    // 只有在没有正在进行的通话时才开始新记录
                    console.log('检测到麦克风被占用，开始记录', state.appName ? `- 应用: ${state.appName}` : '');
                    console.log('保存应用信息到 appState:', {
                      appName: state.appName,
                      appPackageName: state.appPackageName,
                      hasAppName: !!state.appName,
                      hasAppPackageName: !!state.appPackageName
                    });
                    setIsMicActive(true);
                    const newState = { 
                      ...prev, 
                      lastCallStartTime: state.timestamp,
                      currentAppName: state.appName,
                      currentAppPackageName: state.appPackageName
                    };
                    console.log('更新后的 appState:', {
                      currentAppName: newState.currentAppName,
                      currentAppPackageName: newState.currentAppPackageName,
                      lastCallStartTime: newState.lastCallStartTime
                    });
                    return newState;
                  } else {
                    console.log('已有正在进行的通话记录，忽略重复的开始事件');
                    // 即使已有记录，也更新应用信息（可能应用切换了）
                    if (state.appName || state.appPackageName) {
                      return {
                        ...prev,
                        currentAppName: state.appName,
                        currentAppPackageName: state.appPackageName
                      };
                    }
                    return prev;
                  }
                });
              } else {
                // 检测到麦克风释放
                setAppState(prev => {
                  console.log('=== 释放事件调试信息 ===');
                  console.log('prev.lastCallStartTime:', prev.lastCallStartTime);
                  console.log('prev.employeeName:', prev.employeeName);
                  console.log('prev.currentAppName:', prev.currentAppName);
                  console.log('prev.currentAppPackageName:', prev.currentAppPackageName);
                  console.log('state.timestamp:', state.timestamp);
                  
                  if (prev.lastCallStartTime && prev.employeeName) {
                    // 只有在有正在进行的通话时才结束记录
                    console.log('检测到麦克风释放，结束记录');
                    try {
                      const duration = Math.floor((state.timestamp - prev.lastCallStartTime) / 1000);
                      console.log('计算的通话时长:', duration, '秒');
                      
                      if (duration >= 3) { // 过滤极短时间的噪声
                        console.log('时长 >= 3秒，开始保存记录');
                        const newLog: CallLog = {
                          id: crypto.randomUUID(),
                          employeeName: prev.employeeName,
                          startTime: prev.lastCallStartTime,
                          endTime: state.timestamp,
                          duration: duration,
                          appName: prev.currentAppName,
                          appPackageName: prev.currentAppPackageName,
                        };
                        
                        console.log('准备保存记录（包含应用信息）:', JSON.stringify(newLog, null, 2));
                        console.log('  - appName:', newLog.appName);
                        console.log('  - appPackageName:', newLog.appPackageName);
                        
                        // 保存到 localStorage
                        try {
                          saveCallLog(newLog);
                          console.log('✓ 通话记录已保存到 localStorage:', newLog);
                        } catch (saveError) {
                          console.error('✗ 保存到 localStorage 失败:', saveError);
                        }
                      
                        // 在状态更新后更新日志列表（使用 setTimeout 确保状态更新完成）
                        setTimeout(() => {
                          try {
                            setLogs(prevLogs => {
                              const updated = [newLog, ...prevLogs];
                              console.log('更新日志列表，当前记录数:', updated.length);
                              return updated;
                            });
                            
                            // 验证保存是否成功
                            const savedLogs = getCallLogs();
                            console.log('验证：从 localStorage 读取的记录数:', savedLogs.length);
                            if (savedLogs.length > 0) {
                              const latestLog = savedLogs[0];
                              console.log('最新记录:', latestLog);
                              console.log('最新记录的应用信息:', {
                                appName: latestLog.appName,
                                appPackageName: latestLog.appPackageName,
                                hasAppName: !!latestLog.appName,
                                hasAppPackageName: !!latestLog.appPackageName
                              });
                              
                              // 如果应用信息丢失，尝试从状态中恢复
                              if (!latestLog.appName && !latestLog.appPackageName) {
                                console.warn('⚠️ 警告：保存的记录中缺少应用信息！');
                                console.warn('保存时的状态:', {
                                  currentAppName: prev.currentAppName,
                                  currentAppPackageName: prev.currentAppPackageName
                                });
                              }
                            }
                          } catch (updateError) {
                            console.error('✗ 更新日志列表失败:', updateError);
                          }
                        }, 0);
                      } else {
                        console.log('✗ 通话时长太短，已过滤:', duration, '秒 (需要 >= 3秒)');
                      }
                    } catch (error) {
                      console.error('✗ 处理释放事件时出错:', error);
                    }
                    
                    setIsMicActive(false);
                    return { 
                      ...prev, 
                      lastCallStartTime: null,
                      currentAppName: undefined,
                      currentAppPackageName: undefined
                    };
                  } else {
                    console.log('✗ 没有正在进行的通话记录，忽略释放事件');
                    console.log('  - lastCallStartTime 存在:', !!prev.lastCallStartTime);
                    console.log('  - employeeName 存在:', !!prev.employeeName);
                    setIsMicActive(false);
                    return prev;
                  }
                });
              }
            }
          );
          console.log('监听器添加成功');
          
          setAppState(prev => ({ ...prev, isMonitoring: true }));
        }
      } catch (err: any) {
        console.error('Monitor Init Error:', err);
        console.error('错误详情:', err.stack || err);
        const msg = `监测初始化失败: ${err.message}`;
        setPermError(msg);
        setAppState(prev => ({ ...prev, isMonitoring: false }));
      }
    } else {
      // 停止监测
      if (listenerRef.current) {
        await MicrophoneMonitor.removeAllListeners();
        listenerRef.current = null;
      }
      await MicrophoneMonitor.stopMonitoring();
      
      // 如果正在记录通话，结束它
      if (isMicActive) {
        handleStopCall(Date.now());
      }
      
      setAppState(prev => ({ ...prev, isMonitoring: false }));
      setIsMicActive(false);
    }
  };

  useEffect(() => {
    if (appState.employeeName && !appState.isMonitoring && !permError) {
      toggleMonitoring(true);
    }
  }, [appState.employeeName]);

  const onSetupComplete = (name: string) => {
    localStorage.setItem('vt_employee_name', name);
    setAppState(prev => ({ ...prev, employeeName: name }));
  };

  if (!appState.employeeName) {
    return <SetupScreen onComplete={onSetupComplete} />;
  }

  return (
    <div className="min-h-screen pb-36 bg-slate-50 flex flex-col">
      <StatusBanner 
        isMonitoring={appState.isMonitoring} 
        isCallActive={isMicActive}
        bootTime={appState.bootTime}
        employeeName={appState.employeeName}
      />
      
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        {permError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">权限诊断错误</span>
            </div>
            {permError}
            <button 
              onClick={() => toggleMonitoring(true)}
              className="mt-3 block w-full bg-red-600 text-white py-2 rounded-xl font-bold"
            >
              重新尝试授权
            </button>
          </div>
        )}

        <Dashboard logs={logs} bootTime={appState.bootTime} />
      </main>

      {/* 饱和机制可视化展示层 */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-200 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${
                appState.isMonitoring ? 'bg-indigo-600' : 'bg-slate-200'
              }`}>
                {/* 动态波形 - 根据麦克风使用状态显示 */}
                <div className="flex items-center justify-center space-x-0.5 h-6">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div 
                      key={i} 
                      className={`w-1 rounded-full transition-all duration-150 ${
                        appState.isMonitoring ? (isMicActive ? 'bg-white' : 'bg-indigo-300') : 'bg-slate-400'
                      }`}
                      style={{ 
                        height: appState.isMonitoring && isMicActive
                          ? `${Math.max(30, Math.min(100, 50 + (Math.random() * 30)))}%` 
                          : '15%' 
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">
                  Foreground Audit Active
                </span>
                <span className="text-[9px] font-bold text-slate-400 mt-1 flex items-center">
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    appState.isMonitoring ? (isMicActive ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-pulse') : 'bg-slate-300'
                  }`}></span>
                  {isMicActive 
                    ? `检测到麦克风使用中${appState.currentAppName ? ` - ${appState.currentAppName}` : appState.currentAppPackageName && appState.currentAppPackageName !== 'unknown' ? ` - ${appState.currentAppPackageName}` : ''}` 
                    : appState.isMonitoring 
                      ? '监测中（麦克风可用）' 
                      : '已停止'}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
               <button
                onClick={() => toggleMonitoring(!appState.isMonitoring)}
                className={`p-3 rounded-2xl transition-all active:scale-90 ${
                  appState.isMonitoring 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'bg-slate-100 text-slate-400'
                }`}
                title={appState.isMonitoring ? "停止审计" : "启动审计"}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 系统心跳进度条 */}
          {appState.isMonitoring && (
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-indigo-600 transition-all duration-1000 ease-linear"
                style={{ width: `${(Date.now() % 60000) / 600}%` }}
              />
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default App;
