import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        about: resolve(root, 'about.html'),
        services: resolve(root, 'services.html'),
        solutions: resolve(root, 'solutions.html'),
        careers: resolve(root, 'careers.html'),
        contact: resolve(root, 'contact.html'),
        privacyPolicy: resolve(root, 'privacy-policy.html'),
        termsOfUse: resolve(root, 'terms-of-use.html'),
      },
    },
  },
});
