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
  },
  define: {
    'process.env': {},
    global: {},
  },
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: (id) => {
          // Chunking basé sur les modules plutôt que sur les noms de packages
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@headlessui') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('@googlemaps')) {
              return 'maps-vendor';
            }
            if (id.includes('openai')) {
              return 'ai-vendor';
            }
            if (id.includes('mammoth') || id.includes('pdfjs')) {
              return 'document-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // Autres dépendances
            return 'vendor';
          }
        },
      },
    },
    // Augmenter la limite pour éviter les warnings
    chunkSizeWarningLimit: 1000,
    // Optimisations supplémentaires
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer les console.log en production
        drop_debugger: true,
      },
    },
  },
  publicDir: 'public'
});