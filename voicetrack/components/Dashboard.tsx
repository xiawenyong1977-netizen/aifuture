
import React, { useState, useMemo } from 'react';
import { CallLog, FilterRange } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  logs: CallLog[];
  bootTime: number;
}

const Dashboard: React.FC<Props> = ({ logs, bootTime }) => {
  const [filter, setFilter] = useState<FilterRange>(FilterRange.DAILY);

  // 调试：记录 logs 变化
  React.useEffect(() => {
    console.log('Dashboard: logs 更新，当前记录数:', logs.length);
    if (logs.length > 0) {
      console.log('Dashboard: 最新记录:', logs[0]);
      console.log('Dashboard: 最新记录的应用信息:', {
        appName: logs[0].appName,
        appPackageName: logs[0].appPackageName
      });
    }
  }, [logs]);

  const filteredData = useMemo(() => {
    const now = new Date();
    return logs.filter(log => {
      const logDate = new Date(log.startTime);
      if (filter === FilterRange.DAILY) {
        return logDate.toDateString() === now.toDateString();
      } else if (filter === FilterRange.WEEKLY) {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return logDate >= weekAgo;
      } else {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return logDate >= monthAgo;
      }
    });
  }, [logs, filter]);

  const stats = useMemo(() => {
    const totalCalls = filteredData.length;
    const totalDuration = filteredData.reduce((acc, log) => acc + log.duration, 0);
    const avgDuration = totalCalls ? Math.round(totalDuration / totalCalls) : 0;
    
    const groups: Record<string, number> = {};
    filteredData.forEach(log => {
      const date = new Date(log.startTime);
      const key = filter === FilterRange.DAILY 
        ? `${date.getHours()}:00` 
        : `${date.getMonth() + 1}/${date.getDate()}`;
      groups[key] = (groups[key] || 0) + 1;
    });

    // 对图表数据进行排序，确保时间顺序正确（从远到近，从左到右）
    const chartData = Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        if (filter === FilterRange.DAILY) {
          // 今日视图：按小时排序（0-23）
          const hourA = parseInt(a.name.split(':')[0]);
          const hourB = parseInt(b.name.split(':')[0]);
          return hourA - hourB;
        } else {
          // 本周/本月视图：按日期排序
          const [monthA, dayA] = a.name.split('/').map(Number);
          const [monthB, dayB] = b.name.split('/').map(Number);
          if (monthA !== monthB) {
            return monthA - monthB;
          }
          return dayA - dayB;
        }
      });
    
    return { totalCalls, totalDuration, avgDuration, chartData };
  }, [filteredData, filter]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分 ${s}秒`;
  };

  return (
    <div className="space-y-6">
      {/* 状态概览与启动时间 */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">系统运行摘要</p>
            <h2 className="text-2xl font-black">审计服务正常运行中</h2>
          </div>
          <div className="text-right">
            <p className="text-indigo-100 text-[10px] font-bold uppercase">App 启动时间</p>
            <p className="font-mono text-sm">{new Date(bootTime).toLocaleString('zh-CN', { hour12: false })}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
          <div>
            <p className="text-indigo-200 text-[10px] font-bold uppercase">今日通话</p>
            <p className="text-xl font-bold">{stats.totalCalls} 次</p>
          </div>
          <div>
            <p className="text-indigo-200 text-[10px] font-bold uppercase">累计时长</p>
            <p className="text-xl font-bold text-truncate">{Math.floor(stats.totalDuration / 60)} 分</p>
          </div>
          <div>
            <p className="text-indigo-200 text-[10px] font-bold uppercase">数据合规</p>
            <p className="text-xl font-bold">100%</p>
          </div>
        </div>
      </div>

      {/* 趋势图表 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">通话频次趋势</h3>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setFilter(FilterRange[key])}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  filter === FilterRange[key] 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-400'
                }`}
              >
                {key === 'DAILY' ? '今日' : key === 'WEEKLY' ? '本周' : '本月'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">审计明细</h3>
          <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">已加密存入 SQLite</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-50">
              {filteredData.length > 0 ? (
                filteredData.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-900">{new Date(log.startTime).toLocaleTimeString()}</p>
                      <p className="text-[10px] text-slate-400">{new Date(log.startTime).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">
                        {(() => {
                          // 优先显示应用名称，如果应用名称和包名相同或者是包名格式，则只显示一次
                          if (log.appName && log.appName !== 'unknown' && log.appName !== log.appPackageName) {
                            return log.appName;
                          } else if (log.appPackageName && log.appPackageName !== 'unknown') {
                            return log.appPackageName;
                          } else {
                            return '未知应用';
                          }
                        })()}
                      </p>
                      {log.appPackageName && 
                       log.appPackageName !== 'unknown' && 
                       log.appName && 
                       log.appName !== log.appPackageName && (
                        <p className="text-[10px] text-slate-400 font-mono">{log.appPackageName}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-xs font-mono font-bold text-indigo-600">{formatDuration(log.duration)}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Duration</p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-xs">暂无符合条件的审计记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
