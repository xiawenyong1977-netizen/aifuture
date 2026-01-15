
import React from 'react';
import { ReadingSession } from '../types';

interface CompletionProps {
  session: ReadingSession;
  onBack: () => void;
}

const Completion: React.FC<CompletionProps> = ({ session, onBack }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-700">
      <div className="w-24 h-24 bg-yellow-400/20 rounded-full flex items-center justify-center mb-8">
         <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-white text-3xl">
           ✓
         </div>
      </div>
      
      <h2 className="calligraphy text-6xl text-[#5d4037] mb-4">圆满</h2>
      <p className="text-[#8b7e74] mb-12 max-w-sm">
        您已顺利完成本次《心经》诵读。愿此功德，普及于一切，我等与众生，皆共成佛道。
      </p>

      <div className="grid grid-cols-2 gap-8 w-full max-w-md mb-12">
        <div className="bg-[#fdfbf7] p-6 rounded-3xl border border-[#e8dfd8]">
           <div className="text-xs text-[#8b7e74] mb-1">完成比例</div>
           <div className="text-3xl font-bold text-[#5d4037]">100%</div>
        </div>
        <div className="bg-[#fdfbf7] p-6 rounded-3xl border border-[#e8dfd8]">
           <div className="text-xs text-[#8b7e74] mb-1">诵读时长</div>
           <div className="text-3xl font-bold text-[#5d4037]">{Math.floor(session.duration / 60)}m {session.duration % 60}s</div>
        </div>
      </div>

      <button 
        onClick={onBack}
        className="bg-[#5d4037] text-white px-12 py-4 rounded-full font-bold hover:scale-105 transition-transform"
      >
        返回主页
      </button>
    </div>
  );
};

export default Completion;
