
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ShareModal } from './components/ShareModal';
import { AppState, FortuneStatus } from './types';
import { analyzeFortune } from './services/geminiService';

const App = () => {
  const [state, setState] = useState<AppState>({
    image: null,
    event: '',
    isAnalyzing: false,
    result: null,
    error: null
  });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('观天察地...');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const triggerVibrate = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  useEffect(() => {
    if (state.isAnalyzing) {
      const messages = ['正在观测天相...', '解析面部三停...', '洞察因果律动...', '整理避凶方位...', '天机凝聚中...', '推演未来走势...'];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setThinkingMessage(messages[i]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [state.isAnalyzing]);

  // 通用的图片压缩函数
  const compressImage = (source: HTMLVideoElement | HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    const maxDim = 800; // 限制最大边长为800px，足够AI分析且体积小
    let width, height;

    if (source instanceof HTMLVideoElement) {
      width = source.videoWidth;
      height = source.videoHeight;
    } else {
      width = source.width;
      height = source.height;
    }

    if (width > height) {
      if (width > maxDim) {
        height = (height * maxDim) / width;
        width = maxDim;
      }
    } else {
      if (height > maxDim) {
        width = (width * maxDim) / height;
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(source, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.7); // 质量降至0.7，大幅减小体积
  };

  const startCamera = async () => {
    triggerVibrate();
    setIsCameraActive(true);
    setState(prev => ({ ...prev, error: null }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1440 } } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setIsCameraActive(false);
      setState(prev => ({ ...prev, error: '相机启动失败，请确认权限。' }));
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      triggerVibrate(30);
      const compressedData = compressImage(videoRef.current);
      setState(prev => ({ ...prev, image: compressedData }));
      stopCamera();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const compressedData = compressImage(img);
          setState(prev => ({ ...prev, image: compressedData, error: null }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!state.image || !state.event.trim()) {
      setState(prev => ({ ...prev, error: '请拍摄照片并填写咨询事项。' }));
      return;
    }

    triggerVibrate([20, 50, 20]);
    setState(prev => ({ ...prev, isAnalyzing: true, error: null, result: null }));
    
    try {
      const timeStr = new Date().toLocaleString('zh-CN', { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', weekday: 'long' 
      });
      
      const res = await analyzeFortune(state.image, state.event, timeStr);
      
      if (res.isCompliant === false) {
        throw new Error(res.complianceReason || '检测不到清晰面部气色，请重新拍摄。');
      }

      setState(prev => ({ ...prev, result: res, isAnalyzing: false }));
      triggerVibrate(50);
    } catch (err: any) {
      setState(prev => ({ ...prev, isAnalyzing: false, error: err.message }));
    }
  };

  const getStatusColor = (status: FortuneStatus | string) => {
    switch (status) {
      case FortuneStatus.EXCELLENT: return 'text-amber-400 border-amber-400/30 bg-amber-400/5';
      case FortuneStatus.GOOD: return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5';
      case FortuneStatus.BAD: return 'text-red-400 border-red-400/30 bg-red-400/5';
      case FortuneStatus.DANGEROUS: return 'text-rose-500 border-rose-500/30 bg-rose-500/5';
      default: return 'text-slate-400 border-slate-400/30 bg-slate-400/5';
    }
  };

  return (
    <Layout>
      {isSharing && state.result && state.image && (
        <ShareModal result={state.result} image={state.image} onClose={() => setIsSharing(false)} />
      )}

      {!state.result && !state.isAnalyzing ? (
        <div className="space-y-8 animate-fadeIn">
          <div className="text-center space-y-4 px-4">
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">观面识势 <span className="text-amber-400">避凶趋吉</span></h2>
            <p className="text-slate-400 max-w-sm mx-auto leading-relaxed text-sm sm:text-base opacity-70">AI 视觉识别结合东方命理，为您指点迷津。</p>
          </div>

          <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-6 sm:p-10 space-y-8 backdrop-blur-2xl shadow-2xl mx-auto max-w-md relative overflow-hidden">
            <div className="flex flex-col items-center">
              <div className={`w-full aspect-[3/4] rounded-3xl border-2 border-dashed transition-all overflow-hidden relative shadow-inner ${state.image || isCameraActive ? 'border-amber-500/30' : 'border-white/5'}`}>
                {isCameraActive ? (
                  <div className="relative w-full h-full bg-black">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
                    <div className="absolute inset-0 border-[20px] border-black/30 pointer-events-none">
                      <div className="w-full h-full border border-white/20 rounded-[45%] scale-x-[0.8] scale-y-[0.85]" />
                    </div>
                    <div className="absolute bottom-6 left-0 w-full flex justify-center gap-4 px-6">
                      <button onClick={stopCamera} className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-white border border-white/10">✕</button>
                      <button onClick={capturePhoto} className="flex-grow py-4 bg-amber-400 text-black font-bold rounded-2xl shadow-xl text-sm uppercase tracking-widest">拍摄照片</button>
                    </div>
                  </div>
                ) : state.image ? (
                  <div className="relative w-full h-full animate-fadeIn">
                    <img src={state.image} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => setState(prev => ({...prev, image: null}))} className="absolute top-4 right-4 w-9 h-9 bg-black/70 rounded-full flex items-center justify-center text-white border border-white/20">✕</button>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <button onClick={startCamera} className="group flex flex-col items-center active:scale-95 transition-all">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-400/10 rounded-full flex items-center justify-center mb-4 border border-amber-400/20 group-hover:bg-amber-400/20 transition-colors">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                      </div>
                      <span className="text-white font-bold tracking-widest text-sm">拍摄正面照分析</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="text-slate-500 text-xs hover:text-white flex items-center gap-2">从相册选取</button>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-bold text-amber-400/60 uppercase tracking-widest">咨询事项</label>
              <textarea
                value={state.event}
                onChange={(e) => setState(prev => ({ ...prev, event: e.target.value }))}
                placeholder="例如：下午要参加一场面试..."
                className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500/40 min-h-[90px] text-sm resize-none"
              />
            </div>

            {state.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-400 flex items-start gap-3 animate-shake">
                <span>⚠️</span><p>{state.error}</p>
              </div>
            )}

            <button onClick={handleAnalyze} disabled={state.isAnalyzing || isCameraActive} className="w-full py-5 gold-button text-black font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl disabled:opacity-30">洞察天机</button>
          </div>
        </div>
      ) : state.isAnalyzing ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 animate-fadeIn">
          <div className="relative">
            <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-amber-500/5 flex items-center justify-center shadow-[0_0_100px_rgba(245,158,11,0.05)]">
              <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full border border-amber-500/20 border-dashed animate-[spin_15s_linear_infinite]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-[2rem] overflow-hidden border border-amber-500/30 relative bg-slate-900 shadow-2xl">
                {state.image && <img src={state.image} alt="Analysing" className="w-full h-full object-cover grayscale opacity-30 scale-110" />}
                <div className="scan-line" />
              </div>
            </div>
          </div>
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-amber-400 tracking-[0.3em]">{thinkingMessage}</h3>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">AI Oracle is calculating...</p>
          </div>
        </div>
      ) : state.result ? (
        <div className="space-y-8 animate-fadeIn pb-20 max-w-2xl mx-auto">
          <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8 backdrop-blur-2xl shadow-2xl">
            <div className="text-center md:text-left shrink-0">
              <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">事项吉凶评分</h3>
              <div className="flex items-center gap-3">
                <span className="text-6xl sm:text-8xl font-black text-white">{state.result.eventAnalysis.score}</span>
                <div className="flex flex-col">
                  <span className="text-slate-600 text-xl font-medium leading-none mb-2">/ 100</span>
                  <div className={`px-3 py-1 rounded-lg border text-[11px] font-black uppercase ${getStatusColor(state.result.eventAnalysis.status)}`}>{state.result.eventAnalysis.status}</div>
                </div>
              </div>
            </div>
            <p className="flex-grow border-t md:border-t-0 md:border-l border-white/10 pt-8 md:pt-2 md:pl-10 text-xl sm:text-3xl font-bold text-white italic">“{state.result.eventAnalysis.summary}”</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-[0.2em]">大师面相批注</h4>
              <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                {[{l:'天庭',t:state.result.faceAnalysis.forehead},{l:'灵窗',t:state.result.faceAnalysis.eyes},{l:'财帛',t:state.result.faceAnalysis.nose},{l:'出纳',t:state.result.faceAnalysis.mouth}].map(i=>(
                  <div key={i.l} className="flex gap-4"><span className="text-amber-500/40 font-bold shrink-0">【{i.l}】</span><p>{i.t}</p></div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em]">避凶趋吉指引</h4>
              <div className="space-y-6">
                <ul className="space-y-4">
                  {state.result.eventAnalysis.advice.map((i,idx)=>(
                    <li key={idx} className="flex gap-4 text-sm sm:text-base text-slate-300"><span className="text-emerald-500/50 mt-1.5 shrink-0 text-[10px]">◆</span><span>{i}</span></li>
                  ))}
                </ul>
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 italic text-[13px] text-emerald-100/80 leading-relaxed text-center">“{state.result.eventAnalysis.remedy}”</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 py-8">
            <button onClick={() => setState(prev => ({ ...prev, result: null, image: null, event: '' }))} className="px-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-300 text-sm font-bold flex items-center justify-center gap-2">↺ 另卜一事</button>
            <button onClick={() => setIsSharing(true)} className="px-12 py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-sm font-bold flex items-center justify-center gap-2">分享命理签</button>
          </div>
        </div>
      ) : null}
      <style>{`.mirror { transform: scaleX(-1); }`}</style>
    </Layout>
  );
};

export default App;
