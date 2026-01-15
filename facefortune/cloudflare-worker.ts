
/**
 * 天机面相 - Cloudflare Worker 后端服务
 * 已升级为使用 @google/genai SDK，符合最新开发规范
 */
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
你是一位精通东方面相学和周易玄学的资深命理大师。
根据用户上传的自拍照和咨询事项，进行深度分析。
必须返回严格的 JSON 格式，不得包含 Markdown 标签。
`;

// Define structured output schema using SDK Type enum
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isCompliant: { type: Type.BOOLEAN },
    complianceReason: { type: Type.STRING },
    faceAnalysis: {
      type: Type.OBJECT,
      properties: {
        forehead: { type: Type.STRING },
        eyes: { type: Type.STRING },
        nose: { type: Type.STRING },
        mouth: { type: Type.STRING },
        overall: { type: Type.STRING }
      },
      required: ["forehead", "eyes", "nose", "mouth", "overall"]
    },
    eventAnalysis: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING },
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        advice: { type: Type.ARRAY, items: { type: Type.STRING } },
        remedy: { type: Type.STRING }
      },
      required: ["status", "score", "summary", "advice", "remedy"]
    },
    timeReflection: { type: Type.STRING }
  },
  required: ["isCompliant", "faceAnalysis", "eventAnalysis", "timeReflection"]
};

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Expose-Headers": "X-CF-Colo",
    };

    // Standard CORS preflight handling
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const colo = request.cf?.colo || "Unknown";

    try {
      const bodyText = await request.text();
      if (!bodyText) throw new Error("请求体为空");
      
      let payload;
      try {
        payload = JSON.parse(bodyText);
      } catch (e) {
        throw new Error("无效的 JSON 输入");
      }

      const { image, event, time } = payload;
      
      // Obtain API key exclusively from process.env.API_KEY
      const apiKey = process.env.API_KEY || env.API_KEY;

      if (!apiKey) {
        return new Response(JSON.stringify({ error: "环境变量 API_KEY 未配置。" }), { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const base64Data = image.split(',')[1] || image;
      const mimeType = image.split(',')[0].split(':')[1]?.split(';')[0] || 'image/jpeg';

      // Initialize SDK
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      // Perform content generation with SDK and specified model
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: `【当前时间】：${time}\n【求测事项】：${event}\n分析此面相在此刻对该事项的影响。` },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.8
        }
      });

      // Extract result text property from response
      const resultText = response.text;
      
      if (!resultText) {
        throw new Error("AI 返回内容为空");
      }

      return new Response(resultText, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json", 
          "X-CF-Colo": colo 
        }
      });

    } catch (error: any) {
      let errorMsg = error.message || "未知错误";
      
      // Special handling for region-specific availability errors
      if (errorMsg.includes("location is not supported")) {
        return new Response(JSON.stringify({ 
          error: "地区受限", 
          detail: `当前节点 [${colo}] 无法直接访问 Gemini。请检查 API 配置。`,
          colo: colo
        }), { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json", "X-CF-Colo": colo } 
        });
      }

      return new Response(JSON.stringify({ error: `分析服务故障: ${errorMsg}`, colo: colo }), {
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-CF-Colo": colo }
      });
    }
  }
};
