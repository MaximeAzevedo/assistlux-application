import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
    force: true,
    include: [
      'react',
      'react-dom',
      '@headlessui/react',
      'i18next',
      'react-i18next'
    ]
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    hmr: {
      overlay: false,
      port: 24678
    },
    watch: {
      usePolling: false,
      interval: 100
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react', 'lucide-react'],
          'document-vendor': ['pdfjs-dist', 'mammoth'],
          'services-vendor': ['@supabase/supabase-js', 'openai', 'i18next'],
          'maps-vendor': ['@googlemaps/react-wrapper']
        }
      },
    },
    chunkSizeWarningLimit: 1000,
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    sourcemap: false
  },
  publicDir: 'public',
  css: {
    devSourcemap: true
  }
});