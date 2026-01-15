#!/usr/bin/env python3
"""
预生成图片脚本
该脚本用于定期生成佛教观想图片并保存到指定目录
"""

import requests
import os
import json
import time
import uuid
from typing import List, Dict
import argparse

def load_config():
    """加载配置文件"""
    config_path = os.path.join(os.path.dirname(__file__), "config.json")
    if not os.path.exists(config_path):
        raise FileNotFoundError("Config file not found. Please create config.json")
    
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_image(prompt: str, api_key: str, api_url: str) -> str:
    """调用通义万相API生成图片"""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable"
    }
    
    data = {
        "model": "wanx2.1-t2i-plus",  # 更新为正确的模型名称
        "input": {
            "prompt": prompt,
            "style": "traditional chinese painting",
            "size": "1024*1024",
            "n": 1
        },
        "parameters": {}
    }
    
    print(f"Calling Tongyi API with prompt: {prompt}")
    
    # 发起请求
    response = requests.post(api_url, headers=headers, json=data)
    
    print(f"API response status code: {response.status_code}")
    
    if response.status_code != 200:
        print(f"API response content: {response.text}")
        raise Exception(f"Failed to call Tongyi API: {response.text}")
    
    result = response.json()
    print(f"API response result: {result}")
    
    # 检查是否有任务ID返回
    if "output" in result and "task_id" in result["output"]:
        task_id = result["output"]["task_id"]
        print(f"Task created with ID: {task_id}")
        return task_id
    else:
        raise Exception("Invalid response from Tongyi API")

def poll_for_result(task_id: str, api_key: str, api_url: str) -> str:
    """轮询获取异步任务结果"""
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    
    # 构造轮询URL，使用完整的任务查询端点
    poll_url = f"https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}"
    
    print(f"Polling for result of task {task_id}")
    print(f"Poll URL: {poll_url}")
    
    # 最多重试30次，每次间隔5秒
    for i in range(30):
        try:
            print(f"Polling attempt {i+1}/30")
            response = requests.get(poll_url, headers=headers)
            print(f"Poll response status code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Poll response result: {result}")
                
                task_status = result.get("output", {}).get("task_status")
                print(f"Task status: {task_status}")
                
                if task_status == "SUCCEEDED":
                    # 返回图片URL
                    image_url = result["output"]["results"][0]["url"]
                    print(f"Task succeeded, image URL: {image_url}")
                    return image_url
                elif task_status == "FAILED":
                    raise Exception("Image generation failed on Tongyi side")
            elif response.status_code == 400:
                print(f"Bad request error: {response.text}")
                    
            time.sleep(5)
        except Exception as e:
            print(f"Error during polling: {e}")
            time.sleep(5)
            continue
    
    raise Exception("Image generation timeout")

def download_and_save_image(image_url: str, save_path: str):
    """下载图片并保存到指定路径"""
    print(f"Downloading image from: {image_url}")
    response = requests.get(image_url)
    print(f"Download response status code: {response.status_code}")
    
    if response.status_code == 200:
        with open(save_path, "wb") as f:
            f.write(response.content)
        print(f"Image saved to: {save_path}")
    else:
        raise Exception(f"Failed to download image: {response.status_code}")

def pre_generate_images(segment_id: int = None):
    """预生成图片主函数"""
    print("Loading configuration...")
    # 加载配置
    config = load_config()
    
    # 获取配置参数
    api_key = config.get("tongyi_api_key", "")
    api_url = config.get("tongyi_api_url", "")
    image_storage_path = config.get("image_storage_path", "./images")
    segments = config.get("segments", [])
    
    print(f"API Key present: {bool(api_key)}")
    print(f"API URL: {api_url}")
    print(f"Image storage path: {image_storage_path}")
    print(f"Segments count: {len(segments)}")
    
    # 检查API密钥
    if not api_key:
        print("Error: Tongyi API key not configured")
        return
    
    # 确保图片存储目录存在
    os.makedirs(image_storage_path, exist_ok=True)
    
    # 如果指定了段落ID，则只处理该段落
    if segment_id is not None:
        segments = [s for s in segments if s["id"] == segment_id]
        if not segments:
            print(f"Error: Segment {segment_id} not found in config")
            return
    
    print(f"Processing {len(segments)} segments")
    
    # 为每个段落生成一张图片
    for segment in segments:
        segment_id = segment["id"]
        prompts = segment["prompts"]
        
        print(f"Processing segment {segment_id}")
        
        # 为该段落创建目录
        segment_dir = os.path.join(image_storage_path, str(segment_id))
        os.makedirs(segment_dir, exist_ok=True)
        
        # 从提示词列表中随机选择一个
        prompt = prompts[0]  # 默认使用第一个提示词
        print(f"Using prompt: {prompt}")
        
        try:
            print(f"Generating image for segment {segment_id}")
            
            # 生成图片
            task_id = generate_image(prompt, api_key, api_url)
            
            # 获取结果
            image_url = poll_for_result(task_id, api_key, api_url)
            
            # 保存图片
            filename = f"{uuid.uuid4().hex}.png"
            save_path = os.path.join(segment_dir, filename)
            download_and_save_image(image_url, save_path)
            
            print(f"Successfully generated {filename} for segment {segment_id}")
            
        except Exception as e:
            print(f"Failed to generate image for segment {segment_id}: {e}")

if __name__ == "__main__":
    # 解析命令行参数
    parser = argparse.ArgumentParser(description="预生成佛教观想图片")
    parser.add_argument("--segment-id", type=int, help="指定段落ID，只为此段落生成图片")
    args = parser.parse_args()
    
    pre_generate_images(args.segment_id)