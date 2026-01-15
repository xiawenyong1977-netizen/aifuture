import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ZEN_MUSIC } from '../constants';

const MusicPlayer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(ZEN_MUSIC[0]); // 默认第一个背景音
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [error, setError] = useState(false); // 添加错误状态

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.25; // 较低音量以免干扰语音识别
    }
  }, []);

  // 添加错误处理
  const handleError = () => {
    console.warn(`Failed to load audio: ${currentTrack.name}`);
    setError(true);
    
    // 3秒后自动隐藏错误提示
    setTimeout(() => {
      setError(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack.url) return;
    
    if (isPlaying) {
      // 添加淡出效果
      let volume = 0.25;
      const fadeInterval = setInterval(() => {
        volume -= 0.05;
        if (audioRef.current) {
          audioRef.current.volume = Math.max(volume, 0);
        }
        if (volume <= 0) {
          clearInterval(fadeInterval);
          if (audioRef.current) {
            audioRef.current.pause();
          }
        }
      }, 100);
    } else {
      // 添加淡入效果
      if (audioRef.current) {
        audioRef.current.volume = 0;
        audioRef.current.play().catch(handleError);
        
        let volume = 0;
        const fadeInterval = setInterval(() => {
          volume += 0.05;
          if (audioRef.current) {
            audioRef.current.volume = Math.min(volume, 0.25);
          }
          if (volume >= 0.25) {
            clearInterval(fadeInterval);
          }
        }, 100);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSelect = (track: typeof ZEN_MUSIC[0]) => {
    setCurrentTrack(track);
    setError(false); // 重置错误状态
    setIsOpen(false);
    
    if (!track.url) {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
    } else {
      setIsPlaying(true);
      // 给一点时间让 src 改变后自动播放
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          // 添加淡入效果
          audioRef.current.volume = 0;
          audioRef.current.play().catch(handleError).then(() => {
            // 淡入效果
            if (audioRef.current) {
              let volume = 0;
              const fadeInterval = setInterval(() => {
                volume += 0.05;
                if (audioRef.current) {
                  audioRef.current.volume = Math.min(volume, 0.25);
                }
                if (volume >= 0.25) {
                  clearInterval(fadeInterval);
                }
              }, 100);
            }
          });
        }
      }, 50);
    }
  };

  // 创建Portal内容
  const playerContent = (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3" style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem' }}>
      {/* 音乐选择列表 */}
      {isOpen && (
        <div className="mb-2 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl animate-zen-in py-2 min-w-[140px]">
          {ZEN_MUSIC.map((track) => (
            <button
              key={track.id}
              onClick={() => handleSelect(track)}
              className={`w-full text-left px-5 py-3 text-xs tracking-[0.2em] transition-colors ${
                currentTrack.id === track.id ? 'text-yellow-400 bg-white/10 font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {track.name}
            </button>
          ))}
        </div>
      )}

      {/* 控制按钮 */}
      <div className="flex items-center gap-3">
        {isPlaying && (
           <span className="text-[10px] text-white/40 tracking-[0.2em] animate-pulse uppercase font-bold hidden md:block">
             {currentTrack.name}
           </span>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 rounded-full backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all shadow-xl ${
            isPlaying ? 'bg-white/10 rotate-music text-yellow-400' : 'bg-white/5 text-white/40'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </button>
      </div>

      <audio 
        ref={audioRef} 
        src={currentTrack.url || undefined} 
        loop 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={handleError}
      />

      {/* 错误提示 */}
      {error && (
        <div className="fixed bottom-24 right-6 bg-red-500/80 text-white text-xs px-3 py-2 rounded-lg animate-fade-in">
          音频加载失败，请检查网络或稍后重试
        </div>
      )}

      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotate-music {
          animation: rotate 6s linear infinite;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );

  // 使用 Portal 将音乐播放器渲染到 body 下，避免容器限制
  return typeof document !== 'undefined' ? createPortal(playerContent, document.body) : null;
};

export default MusicPlayer;