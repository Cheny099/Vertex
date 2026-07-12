import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allowedHosts = (env.DEV_SERVER_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  return {
    server: {
      host: env.DEV_SERVER_HOST || '127.0.0.1',
      port: 8080,
      allowedHosts,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000, // Increase limit slightly to reduce noise
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-slot', '@radix-ui/react-toast'], // Group common UI libs
            'vendor-utils': ['date-fns', 'zod', 'react-hook-form', 'clsx', 'tailwind-merge'],
            'vendor-charts': ['recharts'],
            'vendor-animation': ['framer-motion'],
            'vendor-icons': ['lucide-react'], // Lucide icons can be large
          },
        },
      },
    },
  };
});
