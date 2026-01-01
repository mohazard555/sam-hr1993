
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [
        // نقوم باستبعاد المكتبات التي يتم تحميلها عبر Import Map في المتصفح 
        // إذا كنا نريد الاعتماد كلياً على ESM، ولكن في بيئة Vercel يفضل تركها للـ Bundler
      ]
    }
  }
});
