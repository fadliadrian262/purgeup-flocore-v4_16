import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NODE_ENV': JSON.stringify(mode)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@components': path.resolve(__dirname, './components'),
          '@services': path.resolve(__dirname, './services'),
          '@hooks': path.resolve(__dirname, './hooks'),
          '@contexts': path.resolve(__dirname, './contexts'),
          '@utils': path.resolve(__dirname, './utils'),
          '@types': path.resolve(__dirname, './types.ts')
        }
      },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          '@google/genai',
          'pdf-lib',
          'marked',
          '@mlc-ai/web-llm',
          'html2canvas',
          'immer',
          'lucide-react'
        ]
      },
      server: {
        port: 3000,
        host: true
      },
      build: {
        target: 'esnext',
        sourcemap: true
      }
    };
});
