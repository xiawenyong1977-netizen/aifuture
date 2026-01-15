# ZenHeart 心经助读系统

## 项目简介

ZenHeart 是一款结合现代科技与传统文化的心经助读系统。通过语音识别技术，帮助用户准确诵读《般若波罗蜜多心经》，并在诵读过程中提供视觉辅助和意义解释。

## 功能特点

- 语音识别实时检测诵读进度
- 经文逐字高亮显示
- 每句经文的白话解释
- AI生成的经文意境图像
- 背景音乐辅助专注
- 诵读历史记录

## 技术架构

- 前端：React + TypeScript + TailwindCSS
- 后端：Python FastAPI
- AI服务：通义万相API
- 语音识别：Web Speech API

## 安装与运行

### 前端运行

```bash
npm install
npm run dev
```

### 后端运行

```bash
cd server
pip install -r requirements.txt
python main.py
```

## 音乐资源

本项目使用CDN上的音乐资源，配置在 `constants.ts` 文件中：

- Relaxing Meditation.mp3 - 放松冥想背景音乐
- Relaxation.mp3 - 放松背景音乐
- monastery-at-evening.wav - 寺院黄昏背景音乐
- Monastery.mp3 - 寺院背景音乐
- MediationIsThePracticeofDeath.mp3 - 冥想是死亡的练习背景音乐
- fifteen-minute-meditation-timer.mp3 - 十五分钟冥想计时器背景音乐
- AmbientRelaxation.mp3 - 环境放松背景音乐

音乐资源链接：https://m.xintuxiangce.top/zenheart/

## 历史记录

诵经记录保存在浏览器的 localStorage 中，键名为 `zenheart_history`。这意味着：

1. 记录只保存在当前浏览器中
2. 更换浏览器或设备将看不到之前的记录
3. 清除浏览器缓存会丢失所有记录
4. 刷新页面不会影响已保存的记录

如果发现刷新后记录消失，请检查：
1. 是否在隐私/无痕模式下浏览
2. 浏览器设置是否限制了本地存储
3. 开发者工具控制台是否有相关错误信息

## 语音识别优化

为了提升语音识别的速度和准确率，我们采用了以下优化措施：

1. **只处理最终识别结果**：设置 `interimResults = false`，避免处理中间结果带来的误差
2. **精简模糊匹配字典**：优化 `FUZZY_MAP`，只保留最常见的易混淆字符组合
3. **输入过滤**：过滤掉非中文字符，只保留有意义的识别内容
4. **处理节流**：限制识别结果处理频率，避免过于频繁的计算
5. **自动重启机制**：识别器出错时自动尝试重启，提高稳定性
6. **预加载优化**：在用户阅读进度达到80%时预加载下一页图片，提升翻页体验

## 响应式布局优化

为了解决在大屏幕设备上音乐播放器按钮消失的问题，我们进行了以下优化：

1. **调整音乐播放器定位**：将音乐播放器从受限容器中移出，确保在各种屏幕尺寸下都能正常显示
2. **优化响应式断点**：针对不同屏幕尺寸设置合适的定位和显示规则
3. **改进音乐名称显示**：在小屏幕上隐藏音乐名称，在中等及以上屏幕显示

## 目录结构

```
zenheart/
├── components/     # React组件
├── services/       # 服务调用
├── server/         # 后端服务
├── public/         # 静态资源
│   └── audio/      # 背景音乐（备用）
├── constants.ts    # 常量配置
└── types.ts        # 类型定义
```

## 注意事项

1. 请确保浏览器支持Web Speech API（推荐使用Chrome）
2. 语音识别仅支持中文普通话
3. 音乐文件需要MP3格式
4. 图像生成功能需要配置通义万相API密钥

## 许可证

本项目仅供学习交流使用。