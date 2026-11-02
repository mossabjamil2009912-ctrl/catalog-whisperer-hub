// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null,
        devOptions: { enabled: false },
        manifest: false,
        filename: "sw.js",
        workbox: {
          // SSR app: no index.html fallback; navigations are network-first.
          navigateFallback: null,
          globPatterns: ["**/*.{js,css,woff2,png,svg,ico}"],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: { cacheName: "pages", networkTimeoutSeconds: 4 },
            },
            {
              // Catalog list / details server functions (GET) — usable offline.
              urlPattern: ({ url, request }) =>
                request.method === "GET" && url.pathname.startsWith("/_serverFn"),
              handler: "NetworkFirst",
              options: { cacheName: "api", networkTimeoutSeconds: 4 },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === self.location.origin && url.pathname.startsWith("/assets/"),
              handler: "CacheFirst",
              options: { cacheName: "assets" },
            },
            {
              urlPattern: ({ url }) =>
                /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|unpkg\.com/.test(url.host),
              handler: "CacheFirst",
              options: { cacheName: "cdn", expiration: { maxEntries: 200 } },
            },
          ],
        },
      }),
    ],
  },
});
