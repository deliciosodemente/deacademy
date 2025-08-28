import { describe, it, expect, beforeEach } from 'vitest';
import { clamp, toast } from '../utils.js';

describe('Utils', () => {
  describe('clamp', () => {
    it('should clamp value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 0)).toBe(0);
      expect(clamp(5, 5, 5)).toBe(5);
    });
  });

  describe('toast', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should create toast element', () => {
      toast('Test message');
      const toastEl = document.querySelector('div');
      expect(toastEl).toBeTruthy();
      expect(toastEl.textContent).toBe('Test message');
    });

    it('should apply correct styles', () => {
      toast('Test');
      const toastEl = document.querySelector('div');
      expect(toastEl.style.position).toBe('fixed');
      expect(toastEl.style.zIndex).toBe('70');
    });
  });
});