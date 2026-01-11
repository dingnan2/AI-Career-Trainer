import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[Proxy] Request:', req.method, req.url, '-> http://127.0.0.1:8002');
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('[Proxy] Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req) => {
            console.error('[Proxy] Error:', err.message, req.url);
          });
        },
      },
    },
  },
});

