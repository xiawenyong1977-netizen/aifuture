
import { Product, CompanyInfo } from './types';

export const COMPANY: CompanyInfo = {
  name: "深圳市智语未来软件有限公司",
  slogan: "智承传统，语链未来",
  mission: "用最新的AI技术链接传统应用和未来的发展趋势。"
};

export const PRODUCTS: Product[] = [
  {
    id: "xintu",
    name: "芯图相册",
    tag: "智能工具",
    brief: "智能分类，AI修图，便捷管理。",
    description: "多维极速分类引擎，实现照片的深度语义理解与自动化管理。",
    link: "https://www.xintuxiangce.top",
    aiFeatures: ["照片语义分类", "照片语义修图"],
    models: ["通义千问3-VL-PLUS", "通义千问-image-edit", "DEEPSEEK"],
    platforms: ["Android", "Windows"],
    techFeatures: "基于大小模型混合推理的多维极速分类引擎",
    useCases: ["照片清理", "照片管理", "照片优化"],
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=1000"
  },
  {
    id: "zenheart",
    name: "心经助读",
    tag: "文化修习",
    brief: "东方文化修炼的助手工具。",
    description: "基于当前语句进行AI观想，浏览器端语音识别，沉浸式助读并自动生成修习记录。",
    link: "./zenheart/",
    aiFeatures: ["AI观想生成", "实时语音识别进度跟踪"],
    models: ["通义万相-2.6-文生图"],
    platforms: ["PC WEB"],
    useCases: ["文化修身", "自动化修习笔记", "传统经典研习"],
    image: "https://images.unsplash.com/photo-1512756290469-ec264b7fbf87?auto=format&fit=crop&q=80&w=1000"
  },
  {
    id: "tianji",
    name: "天机面相",
    tag: "传统文化",
    brief: "基于面相与文字问卜进行吉凶预测。",
    description: "结合AI面相分析，提供个性化化解建议，传统智慧与现代算力的结合。",
    link: "http://www.xintuzhaopian.com",
    aiFeatures: ["五官语义分析", "吉凶推导系统"],
    models: ["Gemini 3"],
    platforms: ["PC WEB", "Mobile WEB"],
    useCases: ["运势咨询", "面相分析", "心理辅导"],
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1000"
  },
  {
    id: "threebody",
    name: "三体游戏",
    tag: "沉浸体验",
    brief: "仿真《三体世界》游戏，感受宇宙浩瀚。",
    description: "模拟刘慈欣笔下的三体文明，反思人类文明的幸运与未来挑战。",
    link: "./threebody-3d.html",
    aiFeatures: ["文明演化模拟", "宇宙环境仿真"],
    models: ["自定义物理引擎"],
    platforms: ["PC WEB", "Mobile WEB"],
    useCases: ["科幻体验", "科学教育", "哲学思考"],
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1000"
  },
  {
    id: "voicetrack",
    name: "VoiceTrack",
    tag: "企业服务",
    brief: "企业内部营销管理辅助工具。",
    description: "生成微信语音通话记录，支持企业内部审计与通话要求核查。",
    link: "https://m.xintuxiangce.top/voicetrack/app-release.apk",
    aiFeatures: ["音频自动转录", "营销语境分析"],
    models: ["ASR 自动识别引擎"],
    platforms: ["Android"],
    useCases: ["企业审计", "营销记录管理", "通话质量检测"],
    image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=1000"
  }
];
