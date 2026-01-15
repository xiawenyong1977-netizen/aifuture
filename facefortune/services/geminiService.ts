
import { FortuneResult } from "../types";

// Vercel 部署后，API 路由位于 /api/analyze
const API_ENDPOINT = "/api/analyze"; 

export const analyzeFortune = async (
  base64Image: string,
  eventDescription: string,
  timeString: string
): Promise<FortuneResult> => {
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: base64Image,
        event: eventDescription || "未填写事项",
        time: timeString,
      }),
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      if (response.status === 413) {
        throw new Error("图片体积过大，请尝试重新拍摄或更换较小的照片。");
      }
      throw new Error(`服务器响应异常 (${response.status})。请稍后重试。`);
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `请求失败 (${response.status})`);
    }

    return data as FortuneResult;
  } catch (err: any) {
    throw new Error(err.message || "无法连接至命理分析服务器。");
  }
};
