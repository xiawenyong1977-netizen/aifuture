
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
你是一位精通东方面相学和周易玄学的资深命理大师。
根据用户上传的自拍照和咨询事项，进行深度分析。

核心原则：
1. 观察细节：重点分析眼中的神采（眼神）、印堂的明暗、山根的起伏以及嘴角的气色。
2. 结合时空：必须结合用户提供的【当前时间】，分析此时辰对该面相的影响（如：子午冲、财星入库等玄学逻辑）。
3. 语气玄妙：语言要专业、庄重且充满洞察力，避免过于现代化或随意的词汇。

必须返回严格的 JSON 格式。
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isCompliant: { type: Type.BOOLEAN, description: "图片是否包含清晰的人脸且符合规范" },
    complianceReason: { type: Type.STRING, description: "如果不符合规范的原因" },
    faceAnalysis: {
      type: Type.OBJECT,
      properties: {
        forehead: { type: Type.STRING, description: "天庭/额头与早年运势" },
        eyes: { type: Type.STRING, description: "灵窗/眼神与当下心境" },
        nose: { type: Type.STRING, description: "财帛/鼻子与守财能力" },
        mouth: { type: Type.STRING, description: "出纳/嘴巴与言语福报" },
        overall: { type: Type.STRING, description: "整体气色与此时能量场" }
      },
      required: ["forehead", "eyes", "nose", "mouth", "overall"]
    },
    eventAnalysis: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: "吉凶等级（如：大吉、吉、平、凶、大凶）" },
        score: { type: Type.NUMBER, description: "1-100 的事项契合度" },
        summary: { type: Type.STRING, description: "一句话核心批注" },
        advice: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "给用户的 3-4 条行为指引"
        },
        remedy: { type: Type.STRING, description: "化解或加持的密语" }
      },
      required: ["status", "score", "summary", "advice", "remedy"]
    },
    timeReflection: { type: Type.STRING, description: "此刻时辰与命相的玄学交互分析" }
  },
  required: ["isCompliant", "faceAnalysis", "eventAnalysis", "timeReflection"]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image, event, time } = req.body;
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: '后端 API_KEY 未配置' });
  }

  try {
    const base64Data = image.split(',')[1] || image;
    const mimeType = image.split(',')[0].split(':')[1]?.split(';')[0] || 'image/jpeg';

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: `【当前时间】：${time}\n【求测事项】：${event}` },
          { inlineData: { mimeType, data: base64Data } }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 1,
        // 启用思考模式，分配 1024 令牌的思考预算，使推理更缜密
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('天机暂时无法读取，请稍后重试。');
    }

    res.status(200).json(JSON.parse(resultText));
    
  } catch (error: any) {
    console.error('Analysis Error:', error);
    
    if (error.message?.includes('429') || error.status === 429) {
      return res.status(429).json({ 
        error: '天机不可泄露过频。',
        detail: '此时星象繁忙，请在 60 秒后再行推演。' 
      });
    }

    res.status(500).json({ 
      error: '命理演算中断',
      detail: error.message || '请检查网络连接。'
    });
  }
}
