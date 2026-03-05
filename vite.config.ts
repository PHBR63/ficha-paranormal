import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png", "apple-touch-icon-152x152.png"],
      // Habilita PWA em modo desenvolvimento para debug
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: "Let's Roll - VTT Ordem Paranormal",
        short_name: "Let's Roll",
        description: "Mesa Virtual para Ordem Paranormal RPG v1.3 - Sistema oficial da Ordo Realitas",
        theme_color: "#0a0514",
        background_color: "#0a0514",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        // ID único para manter identidade do app
        id: "/",
        // Categorias para lojas de apps
        categories: ["games", "entertainment"],
        // Preferência de aplicativos relacionados
        prefer_related_applications: false,
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-384x384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        // Screenshots removidos para evitar 404 (arquivos não existem)
        // NOTA: Adicionar screenshots reais quando disponíveis
      },
      workbox: {
        // Importa apenas scripts locais de push notifications no Service Worker
        // SEGURANÇA: Scripts externos (CDN) foram removidos para prevenir supply chain attacks
        // Ref: https://owasp.org/www-project-web-security-testing-guide/
        importScripts: [
          'sw-push.js'
        ],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB limit
        // Always navigate to index.html - the app will handle offline detection
      navigateFallback: "/index.html",
      navigateFallbackAllowlist: [/^\/$/,  /^\/map\//],
      navigateFallbackDenylist: [/^\/api/, /^\/auth/],
        // Força ativação imediata do novo Service Worker
        skipWaiting: true,
        clientsClaim: true,
        // Limpa caches antigos automaticamente
        cleanupOutdatedCaches: true,
        // DESATIVADO: O SW customizado não trata preloadResponse corretamente
        // Isso evita o warning "navigation preload request was cancelled"
        navigationPreload: false,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Cache de API do Supabase com revalidação (stale-while-revalidate)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutos
              },
              networkTimeoutSeconds: 10, // Fallback para cache após 10s
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — carregado em todas as rotas
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Backend e data fetching
          'vendor-supabase': ['@supabase/supabase-js', '@tanstack/react-query'],
          // Componentes UI (Radix, etc.)
          'vendor-ui': [
            'class-variance-authority', 'tailwind-merge', 'clsx',
            'cmdk', 'sonner', 'vaul', 'lucide-react',
          ],
          // Canvas/Mapa — carregado apenas na rota do mapa
          'vendor-canvas': ['konva', 'react-konva'],
          // Animações — carregado sob demanda
          'vendor-motion': ['framer-motion'],
          // Gráficos — carregado sob demanda
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
