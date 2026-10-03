import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Custom Vite plugin: copies the standalone admin/ folder into dist/admin/ after build
function copyAdminPlugin() {
  return {
    name: 'copy-admin-panel',
    closeBundle() {
      const src = resolve(__dirname, 'admin');
      const dest = resolve(__dirname, 'dist', 'admin');
      if (!fs.existsSync(src)) return;
      copyDirSync(src, dest);
      console.log('[copy-admin-panel] ✅ admin/ → dist/admin/');
    }
  };
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = resolve(src, entry.name);
    const destPath = resolve(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), copyAdminPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-leaflet': ['leaflet'],
          'vendor-icons': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    open: true
  }
});
