
import React, { useState } from 'react';

interface Props {
  onComplete: (name: string) => void;
}

const SetupScreen: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onComplete(name);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-2 bg-indigo-600 w-full"></div>
        
        <div className="p-8">
          <div className="mb-8 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-indigo-50 text-indigo-600">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              员工身份注册
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              请输入员工姓名以建立本地审计档案
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800 mb-1">审计申明：</p>
              <p>1. 仅监测麦克风使用状态，识别通话行为。</p>
              <p>2. <b>绝不</b>占用麦克风，不影响其他应用使用。</p>
              <p>3. <b>绝不</b>录制任何语音内容，不上传音频文件。</p>
              <p>4. 所有通话记录仅保存在手机本地数据库中。</p>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="请输入员工姓名"
              className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all text-lg font-medium bg-slate-50"
            />
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              开始监测
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
