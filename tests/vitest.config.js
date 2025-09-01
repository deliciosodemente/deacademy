/**
 * Vitest configuration for Digital English Academy tests
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Test environment
        environment: 'jsdom',

        // Global setup
        globals: true,

        // Test file patterns
        include: [
            'tests/**/*.test.js',
            'tests/**/*.spec.js'
        ],

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './tests/coverage',
            include: [
                'lib/**/*.js',
                'config/**/*.js',
                'auth.js',
                'router.js',
                'utils.js'
            ],
            exclude: [
                'tests/**',
                'node_modules/**',
                'build/**',
                'dist/**'
            ],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80
                }
            }
        },

        // Test timeout
        testTimeout: 10000,

        // Setup files
        setupFiles: ['./tests/setup.js'],

        // Mock configuration
        deps: {
            inline: ['vitest-canvas-mock']
        },

        // Environment options
        environmentOptions: {
            jsdom: {
                resources: 'usable'
            }
        }
    },

    // Resolve configuration
    resolve: {
        alias: {
            '@': new URL('../', import.meta.url).pathname,
            '@lib': new URL('../lib', import.meta.url).pathname,
            '@config': new URL('../config', import.meta.url).pathname,
            '@tests': new URL('./', import.meta.url).pathname
        }
    },

    // Define global variables
    define: {
        'window': {},
    }
});