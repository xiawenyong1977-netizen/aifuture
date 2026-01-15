
import React from 'react';

// 定义内联 SVG 图标组件
const GeminiIcon = () => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4 text-amber-400"
  >
    <path 
      d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" 
      fill="currentColor"
    />
    <path 
      d="M19 3L20.07 5.43L22.5 6.5L20.07 7.57L19 10L17.93 7.57L15.5 6.5L17.93 5.43L19 3Z" 
      fill="currentColor" 
      fillOpacity="0.5"
    />
  </svg>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col mystic-gradient overflow-x-hidden">
      <header className="px-4 py-4 sm:p-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 transition-all pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            天
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-[0.2em] text-white">天机面相</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-medium">AI Oracle Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <p className="text-[10px] text-amber-400/80 font-medium">
            {new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
          </p>
        </div>
      </header>
      
      <main className="flex-grow max-w-2xl mx-auto w-full p-4 sm:p-8 pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      
      <footer className="p-8 text-center border-t border-white/5 bg-black/40 backdrop-blur-md pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="flex justify-center items-center gap-2 mb-6 opacity-40 grayscale">
          <GeminiIcon />
          <span className="text-[10px] text-white tracking-widest uppercase">Powered by Gemini 3.0</span>
        </div>
        <p className="text-slate-400 text-xs font-medium">© 2025 天机阁 芯图命理实验室</p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
          <span className="text-[10px] text-slate-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            SSL 端到端加密分析
          </span>
          <span className="text-[10px] text-slate-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            隐私保护：照片不留存
          </span>
        </div>
      </footer>
    </div>
  );
};
