
import React, { useState, useEffect } from 'react';

interface Props {
  isMonitoring: boolean;
  isCallActive: boolean;
  bootTime: number;
  employeeName: string;
}

const StatusBanner: React.FC<Props> = ({ isMonitoring, isCallActive, bootTime, employeeName }) => {
  const [uptimeStr, setUptimeStr] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Date.now() - bootTime;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setUptimeStr(`${hours}h ${mins}m ${secs}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [bootTime]);

  return (
    <div className={`w-full py-4 px-6 transition-all duration-500 shadow-lg sticky top-0 z-40 ${
      isCallActive ? 'bg-amber-500' : isMonitoring ? 'bg-indigo-600' : 'bg-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-6">
          <div className="text-white">
            <p className="text-[10px] opacity-70 uppercase font-bold tracking-widest">审计账号</p>
            <p className="font-bold text-lg">{employeeName}</p>
          </div>
          <div className="text-white border-l border-white/20 pl-6">
            <p className="text-[10px] opacity-70 uppercase font-bold tracking-widest">系统连续运行时间</p>
            <p className="font-mono text-sm font-semibold">{uptimeStr}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {isCallActive && (
            <div className="bg-white/20 text-white px-4 py-1.5 rounded-full text-xs font-bold animate-pulse flex items-center">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></span>
              通话审计中...
            </div>
          )}
          <div className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter ${
            isMonitoring ? 'bg-green-400 text-green-950' : 'bg-red-400 text-red-950'
          }`}>
            {isMonitoring ? '审计在线' : '审计离线'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBanner;
