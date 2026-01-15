# ZenHeart 后端服务

这是一个为 ZenHeart 项目提供 AI 图像生成功能的后端服务。

## 功能说明

1. 预生成佛教观想图像并保存到服务器
2. 提供图像访问接口供前端获取图像

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置

1. 修改 `config.json` 文件，填入你的阿里云 API Key:

```json
{
    "tongyi_api_key": "your_actual_api_key",
    "tongyi_api_url": "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
    "image_storage_path": "./images",
    "segments": [
        {
            "id": 0,
            "prompts": [
                "观自在菩萨，行深般若波罗蜜多时，照见五蕴皆空，度一切苦厄。佛教艺术风格，金色菩萨像，莲花座，祥云环绕"
            ]
        }
    ]
}
```

## 使用方法

### 1. 预生成图片

定期运行预生成脚本以生成新的观想图像：

```bash
# 为所有段落生成图片
python pre_generate.py

# 为指定段落生成图片
python pre_generate.py --segment-id 0
```

该脚本会为每个段落生成一张图像，并保存在 `images/[segment_id]/` 目录下。
在初始阶段，你可以多次运行该脚本来为每个段落生成多张图片。

### 2. 运行服务

```bash
uvicorn main:app --host 0.0.0.0 --port 8005
```

或者直接运行:

```bash
python main.py
```

## API 接口

### 获取图像

GET `/images/{segment_id}`

该接口会从指定段落的预生成图片中随机返回一张。

## 文件结构

```
images/
├── 0/
│   ├── image1.png
│   ├── image2.png
│   └── ...
├── 1/
│   ├── image1.png
│   ├── image2.png
│   └── ...
└── ...
```

## 注意事项

1. 请确保服务器有访问阿里云 API 的网络权限
2. 确保 `images` 目录有写入权限
3. 阿里云 API 调用会产生费用，请注意用量控制