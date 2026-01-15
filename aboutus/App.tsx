
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import AIConsultant from './components/AIConsultant';
import { COMPANY, PRODUCTS } from './constants';

const App: React.FC = () => {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30">
      <Navbar onContactClick={() => setShowContactModal(true)} />
      
      {/* Hero Section */}
      <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-slate-950 z-10" />
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[128px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[128px] animate-pulse [animation-delay:2s]" />
          </div>
          {/* Grid Background Effect */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{COMPANY.name}</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-tight tracking-tight">
            <span className="gradient-text">智承传统</span> <br />
            <span className="text-slate-100 italic font-light opacity-80">语链未来</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            {COMPANY.mission} 我们致力于将前沿人工智能与深厚传统文化相结合，构建连接过去与未来的数字桥梁。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#products" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
              探索产品
            </a>
            <a href="#about" className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-2xl font-bold transition-all active:scale-95">
              了解我们
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
      </section>

      {/* Featured Products */}
      <section id="products" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">智研系列产品</h2>
              <div className="h-1.5 w-20 bg-blue-600 rounded-full mb-6" />
              <p className="text-slate-400">汇聚大小模型推理、图像生成、语音识别与面相分析等多元AI技术栈。</p>
            </div>
            <div className="hidden md:flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <div className="w-3 h-3 rounded-full bg-slate-800" />
              <div className="w-3 h-3 rounded-full bg-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PRODUCTS.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* About Section / Values */}
      <section id="about" className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-20" />
            <img 
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000" 
              className="relative rounded-3xl shadow-2xl border border-white/5"
              alt="智语未来 - AI人工智能技术与传统文化融合的科技愿景"
              loading="lazy"
            />
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-8 italic">智承传统 · 语链未来</h2>
            <div className="space-y-6 text-slate-400">
              <p className="leading-relaxed">
                深圳市智语未来软件有限公司成立于科技之都深圳，我们深信“传统”是文明的根基，而“AI”是进化的语言。
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <h4 className="text-white font-bold mb-2">文化传承</h4>
                  <p className="text-xs">将古老的面相、心经等文化瑰宝通过AI技术注入现代生命力。</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <h4 className="text-white font-bold mb-2">极智效率</h4>
                  <p className="text-xs">芯图相册与VoiceTrack为个人与企业提供生产级的高效AI工具。</p>
                </div>
              </div>
              <p className="leading-relaxed pt-4">
                我们不仅是在研发软件，更是在构建一套属于这个时代的“数字非遗”与“未来工具”。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold">智</div>
            <span className="font-bold tracking-widest">{COMPANY.name}</span>
          </div>
          <p className="text-slate-500 text-sm mb-6 max-w-lg mx-auto italic">
            "{COMPANY.slogan}"
          </p>
          <div className="flex justify-center space-x-8 text-slate-500 text-xs font-medium mb-8">
            <a href="#" className="hover:text-blue-400 transition-colors">隐私政策</a>
            <a href="#" className="hover:text-blue-400 transition-colors">服务协议</a>
            <a href="#" className="hover:text-blue-400 transition-colors">资质荣誉</a>
            <a href="#" className="hover:text-blue-400 transition-colors">关注我们</a>
          </div>
          <p className="text-slate-600 text-[10px] uppercase tracking-widest">
            © 2024 Shenzhen Zhiyu Future Software Co., Ltd. All Rights Reserved.
          </p>
          <p className="text-slate-600 text-[10px] mt-2">
            社会信用代码：91440300MAEPBDM19T
          </p>
          <p className="text-slate-600 text-[10px] mt-1">
            ICP备案号：
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
              粤ICP备2025481778号-2
            </a>
          </p>
        </div>
      </footer>

      {/* Floating AI Assistant */}
      <AIConsultant />

      {/* Contact Info Modal */}
      {showContactModal && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowContactModal(false)}
        >
          <div 
            className="glass-card max-w-md w-full rounded-3xl p-8 shadow-2xl border border-blue-500/30 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-2xl font-bold mb-6 gradient-text">联系我们</h3>
            
            <div className="space-y-4 text-slate-300">
              <div>
                <p className="text-xs text-slate-400 mb-1">公司地址</p>
                <p className="text-sm">广东省深圳市福田区福田街道福山社区彩田路2048号福建大厦B座2305M4</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-400 mb-1">联系电话</p>
                <a href="tel:18688445211" className="text-sm hover:text-blue-400 transition-colors">
                  18688445211
                </a>
              </div>
              
              <div>
                <p className="text-xs text-slate-400 mb-1">联系邮箱</p>
                <a href="mailto:xiawenyong@xintuxiangce.top" className="text-sm hover:text-blue-400 transition-colors">
                  xiawenyong@xintuxiangce.top
                </a>
              </div>
              
              <div>
                <p className="text-xs text-slate-400 mb-1">社会信用代码</p>
                <p className="text-sm">91440300MAEPBDM19T</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
