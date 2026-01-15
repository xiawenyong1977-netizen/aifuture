
import { GoogleGenAI } from "@google/genai";
import { PRODUCTS, COMPANY } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
你是一位来自 "${COMPANY.name}" 的资深产品顾问。
公司的Slogan是 "${COMPANY.slogan}"。
其核心愿景是: "${COMPANY.mission}"。

你需要向客户介绍以下五款产品：
${PRODUCTS.map(p => `
- ${p.name}: ${p.brief}。AI特性: ${p.aiFeatures.join(", ")}。支持平台: ${p.platforms.join(", ")}。
`).join("\n")}

语气应专业、亲切、且带有科技感。如果用户询问产品详情，请根据以上信息回答。
`;

export const getAIResponse = async (message: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "抱歉，我现在遇到了一点技术问题，请稍后再试或直接浏览我们的产品页面。";
  }
};
