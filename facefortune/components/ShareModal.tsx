
import React, { useState, useEffect, useRef } from 'react';
import { FortuneResult } from '../types';

interface ShareModalProps {
  result: FortuneResult;
  image: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ result, image, onClose }) => {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const qrcodePath = '/qrcode.png';
  const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}&color=991b1b&bgcolor=FFFFFF`;

  // 固化的分享文案：移除分数，强调天机与扫码
  const getShareText = () => `天机已泄：批注『${result.eventAnalysis.summary}』。请扫码开启你的 AI 命理观测。`;

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const characters = text.split('');
    let line = '';
    let currentY = y;

    for (let n = 0; n < characters.length; n++) {
      const testLine = line + characters[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = characters[n];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY;
  };

  useEffect(() => {
    const generate = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 750;
      canvas.height = 1334;

      // 1. 背景：朱红渐变（吉祥如意）
      const bgGradient = ctx.createRadialGradient(canvas.width/2, 400, 0, canvas.width/2, 400, 1000);
      bgGradient.addColorStop(0, '#991b1b'); // 朱红中心
      bgGradient.addColorStop(1, '#450a0a'); // 深红边缘
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. 华丽金边
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 18;
      ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);
      
      ctx.lineWidth = 2;
      ctx.strokeRect(70, 70, canvas.width - 140, canvas.height - 140);

      try {
        // 3. 顶部印章
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(canvas.width / 2 - 45, 120, 90, 90, 15);
        ctx.fill();
        ctx.fillStyle = '#7f1d1d';
        ctx.font = 'bold 50px serif';
        ctx.textAlign = 'center';
        ctx.fillText('天', canvas.width / 2, 185);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 65px serif';
        ctx.fillText('天机命理签', canvas.width / 2, 300);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('HEAVENLY SECRET ORACLE', canvas.width / 2, 345);

        // 4. 照片：去除黑白，暖色增强（红润气色）
        const userImg = new Image();
        userImg.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          userImg.onload = resolve;
          userImg.src = image;
        });

        ctx.save();
        ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 580, 200, 0, Math.PI * 2);
        ctx.clip();
        
        // 气色增强：增加饱和度和对比度
        ctx.filter = 'saturate(1.25) contrast(1.1) brightness(1.05)'; 
        ctx.drawImage(userImg, canvas.width / 2 - 200, 580 - 200, 400, 400);
        ctx.restore();
        ctx.filter = 'none';
        ctx.shadowBlur = 0;

        // 5. 分数标签
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.roundRect(canvas.width / 2 + 130, 680, 110, 80, 20);
        ctx.fill();
        ctx.fillStyle = '#7f1d1d';
        ctx.font = 'bold 54px sans-serif';
        ctx.fillText(result.eventAnalysis.score.toString(), canvas.width / 2 + 185, 740);

        // 6. 核心批注
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 15;
        ctx.font = 'italic bold 52px serif';
        const summary = `“${result.eventAnalysis.summary}”`;
        wrapText(ctx, summary, canvas.width / 2, 900, 600, 85);
        ctx.shadowBlur = 0;

        // 7. 二维码
        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          qrImg.onload = resolve;
          qrImg.onerror = () => { qrImg.src = fallbackQr; };
          qrImg.src = qrcodePath;
        });
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(canvas.width - 270, canvas.height - 270, 190, 190, 25);
        ctx.fill();
        ctx.drawImage(qrImg, canvas.width - 260, canvas.height - 260, 170, 170);

        // 8. 品牌底部
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 36px serif';
        ctx.fillText('天机阁 芯图命理实验室', 100, canvas.height - 170);
        
        ctx.font = '26px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('扫码开启您的 AI 命理观测', 100, canvas.height - 110);

        setPosterUrl(canvas.toDataURL('image/jpeg', 0.9));
        setIsGenerating(false);
      } catch (err) {
        console.error("Poster generation failed", err);
        setIsGenerating(false);
      }
    };

    generate();
  }, [result, image]);

  const handleSystemShare = async () => {
    if (!posterUrl || isGenerating) return;

    const shareText = getShareText();

    // 无论是否支持原生分享，都尝试写入剪贴板
    try {
      await navigator.clipboard.writeText(shareText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (e) {
      console.warn("Clipboard copy failed");
    }

    try {
      const response = await fetch(posterUrl);
      const blob = await response.blob();
      const file = new File([blob], 'tianji-oracle.jpg', { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: '天机命理签',
          text: shareText,
          files: [file]
        });
      } else if (navigator.share) {
        await navigator.share({
          title: '天机命理签',
          text: shareText
        });
      }
    } catch (err) {
      // 已经复制到剪贴板，不再重复处理错误
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-fadeIn overflow-y-auto">
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute top-6 right-6 z-[110]">
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all border border-white/10 active:scale-90 shadow-2xl"
        >
          <span>✕</span>
        </button>
      </div>
      
      <div className="flex flex-col items-center w-full max-w-[380px] my-auto gap-4 py-6">
        <div 
          className="w-full relative aspect-[750/1334] bg-red-950 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(153,27,27,0.5)] border border-amber-500/20 group cursor-pointer active:scale-[0.98] transition-all"
          onClick={handleSystemShare}
        >
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">天机凝聚中...</p>
            </div>
          ) : posterUrl ? (
            <div className="relative w-full h-full">
              <img 
                src={posterUrl} 
                className="w-full h-full object-contain pointer-events-auto" 
                alt="天机命理海报"
                style={{ WebkitTouchCallout: 'default' }} 
              />
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <div className="bg-amber-500 text-black px-10 py-4 rounded-full font-black text-sm shadow-2xl tracking-[0.4em] uppercase">
                  点击分享
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 py-4 text-center pointer-events-none">
                <p className="text-[11px] text-black font-black tracking-[0.2em]">
                  {copyFeedback ? '已复制分享文案' : '点击海报 • 分享天机'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-red-400 text-xs">生成失败，请尝试截图保存</div>
          )}
        </div>

        <p className="text-amber-900/40 text-[10px] font-bold tracking-[0.5em] uppercase text-center px-4 leading-relaxed">
          Tianji Oracle • Imperial Red Edition
        </p>
      </div>
    </div>
  );
};
