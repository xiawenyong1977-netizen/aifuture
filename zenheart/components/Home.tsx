
import React from 'react';

interface HomeProps {
  onStart: () => void;
  onViewHistory: () => void;
}

const Home: React.FC<HomeProps> = ({ onStart, onViewHistory }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-8 bg-gradient-to-b from-[#fdfbf7] to-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-32 h-32 sm:w-64 sm:h-64 rounded-full bg-yellow-100/30 blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 sm:w-96 sm:h-96 rounded-full bg-orange-50/50 blur-3xl"></div>

      <div className="mb-6 sm:mb-8 z-10 animate-zen-in">
        <h1 className="calligraphy text-6xl sm:text-9xl text-[#5d4037] mb-2 drop-shadow-sm">心经</h1>
        <p className="text-[#8b7e74] tracking-[0.3em] sm:tracking-[0.6em] text-xs sm:text-sm ml-2 sm:ml-4 font-light opacity-80 uppercase">Prajñāpāramitā Hṛdaya</p>
      </div>
      
      <div className="max-w-md mb-8 sm:mb-12 text-[#5d4037]/80 leading-loose z-10 animate-zen-in" style={{ animationDelay: '0.2s' }}>
        <p className="text-base sm:text-lg font-light">静坐 · 调息 · 诵经</p>
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm opacity-70">让古老的智慧，在您的诵读声中<br/>幻化为禅意画境。</p>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-xs z-10 animate-zen-in" style={{ animationDelay: '0.4s' }}>
        <button 
          onClick={onStart}
          className="bg-[#5d4037] text-[#fdfbf7] py-3 sm:py-4 rounded-full text-base sm:text-lg font-bold hover:bg-[#4a332c] transition-all transform hover:scale-105 active:scale-95 shadow-xl"
        >
          开始诵经
        </button>
        <button 
          onClick={onViewHistory}
          className="bg-white border-2 border-[#5d4037]/20 text-[#5d4037] py-3 sm:py-4 rounded-full text-base sm:text-lg hover:bg-[#5d4037]/5 transition-all"
        >
          诵经功德簿
        </button>
      </div>

      <div className="mt-8 sm:mt-12 p-3 sm:p-4 bg-[#5d4037]/5 rounded-2xl border border-[#5d4037]/10 max-w-sm z-10 opacity-60">
        <p className="text-[8px] sm:text-[10px] text-[#8b7e74] leading-relaxed">
          温馨提示：诵读过程中将请求麦克风权限。<br/>
          推荐使用 Chrome 浏览器以获得最佳识别效果。<br/>
          华为手机用户请确保已授予麦克风权限并关闭省电模式。
        </p>
      </div>
    </div>
  );
};

export default Home;
