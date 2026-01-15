
import React, { useState, useEffect } from 'react';
import { COMPANY } from '../constants';

interface NavbarProps {
  onContactClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onContactClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-slate-950/80 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">智</span>
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight leading-none">{COMPANY.name}</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Zhiyu Future Tech</p>
          </div>
        </div>
        
        <div className="hidden md:flex space-x-8 text-sm font-medium">
          <a href="#hero" className="hover:text-blue-400 transition-colors">首页</a>
          <a href="#products" className="hover:text-blue-400 transition-colors">自研软件</a>
          <a href="#about" className="hover:text-blue-400 transition-colors">关于我们</a>
          <button 
            onClick={onContactClick}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full text-xs transition-all"
          >
            联系我们
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
