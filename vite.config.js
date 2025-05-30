import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Charge les variables d'environnement en fonction du mode (development/production)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    // Expose les variables d'environnement au client
    define: {
      'import.meta.env.VITE_SITE_URL': JSON.stringify(env.VITE_SITE_URL),
      'import.meta.env.VITE_SITE_URL_PROD': JSON.stringify(env.VITE_SITE_URL_PROD),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    // Configuration du serveur de développement
    server: {
      port: 5173,
      strictPort: true,
    },
    // Configuration de la construction
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
    },
  };
});
