import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable minification
    minify: "esbuild",
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          react: ["react", "react-dom", "react-router-dom"],
          redux: ["@reduxjs/toolkit", "react-redux"],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Generate source maps for production debugging (optional, disable for smaller builds)
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
    exclude: ["@vite/client", "@vite/env"],
  },
  // Server configuration for better dev experience
  server: {
    open: false,
    cors: true,
  },
});
