from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
import os
import json
import random
from typing import Dict, List
import time

# 创建FastAPI应用实例
app = FastAPI(title="ZenHeart Image Service", 
              description="Backend service for serving pre-generated Buddhist visualization images")

# 图片缓存结构
image_cache: Dict[int, Dict] = {}
last_cache_update: float = 0

# 加载配置文件
def load_config():
    config_path = os.path.join(os.path.dirname(__file__), "config.json")
    if not os.path.exists(config_path):
        raise FileNotFoundError("Config file not found. Please create config.json")
    
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# 初始化配置
config = load_config()
IMAGE_STORAGE_PATH = config.get("image_storage_path", "./images")
CACHE_EXPIRY_SECONDS = config.get("cache_expiry_seconds", 3600)

def is_cache_expired() -> bool:
    """检查缓存是否过期"""
    return time.time() - last_cache_update > CACHE_EXPIRY_SECONDS

def refresh_image_cache():
    """刷新图片缓存"""
    global last_cache_update
    # 清空现有缓存
    image_cache.clear()
    
    # 遍历图片存储目录
    if not os.path.exists(IMAGE_STORAGE_PATH):
        os.makedirs(IMAGE_STORAGE_PATH)
        
    for segment_dir in os.listdir(IMAGE_STORAGE_PATH):
        segment_path = os.path.join(IMAGE_STORAGE_PATH, segment_dir)
        if os.path.isdir(segment_path):
            try:
                segment_id = int(segment_dir)
                images = []
                for file in os.listdir(segment_path):
                    if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                        images.append(f"/images/{segment_id}/{file}")
                
                image_cache[segment_id] = {
                    "images": images,
                    "timestamp": time.time()
                }
            except ValueError:
                # 跳过非数字命名的目录
                continue
    
    last_cache_update = time.time()

def get_images_for_segment(segment_id: int) -> List[str]:
    """获取指定段落的图片列表"""
    # 如果缓存过期，刷新缓存
    if is_cache_expired():
        refresh_image_cache()
    
    # 如果缓存中没有该段落，尝试刷新一次
    if segment_id not in image_cache:
        refresh_image_cache()
    
    # 返回图片列表
    return image_cache.get(segment_id, {}).get("images", [])

@app.get("/")
async def root():
    return {"message": "ZenHeart Image Service is running"}

# 提供静态文件访问
@app.get("/images/{segment_id}")
async def serve_random_image(segment_id: int):
    """根据段落ID提供随机图片访问接口"""
    # 获取该段落的所有图片
    images = get_images_for_segment(segment_id)
    
    if not images:
        raise HTTPException(status_code=404, detail=f"No images found for segment {segment_id}")
    
    # 随机选择一张图片
    selected_image_url = random.choice(images)
    
    # 解析出文件名
    filename = selected_image_url.split("/")[-1]
    
    # 构建文件路径
    file_path = os.path.join(IMAGE_STORAGE_PATH, str(segment_id), filename)
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    import asyncio
    import sys
    
    # 兼容Python 3.6
    if sys.version_info >= (3, 7):
        uvicorn.run(app, host="0.0.0.0", port=8005)
    else:
        # For Python 3.6
        loop = asyncio.get_event_loop()
        config = uvicorn.Config(app, host="0.0.0.0", port=8005, log_level="info")
        server = uvicorn.Server(config)
        loop.run_until_complete(server.serve())

source /opt/zenheart/ImageClassifierBackend/venv/bin/activate
