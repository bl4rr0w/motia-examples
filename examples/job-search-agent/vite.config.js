import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    fs: {
      // Allow serving files from node_modules
      allow: [
        // Allow the entire node_modules directory
        resolve('node_modules'),
        // Include the project directory
        resolve('.'),
      ]
    }
  }
}); 