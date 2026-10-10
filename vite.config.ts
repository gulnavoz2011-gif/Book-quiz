import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {apiRouter} from './server/api.ts';

import fs from 'fs';

const apiDevPlugin = (): Plugin => ({
  name: 'api-dev-server',
  configureServer(server) {
    const apiApp = express();
    apiApp.use(express.json({ limit: '500mb' }));
    apiApp.use(express.urlencoded({ limit: '500mb', extended: true }));

    const uploadsDir = path.resolve(__dirname, 'server', 'data', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    apiApp.use('/uploads', express.static(uploadsDir));
    apiApp.use('/api', apiRouter);

    server.middlewares.use((req, res, next) => {
      if (req.url && (req.url.startsWith('/api') || req.url.startsWith('/uploads'))) {
        return (apiApp as any)(req, res, next);
      }
      next();
    });
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
