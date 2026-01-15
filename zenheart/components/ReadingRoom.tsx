
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HEART_SUTRA } from '../constants';
import { ReadingSession } from '../types';

interface ReadingRoomProps {
  onComplete: (session: ReadingSession) => void;
  onExit: () => void;
}

const FUZZY_MAP: Record<string, string[]> = {
  // 优化常见易混淆字符，提高识别准确率
  '观': ['官', '关', '管'], 
  '般': ['波', '班', '搬'], 
  '若': ['若', '惹', '热'], 
  '啰': ['罗', '落', '乐'],
  '蜜': ['密', '秘', '迷'], 
  '行': ['形', '型', '刑', '幸', '寻'], // 添加"行"字的易混淆字符
  '为': ['违', '围', '伟', '伪'], // 添加"为"字的易混淆字符
  '是': ['事', '视', '识', '实'], // 添加"是"字的易混淆字符
  '增': ['曾', '赠', '憎', '锃', '争'], // 添加"增"字的易混淆字符
  '减': ['检', '简', '剪', '碱'], // 添加"减"字的易混淆字符
  '亦': ['一', '衣', '医', '依'], // 添加"亦"字的易混淆字符
  '谛': ['地', '第', '弟', '底', 'D'], 
  '菩': ['铺', '普', '不', '部'],
  '萨': ['飒', '下', '三'], 
  '蕴': ['云', '运', '晕'], 
  '舍': ['社', '射', '涉', '设'], // 添加"舍"字的易混淆字符
  '照': ['找', '赵', '招'],
  '空': ['孔', '恐', '控'],
  '度': ['都', '读', '独'],
  '埵': ['驮', '陀', '驼', '鸵', '土'], // 添加"埵"字的易混淆字符
  '槃': ['盘'], // 添加槃和盘的映射关系
  '揭': ['渴', '竭', '楷', '街', 'J'], // 添加字母J作为易混淆字符
  '波': ['泼', '坡', '玻'],
  '尽': ['进', '近', '劲', '浸'], // 添加"尽"字的易混淆字符
  '僧': ['增', '曾', '赠', '深'], // 添加"深"作为易混淆字
  '诃': ['何', '河', '荷', '呵']
};

