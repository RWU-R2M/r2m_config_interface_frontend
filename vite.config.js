import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy, options) => {
          // Log proxy errors to help with debugging
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const status = proxyRes.statusCode;
            if (status >= 400) {
              console.warn(`Proxy response error: ${status} for ${req.method} ${req.url}`);
            } else {
              console.log(`Proxy response: ${status} for ${req.method} ${req.url}`);
            }
          });
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});