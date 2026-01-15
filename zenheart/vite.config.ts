
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 设置为 './' 确保所有静态资源（JS, CSS, 图片）都使用相对路径
  // 这样你将 build 后的 dist 文件夹放在服务器的任何目录下都能运行
  base: './',
  build: {
    outDir: '../website/zenheart',
    assetsDir: 'assets',
    // 确保生成 sourcemap 方便调试
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true
  }
});
