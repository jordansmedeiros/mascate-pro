import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  build: {
    // Otimizações para produção
    target: 'es2015',
    minify: 'terser',
    // Chunking para melhor cache
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk - bibliotecas externas
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI chunk - componentes UI
          ui: ['@tanstack/react-query', 'react-hot-toast', 'lucide-react'],
          // Utils chunk - utilitários
          utils: ['uuid', 'zod'],
        },
        // Nomes de arquivo com hash para cache busting
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
          
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/img/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/misc/[name]-[hash][extname]`;
        },
      },
    },
    // Configurações de chunk size
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
  },
  // Preview para testar build localmente
  preview: {
    port: 4173,
    strictPort: true,
  },
});
