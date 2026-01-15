
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 必须使用相对路径，否则在 Android WebView 中无法加载资源
  base: './',
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
