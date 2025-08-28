import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state } from '../state.js';

// Mock dayjs
vi.mock('dayjs', () => {
  const mockDayjs = vi.fn(() => ({
    subtract: vi.fn().mockReturnThis(),
    fromNow: vi.fn(() => 'hace 2 horas')
  }));
  mockDayjs.extend = vi.fn();
  mockDayjs.locale = vi.fn();
  return { default: mockDayjs };
});

describe('State Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should have default courses', () => {
    expect(state.courses).toBeDefined();
    expect(state.courses.length).toBeGreaterThan(0);
    expect(state.courses[0]).toHaveProperty('title');
    expect(state.courses[0]).toHaveProperty('level');
  });

  it('should have default threads', () => {
    expect(state.threads).toBeDefined();
    expect(state.threads.length).toBeGreaterThan(0);
    expect(state.threads[0]).toHaveProperty('title');
    expect(state.threads[0]).toHaveProperty('author');
  });

  it('should initialize progress', () => {
    expect(typeof state.progress).toBe('number');
    expect(state.progress).toBeGreaterThanOrEqual(0);
    expect(state.progress).toBeLessThanOrEqual(100);
  });
});