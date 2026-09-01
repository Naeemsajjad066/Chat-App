import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      // Clean imports: "@/components/..." instead of "../../components/..."
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    target: "es2020",
    minify: "esbuild",       // esbuild is faster than terser, good enough for prod
    sourcemap: false,        // no sourcemaps in production (smaller bundle)
    cssCodeSplit: true,      // separate CSS per chunk

    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps vendor code separate from app code
        // so users don't re-download React when only app code changes
        manualChunks: {
          "vendor-react":  ["react", "react-dom", "react-router-dom"],
          "vendor-socket": ["socket.io-client"],
          "vendor-ui":     ["react-hot-toast"],
          "vendor-http":   ["axios"],
        },
        // Deterministic file names for long-term caching
        chunkFileNames:  "assets/[name]-[hash].js",
        entryFileNames:  "assets/[name]-[hash].js",
        assetFileNames:  "assets/[name]-[hash][extname]",
      },
    },

    // Warn when a chunk exceeds 400 kB (default 500)
    chunkSizeWarningLimit: 400,
  },

  // Path aliases also apply in dev server
  base: "/",
});
