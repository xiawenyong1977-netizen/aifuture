
import React, { useState, useEffect, useCallback } from 'react';
import { View, ReadingSession } from './types';
import Home from './components/Home';
import ReadingRoom from './components/ReadingRoom';
import History from './components/History';
import Completion from './components/Completion';
import MusicPlayer from './components/MusicPlayer';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [lastSession, setLastSession] = useState<ReadingSession | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('zenheart_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 验证数据结构是否正确
        if (Array.isArray(parsed)) {
          setSessions(parsed);
        } else {
          console.error("历史记录数据结构不正确");
          setSessions([]);
        }
      } catch (e) {
        console.error("Failed to parse history", e);
        // 如果解析失败，清除损坏的数据
        localStorage.removeItem('zenheart_history');
      }
    }
  }, []);

  const saveSession = useCallback((session: ReadingSession) => {
    try {
      const newSessions = [session, ...sessions];
      setSessions(newSessions);
      // 添加错误处理和确认
      localStorage.setItem('zenheart_history', JSON.stringify(newSessions));
      // 验证数据是否正确保存
      const saved = localStorage.getItem('zenheart_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (JSON.stringify(parsed) !== JSON.stringify(newSessions)) {
          console.error("数据保存验证失败");
        }
      } else {
        console.error("数据未能保存到localStorage");
      }
      setLastSession(session);
      setCurrentView('completed');
    } catch (error) {
      console.error("保存会话时出错:", error);
    }
  }, [sessions]);

  const handleStart = () => setCurrentView('reading');
  const handleGoHome = () => setCurrentView('home');
  const handleViewHistory = () => setCurrentView('history');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#fdfbf7] relative">
      <div className="w-full max-w-4xl flex-grow bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#e8dfd8] flex flex-col relative">
        {currentView === 'home' && (
          <Home onStart={handleStart} onViewHistory={handleViewHistory} />
        )}
        
        {currentView === 'reading' && (
          <ReadingRoom onComplete={saveSession} onExit={handleGoHome} />
        )}

        {currentView === 'history' && (
          <History sessions={sessions} onBack={handleGoHome} />
        )}

        {currentView === 'completed' && lastSession && (
          <Completion session={lastSession} onBack={handleGoHome} />
        )}
      </div>
      
      {/* 悬浮背景音乐控制器 */}
      <MusicPlayer />
      
      <footer className="mt-4 text-[#8b7e74] text-xs opacity-60">
        © 2024 ZenHeart · 般若波罗蜜多心经
      </footer>
    </div>
  );
};

export default App;