const ReadingRoom: React.FC<ReadingRoomProps> = ({ onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedIndex, setMatchedIndex] = useState(-1);
  const [recognizerStatus, setRecognizerStatus] = useState<'idle' | 'listening' | 'error'>('idle');
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [startTime] = useState(Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({
    interimResults: []
  });
  const [isRecognitionStarted, setIsRecognitionStarted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5; // 最大重试次数
  const [shouldRestart, setShouldRestart] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const currentIndexRef = useRef(0);
  const matchedIndexRef = useRef(-1);
  const isTransitioningRef = useRef(false);
  const isExitingRef = useRef(false);
  const imageCacheRef = useRef<Record<number, string>>({});

  const currentSegment = HEART_SUTRA[currentIndex];

  // 添加安全检查，防止访问不存在的段落
  const isValidSegment = currentSegment && 
                      currentSegment.text && 
                      currentSegment.meaning &&
                      currentIndex >= 0 && 
                      currentIndex < HEART_SUTRA.length;

  // 图像自动生成逻辑
  useEffect(() => {
    // 直接使用配置的图片URL
    const imageUrl = HEART_SUTRA[currentIndex]?.imageUrl;
    setDisplayImage(imageUrl || null);
  }, [currentIndex]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    if (currentIndexRef.current < HEART_SUTRA.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setMatchedIndex(-1);
      matchedIndexRef.current = -1;
      
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 1500);
    } else {
      // 在最后一页，确保 currentIndex 不会超出范围
      // 到达最后一页时停止语音识别
      if (recognitionRef.current) recognitionRef.current.stop();
      onComplete({
        id: Date.now().toString(),
        timestamp: Date.now(),
        completedSegments: HEART_SUTRA.length,
        totalSegments: HEART_SUTRA.length,
        duration: Math.floor((Date.now() - startTime) / 1000)
      });
      // 重置过渡状态以允许组件正确卸载
      isTransitioningRef.current = false;
    }
  }, [startTime, onComplete]);

  const processTranscript = useCallback((transcript: string) => {
    if (isTransitioningRef.current || !isValidSegment) return;

    // 获取当前段落（使用ref确保获取最新值）
    const currentSeg = HEART_SUTRA[currentIndexRef.current];
    
    // 预处理：去除多余空白和标点，只保留中文字符
    const cleanSpeech = transcript.replace(/[^\u4e00-\u9fa5]/g, '').trim();
    // 过短的输入不处理，避免误触发
    if (!cleanSpeech || cleanSpeech.length < 2) return;
    
    const cleanTarget = currentSeg.text.replace(/[^\u4e00-\u9fa5]/g, '');
    
    // 优化：从语音识别结果中提取当前段落相关的内容
    // 只取最近识别的部分进行匹配，避免前面段落的内容干扰
    let relevantSpeech = cleanSpeech;
    if (cleanSpeech.length > cleanTarget.length * 3) {
      // 如果识别结果太长，只取最后的部分
      relevantSpeech = cleanSpeech.slice(-cleanTarget.length * 3);
    }
    
    console.log("处理识别结果:", {
      cleanSpeech,
      cleanTarget,
      relevantSpeech,
      matchedIndex: matchedIndexRef.current,
      currentIndex: currentIndexRef.current,
      currentSegmentId: currentSeg.id
    });
    
    let localMatchedIdx = matchedIndexRef.current;
    let speechPointer = 0;

    // 严格流式搜索：在这一段话里尽可能多地匹配后续字符
    while (localMatchedIdx < cleanTarget.length - 1) {
        const nextChar = cleanTarget[localMatchedIdx + 1];
        const variants = [nextChar, ...(FUZZY_MAP[nextChar] || [])];
        
        let foundAt = -1;
        // 修改匹配逻辑：严格按照顺序查找，而不是查找第一个出现的位置
        for (let i = speechPointer; i < relevantSpeech.length; i++) {
          if (variants.includes(relevantSpeech[i])) {
            foundAt = i;
            speechPointer = i + 1;
            break;
          }
        }

        if (foundAt !== -1) {
            localMatchedIdx++;
            console.log(`匹配到字符: "${nextChar}" at position ${localMatchedIdx}`);
            // speechPointer已经在上面更新了
        } else {
            // 容错：尝试跳过一个字寻找下一个
            const skipChar = cleanTarget[localMatchedIdx + 2];
            if (skipChar) {
                const svs = [skipChar, ...(FUZZY_MAP[skipChar] || [])];
                let sfAt = -1;
                // 同样的顺序查找逻辑
                for (let i = speechPointer; i < relevantSpeech.length; i++) {
                  if (svs.includes(relevantSpeech[i])) {
                    sfAt = i;
                    speechPointer = i + 1;
                    break;
                  }
                }
                if (sfAt !== -1) {
                    localMatchedIdx += 2;
                    console.log(`跳过一个字符，匹配到: "${skipChar}" at position ${localMatchedIdx}`);
                    // speechPointer已经在上面更新了
                    continue;
                }
            }
            break;
        }
    }

    if (localMatchedIdx > matchedIndexRef.current) {
      console.log(`匹配索引从 ${matchedIndexRef.current} 更新到 ${localMatchedIdx}`);
      setMatchedIndex(localMatchedIdx);
      matchedIndexRef.current = localMatchedIdx;
      
      // 当匹配度达到80%时，预加载下一页的图片
      const matchRatio = (localMatchedIdx + 1) / cleanTarget.length;
      console.log(`当前匹配比例: ${(matchRatio * 100).toFixed(2)}%`);
      
      if (matchRatio > 0.8 && currentIndexRef.current < HEART_SUTRA.length - 1) {
        // 预加载下一页的图片
        const nextImageUrl = HEART_SUTRA[currentIndexRef.current + 1]?.imageUrl;
        if (nextImageUrl) {
          const img = new Image();
          img.src = nextImageUrl;
        }
      }
      
      // 只有当完全匹配或接近结尾时才翻页
      if (matchRatio > 0.95 || localMatchedIdx >= cleanTarget.length - 1) {
        console.log("匹配完成，准备翻页");
        handleNext();
      }
    }
  }, [handleNext, isValidSegment]);

  // 添加节流函数来限制处理频率
  const throttle = (func: Function, delay: number) => {
    let timeoutId: any = null;
    let lastExecTime = 0;
    return function (...args: any[]) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  };

  // 创建节流版本的processTranscript
  const throttledProcessTranscript = useCallback(
    throttle((transcript: string) => {
      processTranscript(transcript);
    }, 300), // 300ms节流间隔
    [processTranscript]
  );

  // 添加用户交互检测（仅在组件挂载时执行一次）
  useEffect(() => {
    // 由于React.StrictMode在开发模式下会双重调用useEffect，我们添加一个检查来避免重复安装监听器
    if ((window as any).__userInteractionListenerAdded) {
      console.log("用户交互监听器已存在，跳过安装");
      return;
    }
    
    console.log("添加用户交互监听器");
    const handleUserInteraction = () => {
      console.log("检测到用户交互");
      document.documentElement.setAttribute('data-user-interaction', 'true');
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
      (window as any).__userInteractionListenerAdded = false; // 清理标记
    };
    
    console.log("添加用户交互监听器");
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('click', handleUserInteraction);
    
    (window as any).__userInteractionListenerAdded = true; // 设置标记
    
    // 注意：这里不返回清理函数，因为用户交互监听器应该在整个应用生命周期中保持活跃
    // 只有在特定条件下才移除监听器
  }, []); // 空依赖数组确保只执行一次
  
  useEffect(() => {
    // 同样处理语音识别初始化，避免在StrictMode下重复初始化
    if ((window as any).__speechRecognitionInitialized) {
      console.log("语音识别已初始化，跳过重复初始化");
      return;
    }
    
    console.log("初始化语音识别");
    setDebugInfo(prev => ({...prev, init: "初始化语音识别"}));
    
    // 只有在第一次加载时初始化语音识别，而不是每次翻页都初始化
    if (recognitionRef.current) {
      console.log("语音识别已存在，无需重新初始化");
      return;
    }
    
    // 检查是否在安全上下文中运行（HTTPS或localhost）
    console.log("安全上下文检查:", {
      isSecureContext: window.isSecureContext,
      protocol: location.protocol,
      hostname: location.hostname
    });
    
    // 检查浏览器是否支持语音识别
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const errorMsg = "您的浏览器不支持语音识别功能，请使用Chrome、Edge或其他支持Web Speech API的浏览器。";
      console.error(errorMsg);
      setErrorMessage(errorMsg);
      setRecognizerStatus('error');
      return;
    }
    
    // 检查麦克风权限
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        console.log("音频输入设备:", audioInputs);
        setDebugInfo(prev => ({...prev, audioDevices: audioInputs}));
      })
      .catch(err => {
        console.error("获取音频设备列表失败:", err);
      });

    // 请求麦克风权限并检查状态
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log("麦克风权限已获得");
        setDebugInfo(prev => ({...prev, micPermission: "granted"}));
        
        // 停止所有轨道以释放麦克风
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(err => {
        console.error("麦克风权限被拒绝:", err);
        setDebugInfo(prev => ({...prev, micPermission: "denied"}));
        
        let errorMsg = "";
        if (err.name === 'NotAllowedError') {
          errorMsg = "麦克风权限被拒绝，请在浏览器设置中允许访问麦克风，然后刷新页面重试。";
        } else {
          errorMsg = `麦克风访问失败: ${err.message || err}。请检查设备连接并刷新页面重试。`;
        }
        setErrorMessage(errorMsg);
        setRecognizerStatus('error');
      });
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // 启用中间结果
    recognition.lang = 'zh-CN'; // 设置语言为中文
    
    recognition.onstart = () => {
      console.log("语音识别已启动");
      setErrorMessage(null);
      setDebugInfo(prev => ({...prev, status: "语音识别已启动"}));
      setRecognizerStatus('listening');
      setIsRecognitionStarted(true); // 设置状态为已启动
    };

    recognition.onresult = (event: any) => {
      console.log("收到语音识别结果:", event);
      setDebugInfo(prev => ({...prev, lastResult: event}));
      
      if (event.results.length > 0) {
        const result = event.results[event.resultIndex];
        if (result.isFinal) {
          const transcript = result[0].transcript;
          console.log("最终识别结果:", transcript);
          processTranscript(transcript);
        } else {
          const interimTranscript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          console.log("中间识别结果:", interimTranscript);
          // 可以在这里处理中间结果
        }
      } else {
        console.log("收到空结果");
        setDebugInfo(prev => ({...prev, emptyResult: "收到空结果"}));
      }
    };

    recognition.onerror = (event: any) => {
      console.error("语音识别错误:", event.error, event);
      setDebugInfo(prev => ({...prev, error: event.error}));
      
      // 设置错误状态
      setRecognizerStatus('error');
      
      // 特殊处理aborted错误
      if (event.error === 'aborted') {
        console.log("语音识别被中断，这可能是正常的页面切换或结束");
        // 如果是用户主动退出，不需要重启
        if (isExitingRef.current) {
          console.log("用户已退出，无需重启语音识别");
          return;
        }
      } else {
        // 其他错误显示错误信息
        let errorMsg = "";
        switch (event.error) {
          case 'no-speech':
            errorMsg = "未检测到语音输入，请稍后重试。";
            break;
          case 'audio-capture':
            errorMsg = "无法访问麦克风，请检查设备连接和权限设置。";
            break;
          case 'not-allowed':
            errorMsg = "麦克风权限被拒绝，请在浏览器设置中允许访问麦克风，然后刷新页面重试。";
            break;
          case 'service-not-allowed':
            errorMsg = "语音识别服务不可用，请检查网络连接或更换浏览器重试。";
            break;
          case 'bad-grammar':
            errorMsg = "语音识别语法错误，请联系技术支持。";
            break;
          case 'language-not-supported':
            errorMsg = "不支持当前语言，请联系技术支持。";
            break;
          default:
            errorMsg = `语音识别错误: ${event.error}${event.message ? ': ' + event.message : ''}。请尝试刷新页面重试。`;
        }
        setErrorMessage(errorMsg);
      }
      
      // 如果不是用户主动退出，尝试重启
      if (!isExitingRef.current) {
        // 增加重试次数检查
        setRetryCount(prev => {
          const newCount = prev + 1;
          if (newCount <= maxRetries) {
            console.log(`语音识别错误，将在2秒后第${newCount}次重试...`);
            setTimeout(() => {
              if (!isExitingRef.current && recognitionRef.current) {
                try {
                  // 检查当前状态，确保不会重复启动
                  if (recognitionRef.current.state === 'inactive' || recognitionRef.current.state === 'undefined') {
                    recognitionRef.current.start();
                    console.log("语音识别重启成功");
                    setRecognizerStatus('listening');
                  } else {
                    console.log("语音识别已在运行中，无需重启");
                  }
                } catch (restartError) {
                  console.error("重启语音识别失败:", restartError);
                  setErrorMessage(`重启语音识别失败: ${restartError.message || restartError}`);
                }
              }
            }, 2000); // 2秒延时重试
          } else {
            console.log("语音识别重试次数已达上限");
            setErrorMessage("语音识别重试次数已达上限，请刷新页面重试或检查麦克风设备。");
          }
          return newCount;
        });
      }
    };

    recognition.onend = () => {
      console.log("语音识别已结束");
      setDebugInfo(prev => ({...prev, status: "语音识别已结束"}));
      // 设置状态为idle，表示识别已正常停止
      setRecognizerStatus('idle');
      setIsRecognitionStarted(false); // 设置状态为未启动
      
      // 语音识别正常结束后，应该自动重启以继续工作
      console.log("语音识别正常结束，准备重启");
      
      // 检查是否需要重启（如果不是用户主动退出）
      if (!isExitingRef.current) {
        // 检查重试次数
        if (retryCount < maxRetries) {
          // 延时自动重启
          console.log("语音识别将在1秒后重启...");
          setTimeout(() => {
            if (!isExitingRef.current && recognitionRef.current) {
              try {
                // 检查语音识别当前状态
                if (recognitionRef.current.state === 'inactive' || recognitionRef.current.state === 'undefined') {
                  // 启动新的识别会话
                  recognitionRef.current.start();
                  setIsRecognitionStarted(true);
                  console.log("语音识别重启成功");
                  setRecognizerStatus('listening');
                } else {
                  console.log("语音识别已在运行中，无需重启");
                }
              } catch (restartError) {
                console.error("重启语音识别失败:", restartError);
                setErrorMessage(`重启语音识别失败: ${restartError.message || restartError}`);
              }
            }
          }, 1000); // 1秒延时
        } else {
          console.log("语音识别重试次数已达上限，不再自动重启");
          setErrorMessage("语音识别重试次数已达上限，请刷新页面重试。");
        }
      } else {
        console.log("用户已退出，无需重启语音识别");
      }
    };
    
    recognitionRef.current = recognition;
    (window as any).__speechRecognitionInitialized = true; // 设置标记

    // 启动语音识别
    try { 
      recognition.start(); 
      console.log("语音识别启动成功");
      setDebugInfo(prev => ({...prev, startSuccess: "语音识别启动成功"}));
    } catch (error:any) { 
      console.error("启动语音识别失败:", error);
      setDebugInfo(prev => ({...prev, startError: error.message || error}));
      
      let errorMsg = "";
      if (error.name === 'NotAllowedError') {
        errorMsg = "麦克风权限被拒绝，请在浏览器设置中允许访问麦克风，然后刷新页面重试。";
      } else {
        errorMsg = `启动语音识别失败: ${error.message || error}。请尝试刷新页面重试。`;
      }
      setErrorMessage(errorMsg);
      setRecognizerStatus('error'); 
    }
    
    // 不在组件卸载时清理语音识别，只在特定情况下清理
    // 1. 到达最后一页时（在handleNext函数中处理）
    // 2. 用户主动退出时（在onExit处理函数中处理）
    return () => { 
      console.log("组件卸载，检查是否需要停止语音识别");
      setDebugInfo(prev => ({...prev, cleanup: "组件卸载，检查是否需要停止语音识别"}));
      
      // 检查是否是用户主动退出
      if (isExitingRef.current) {
        console.log("用户主动退出，停止语音识别");
        // 用户主动退出，停止语音识别
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
            console.log("语音识别已停止");
          } catch (e) {
            console.error("停止语音识别时出错:", e);
          }
        }
      } else {
        console.log("非主动退出，保持语音识别运行");
        // 非主动退出，保持语音识别运行
      }
      
      // 清理标记
      (window as any).__speechRecognitionInitialized = false;
      (window as any).__userInteractionListenerAdded = false;
      isExitingRef.current = false; // 重置退出标记
      setRetryCount(0); // 重置重试计数
    }; 
  }, []); // 空依赖数组，确保只在组件首次加载时执行一次

  // 添加一个手动启动语音识别的函数
  const startRecognitionManually = () => {
    console.log("手动启动语音识别");
    setDebugInfo(prev => ({...prev, manualStart: "手动启动语音识别"}));
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecognitionStarted(true);
        setDebugInfo(prev => ({...prev, manualStart: "语音识别已启动"}));
        setRecognizerStatus('listening');
      } catch (e) {
        console.error("启动语音识别失败:", e);
        setDebugInfo(prev => ({...prev, manualStartError: e.message || e}));
      }
    } else {
      console.log("语音识别器未初始化");
      setDebugInfo(prev => ({...prev, manualStart: "语音识别器未初始化"}));
    }
  };

  // 添加一个手动测试函数
  const testRecognition = () => {
    console.log("手动测试语音识别");
    setDebugInfo(prev => ({...prev, manualTest: "手动测试语音识别"}));
    
    if (recognitionRef.current) {
      try {
        console.log("停止当前识别器");
        recognitionRef.current.stop();
        setDebugInfo(prev => ({...prev, manualStop: "停止当前识别器"}));
      } catch (e) {
        console.error("停止识别器失败:", e);
        setDebugInfo(prev => ({...prev, manualStopError: e.message || e}));
      }
      
      setTimeout(() => {
        try {
          console.log("重新启动识别器");
          recognitionRef.current.start();
          setDebugInfo(prev => ({...prev, manualRestart: "重新启动识别器"}));
        } catch (e) {
          console.error("重启识别器失败:", e);
          setDebugInfo(prev => ({...prev, manualRestartError: e.message || e}));
        }
      }, 500);
    } else {
      console.log("识别器引用为空");
      setDebugInfo(prev => ({...prev, manualTest: "识别器引用为空"}));
    }
  };
  
  // 添加一个强制重新初始化语音识别的函数
  const reinitializeRecognition = () => {
    console.log("强制重新初始化语音识别");
    setDebugInfo(prev => ({...prev, reinit: "强制重新初始化语音识别"}));
    
    // 停止现有的识别器
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("已停止现有识别器");
        setDebugInfo(prev => ({...prev, reinit: "已停止现有识别器"}));
      } catch (e) {
        console.error("停止识别器失败:", e);
      }
    }
    
    // 触发重新初始化
    window.location.reload();
  };

  // 添加一个直接测试麦克风的函数
  const testMicrophone = async () => {
    try {
      console.log("请求麦克风权限...");
      setDebugInfo(prev => ({...prev, micTest: "请求麦克风权限..."}));
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("麦克风访问成功");
      setDebugInfo(prev => ({...prev, micTest: "麦克风访问成功"}));
      
      // 创建音频上下文来检测音频输入
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      console.log("开始监测音频输入...");
      setDebugInfo(prev => ({...prev, micTest: "开始监测音频输入..."}));
      
      // 监测音频输入
      const detectSound = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        if (average > 10) { // 阈值可调整
          console.log("检测到音频活动:", average);
          setDebugInfo(prev => ({...prev, audioLevel: average}));
        }
        
        // 继续监测
        if (stream.active) {
          requestAnimationFrame(detectSound);
        }
      };
      
      detectSound();
      
      // 5秒后停止测试
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        console.log("麦克风测试结束");
        setDebugInfo(prev => ({...prev, micTest: "麦克风测试结束"}));
      }, 5000);
      
    } catch (err) {
      console.error("麦克风测试失败:", err);
      setDebugInfo(prev => ({...prev, micTest: `麦克风测试失败: ${err.name} - ${err.message}`}));
      alert(`麦克风测试失败: ${err.name} - ${err.message}`);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]"
         onClick={() => {
         }}
    >
      {/* 动态背景图层 */}
      <div className="absolute inset-0 transition-all duration-1000">
        {displayImage && (
          <img 
            key={displayImage}
            src={displayImage} 
            alt="Zen Background" 
            className={`w-full h-full object-cover transition-opacity duration-1000 ${isGeneratingImg ? 'opacity-20 blur-sm' : 'opacity-50'}`} 
          />
        )}
        {/* 加深遮罩层确保文字清晰 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col p-8 justify-between">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => { 
              // 用户主动退出，停止语音识别
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.stop();
                  console.log("用户主动退出，语音识别已停止");
                } catch (e) {
                  console.error("停止语音识别时出错:", e);
                }
              }
              isExitingRef.current = true; 
              onExit(); 
            }}
            className="text-white/60 hover:text-white flex items-center gap-2 text-[11px] tracking-[0.3em] backdrop-blur-3xl bg-white/10 border border-white/20 px-6 py-2 rounded-full transition-all font-bold h-8"
          >
            EXIT / 退出
          </button>
          <div 
            className="bg-white/10 backdrop-blur-xl px-5 py-1.5 rounded-full text-white/60 text-[10px] tracking-[0.4em] border border-white/10 font-bold uppercase h-8 flex items-center cursor-pointer"
            onClick={() => {
              // 创建一个textarea元素用于复制
              const textarea = document.createElement('textarea');
              textarea.value = JSON.stringify(debugInfo, null, 2);
              document.body.appendChild(textarea);
              textarea.select();
              document.execCommand('copy');
              document.body.removeChild(textarea);
              
              // 显示复制成功的提示
              alert("调试信息已复制到剪贴板:\n\n" + JSON.stringify(debugInfo, null, 2));
            }}
          >
            STEP {currentIndex + 1} / {HEART_SUTRA.length}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center">
          {isValidSegment ? (
            <>
              <div className="mb-8 sm:mb-14 max-w-6xl px-4 sm:px-6">
                {/* 文字清晰度终极优化：增加黑色文字描边效果 (text-shadow) */}
                <div className="text-white text-2xl xs:text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-[2.5] tracking-[0.25em]">
                  {currentSegment.text.split('').map((char, i) => {
                    const isSymbol = !/[\u4e00-\u9fa5]/.test(char);
                    const cleanIdx = currentSegment.text.slice(0, i).replace(/[^\u4e00-\u9fa5]/g, '').length;
                    const isMatched = !isSymbol && cleanIdx <= matchedIndex;
                    return (
                      <span 
                        key={i} 
                        style={{ textShadow: isMatched ? '0 0 25px rgba(255,215,0,0.9), 0 0 5px black' : '2px 2px 4px rgba(0,0,0,0.9)' }}
                        className={`inline-block transition-all duration-500 ${
                          isMatched 
                            ? 'text-[#FFD700] scale-110' 
                            : 'text-white/45'
                        } ${isSymbol ? 'mx-1 opacity-50' : ''}`}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-black/70 backdrop-blur-2xl border border-white/10 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] max-w-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-zen-in">
                <p className="text-white/80 text-base sm:text-lg md:text-xl leading-relaxed font-light tracking-[0.2em]">{currentSegment.meaning}</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-white text-xl">加载中...</div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={handleNext}
            className="text-white/40 hover:text-white/70 text-[11px] tracking-[0.4em] transition-all underline underline-offset-8 decoration-white/20 uppercase"
            disabled={!isValidSegment}
          >
            SKIP / 点击跳过此句
          </button>
          
          <div className="flex flex-col items-center gap-2">
            <div 
              className="flex items-center gap-5 px-10 py-5 bg-white/10 backdrop-blur-3xl rounded-full border border-white/10 shadow-lg"
            >
              <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_15px] transition-colors duration-1000 ${recognizerStatus === 'listening' ? 'bg-emerald-400 shadow-emerald-400/60 animate-pulse' : 'bg-rose-500 shadow-rose-500/60'}`}></div>
              <span className="text-white/60 text-[11px] tracking-[0.6em] font-bold uppercase">
                {recognizerStatus === 'listening' ? (matchedIndex === -1 ? 'WAITING / 待诵' : 'READING / 诵读中') : (recognizerStatus === 'idle' ? 'READY' : 'RECONNECTING')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 进度条增强 */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-white/5">
        <div 
          className="h-full bg-gradient-to-r from-yellow-900 via-yellow-500 to-yellow-200 shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all duration-1500" 
          style={{ width: `${((currentIndex + 1) / HEART_SUTRA.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ReadingRoom;
