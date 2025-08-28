import { vi } from 'vitest';

// Mock WebSim API
global.websim = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        content: 'Mocked AI response',
        role: 'assistant'
      })
    }
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hash: '#/',
    href: 'http://localhost:3000/',
    reload: vi.fn()
  },
  writable: true
});