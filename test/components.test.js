import { describe, it, expect } from 'vitest';
import { feature, courseCard, donutSVG } from '../components.js';

describe('Components', () => {
  describe('feature', () => {
    it('should render feature component', () => {
      const result = feature('ph-star', 'Test Title', 'Test description');
      expect(result).toContain('ph-star');
      expect(result).toContain('Test Title');
      expect(result).toContain('Test description');
      expect(result).toContain('class="feature"');
    });
  });

  describe('courseCard', () => {
    const mockCourse = {
      id: 1,
      level: 'Básico',
      type: 'General',
      title: 'Test Course',
      img: 'test.jpg',
      blurb: 'Test description'
    };

    it('should render course card', () => {
      const result = courseCard(mockCourse);
      expect(result).toContain('Test Course');
      expect(result).toContain('Test description');
      expect(result).toContain('test.jpg');
      expect(result).toContain('basic');
    });

    it('should handle different levels', () => {
      const intermediate = { ...mockCourse, level: 'Intermedio' };
      const advanced = { ...mockCourse, level: 'Avanzado' };
      
      expect(courseCard(intermediate)).toContain('intermediate');
      expect(courseCard(advanced)).toContain('advanced');
    });
  });

  describe('donutSVG', () => {
    it('should render SVG with correct percentage', () => {
      const result = donutSVG(75);
      expect(result).toContain('75%');
      expect(result).toContain('<svg');
      expect(result).toContain('viewBox="0 0 100 100"');
    });

    it('should handle edge cases', () => {
      expect(donutSVG(0)).toContain('0%');
      expect(donutSVG(100)).toContain('100%');
    });
  });
});