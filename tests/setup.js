/**
 * Test setup file for Digital English Academy
 * Configures global mocks and test utilities
 */

import { vi } from 'vitest';

global.KeyboardEvent = class KeyboardEvent extends Event {
    constructor(type, options) {
        super(type);
        this.key = options?.key ?? '';
        this.code = options?.code ?? '';
        this.shiftKey = options?.shiftKey ?? false;
        this.altKey = options?.altKey ?? false;
        this.ctrlKey = options?.ctrlKey ?? false;
        this.metaKey = options?.metaKey ?? false;
    }
};

// Mock DOM APIs that might not be available in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
}));

// Mock Performance API
global.performance = {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000
    }
};

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn()
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
});

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
});

// Mock fetch
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
global.console = {
    ...originalConsole,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
};

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        href: 'https://localhost:3000',
        hostname: 'localhost',
        origin: 'https://localhost:3000',
        pathname: '/',
        search: '',
        hash: '',
        reload: vi.fn()
    },
    writable: true
});

// Mock history API
Object.defineProperty(window, 'history', {
    value: {
        pushState: vi.fn(),
        replaceState: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        go: vi.fn()
    },
    writable: true
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
    value: {
        userAgent: 'Mozilla/5.0 (Test Environment)',
        language: 'es-ES',
        languages: ['es-ES', 'es', 'en'],
        onLine: true,
        maxTouchPoints: 0,
        msMaxTouchPoints: 0
    },
    writable: true
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16);
});

global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id);
});

// Mock setTimeout and setInterval for better test control
vi.stubGlobal('setTimeout', vi.fn((callback, delay) => {
    return global.setTimeout(callback, delay);
}));

vi.stubGlobal('setInterval', vi.fn((callback, delay) => {
    return global.setInterval(callback, delay);
}));

// Mock Image constructor
global.Image = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    src: '',
    onload: null,
    onerror: null
}));

// Mock Audio constructor
global.Audio = vi.fn().mockImplementation(() => ({
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
}));

// Mock CSS.supports
global.CSS = {
    supports: vi.fn(() => true)
};

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => [])
}));

// Test utilities
export const testUtils = {
    // Create a mock DOM element
    createElement: (tag, attributes = {}, children = []) => {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        children.forEach(child => {
            if (typeof child === 'string') {
                element.textContent = child;
            } else {
                element.appendChild(child);
            }
        });
        return element;
    },

    // Wait for next tick
    nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

    // Wait for specific time
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    // Trigger event on element
    triggerEvent: (element, eventType, eventInit = {}) => {
        const event = new Event(eventType, eventInit);
        element.dispatchEvent(event);
        return event;
    },

    // Mock Auth0 client
    mockAuth0Client: () => ({
        isAuthenticated: vi.fn().mockResolvedValue(false),
        getUser: vi.fn().mockResolvedValue(null),
        loginWithRedirect: vi.fn().mockResolvedValue(undefined),
        loginWithPopup: vi.fn().mockResolvedValue(undefined),
        logout: vi.fn().mockResolvedValue(undefined),
        getTokenSilently: vi.fn().mockResolvedValue('mock-token'),
        handleRedirectCallback: vi.fn().mockResolvedValue(undefined)
    }),

    // Mock Stripe
    mockStripe: () => ({
        elements: vi.fn(() => ({
            create: vi.fn(() => ({
                mount: vi.fn(),
                unmount: vi.fn(),
                on: vi.fn()
            }))
        })),
        createPaymentMethod: vi.fn().mockResolvedValue({
            paymentMethod: { id: 'pm_test_123' }
        }),
        confirmCardPayment: vi.fn().mockResolvedValue({
            paymentIntent: { status: 'succeeded' }
        })
    }),

    // Reset all mocks
    resetAllMocks: () => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        sessionStorageMock.getItem.mockReturnValue(null);
    }
};

// Global test setup
beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    // Reset mocks
    testUtils.resetAllMocks();
});

// Global test cleanup
afterEach(() => {
    // Clean up any remaining timers
    vi.clearAllTimers();

    // Reset modules
    vi.resetModules();
});