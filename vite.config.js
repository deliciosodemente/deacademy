/**
 * Vite configuration for Digital English Academy
 * Production-optimized build configuration for denglishacademy.com
 */

import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        // Base public path for denglishacademy.com
        base: '/',

        // Build configuration
        build: {
            // Output directory
            outDir: 'dist',

            // Assets directory
            assetsDir: 'assets',

            // Generate sourcemaps in development
            sourcemap: mode !== 'production',

            // Minification
            minify: 'terser',

            // Terser options
            terserOptions: {
                compress: {
                    drop_console: mode === 'production',
                    drop_debugger: mode === 'production'
                }
            },

            // Rollup options
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, 'index.html')
                },

                // External dependencies (use CDN versions or exclude from browser build)
                external: ['dayjs', 'dayjs/plugin/relativeTime', 'dayjs/locale/es', 'mongodb'],

                output: {
                    // Manual chunks for better caching
                    manualChunks: {
                        // Core application code
                        core: [
                            './app.js',
                            './router.js',
                            './lib/configuration-manager.js',
                            './lib/app-bootstrap.js'
                        ],

                        // System monitoring and error handling
                        systems: [
                            './lib/error-boundary.js',
                            './lib/error-recovery.js',
                            './lib/performance-monitor.js',
                            './lib/accessibility-manager.js'
                        ],

                        // Authentication
                        auth: [
                            './auth.js',
                            './lib/auth0-manager.js',
                            './config/auth0-config.js'
                        ],

                        // Payment processing
                        payments: [
                            './lib/stripe-manager.js',
                            './config/stripe-config.js',
                            './components/payment-form.js',
                            './components/subscription-selector.js',
                            './components/billing-manager.js'
                        ],

                        // Optional features
                        features: [
                            './lib/resource-optimizer.js',
                            './lib/responsive-design-manager.js',
                            './lib/resource-loading-optimizer.js',
                            './lib/role-based-access.js'
                        ]
                    },

                    // Asset file naming
                    assetFileNames: (assetInfo) => {
                        const info = assetInfo.name.split('.');
                        const ext = info[info.length - 1];

                        if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                            return `assets/images/[name]-[hash][extname]`;
                        }

                        if (/woff2?|eot|ttf|otf/i.test(ext)) {
                            return `assets/fonts/[name]-[hash][extname]`;
                        }

                        return `assets/[name]-[hash][extname]`;
                    },

                    // Chunk file naming
                    chunkFileNames: 'assets/js/[name]-[hash].js',
                    entryFileNames: 'assets/js/[name]-[hash].js'
                }
            },

            // Target browsers
            target: 'es2015',

            // CSS code splitting
            cssCodeSplit: true,

            // Report compressed size
            reportCompressedSize: true,

            // Chunk size warning limit
            chunkSizeWarningLimit: 500
        },

        // Plugins
        plugins: [
            VitePWA({
                registerType: 'autoUpdate',
                injectRegister: 'auto',
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
                },
                manifest: {
                    name: 'Digital English Academy',
                    short_name: 'DEA',
                    description: 'Plataforma integral de aprendizaje de inglés',
                    theme_color: '#ffffff',
                    icons: [
                        {
                            src: 'pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png',
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any maskable',
                        },
                    ],
                },
            }),
        ],

        // Development server
        server: {
            port: 3000,
            host: true,
            open: true,
            cors: true,

            // Proxy API requests in development
            proxy: {
                '/api': {
                    target: 'http://localhost:8000',
                    changeOrigin: true,
                    secure: false
                }
            }
        },

        // Preview server (for production build testing)
        preview: {
            port: 4173,
            host: true,
            open: true
        },

        // Path resolution
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './'),
                '@lib': path.resolve(__dirname, './lib'),
                '@config': path.resolve(__dirname, './config'),
                '@views': path.resolve(__dirname, './views'),
                '@components': path.resolve(__dirname, './components'),
                '@tests': path.resolve(__dirname, './tests')
            }
        },

        // CSS configuration
        css: {
            // CSS modules
            modules: {
                localsConvention: 'camelCase'
            },

            // PostCSS configuration
            postcss: {
                plugins: [
                    // Add PostCSS plugins here if needed
                ]
            }
        },

        // Environment variables
        define: {
            'process.env': {
                NODE_ENV: JSON.stringify(mode),
                AUTH0_DOMAIN: JSON.stringify(env.AUTH0_DOMAIN || ''),
                AUTH0_CLIENT_ID: JSON.stringify(env.AUTH0_CLIENT_ID || ''),
                AUTH0_AUDIENCE: JSON.stringify(env.AUTH0_AUDIENCE || ''),
                STRIPE_PUBLISHABLE_KEY: JSON.stringify(env.STRIPE_PUBLISHABLE_KEY || ''),
                FRONTEND_URL: JSON.stringify(env.FRONTEND_URL || '')
            },
            __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
            __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
            __DOMAIN__: JSON.stringify(env.DOMAIN || 'denglishacademy.com')
        },

        // Worker configuration
        worker: {
            format: 'es'
        },

        // JSON configuration
        json: {
            namedExports: true,
            stringify: false
        }
    };
});