
import React from 'react';
import { ReadingSession } from '../types';

interface HistoryProps {
  sessions: ReadingSession[];
  onBack: () => void;
}

const History: React.FC<HistoryProps> = ({ sessions, onBack }) => {
  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col p-10 h-full bg-[#fdfbf7]">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 hover:bg-[#5d4037]/5 rounded-full transition-all group">
            <svg className="w-6 h-6 text-[#5d4037] group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-4xl font-bold text-[#5d4037] tracking-tight">诵经功德簿</h2>
        </div>
        <div className="text-[#8b7e74] text-xs tracking-widest font-light">共计 {sessions.length} 次修行</div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-4">
        {sessions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#8b7e74] opacity-40 animate-zen-in">
            <svg className="w-20 h-20 mb-6 font-thin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-lg tracking-[0.2em] font-light">暂无记录，愿您早日开启修行</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="group bg-white border border-[#e8dfd8] p-8 rounded-3xl flex justify-between items-center hover:shadow-xl hover:border-[#5d4037]/20 transition-all animate-zen-in">
              <div className="flex flex-col gap-2">
                <div className="text-[10px] text-[#8b7e74] uppercase tracking-[0.3em] font-medium">{formatDate(session.timestamp)}</div>
                <div className="text-xl font-bold text-[#5d4037] group-hover:text-[#8b5a2b] transition-colors">《心经》全文诵读</div>
                <div className="flex items-center gap-4 mt-1">
                   <span className="text-xs text-[#5d4037]/50 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {Math.floor(session.duration / 60)}分{session.duration % 60}秒
                   </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#5d4037]">{session.completedSegments}</span>
                  <span className="text-xs text-[#8b7e74]">/ {session.totalSegments}</span>
                </div>
                <div className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest font-bold mt-2">圆满完成</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
