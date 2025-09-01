/**
 * Frontend tests for Video Player Component
 * Tests video streaming, controls, and user interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VideoPlayer from '../../lib/components/VideoPlayer.jsx';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock HTMLVideoElement methods
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    writable: true,
    value: vi.fn().mockImplementation(() => Promise.resolve())
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    writable: true,
    value: vi.fn()
});

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
    writable: true,
    value: vi.fn()
});

// Mock video properties
Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
    writable: true,
    value: 0
});

Object.defineProperty(HTMLMediaElement.prototype, 'duration', {
    writable: true,
    value: 120
});

Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
    writable: true,
    value: 1
});

Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
    writable: true,
    value: false
});

Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
    writable: true,
    value: true
});

Object.defineProperty(HTMLMediaElement.prototype, 'ended', {
    writable: true,
    value: false
});

Object.defineProperty(HTMLMediaElement.prototype, 'readyState', {
    writable: true,
    value: 4 // HAVE_ENOUGH_DATA
});

describe('VideoPlayer Component', () => {
    const mockVideoData = {
        videoKey: 'course1/lesson1.mp4',
        title: 'Introduction to English',
        courseId: 'course1',
        lessonId: 'lesson1'
    };

    const mockSignedUrlResponse = {
        signedUrl: 'https://d9zcoog7fpl4q.cloudfront.net/course1/lesson1.mp4?signed-url',
        videoKey: 'course1/lesson1.mp4',
        source: 'cloudfront',
        accessPoint: 'enabled',
        metadata: {
            size: 1024000,
            duration: '120',
            resolution: '1080p',
            contentType: 'video/mp4'
        },
        expiresAt: new Date(Date.now() + 3600000).toISOString()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockSignedUrlResponse)
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Component Rendering', () => {
        it('should render video player with loading state', () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            expect(screen.getByText('Loading video...')).toBeInTheDocument();
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });

        it('should render video title', () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            expect(screen.getByText('Introduction to English')).toBeInTheDocument();
        });

        it('should render video element after loading', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                expect(screen.getByRole('video')).toBeInTheDocument();
            });
        });

        it('should display error message when video fails to load', async () => {
            fetch.mockRejectedValueOnce(new Error('Failed to fetch signed URL'));
            
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                expect(screen.getByText(/Error loading video/)).toBeInTheDocument();
            });
        });
    });

    describe('Video Controls', () => {
        it('should show play button initially', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                expect(screen.getByLabelText('Play')).toBeInTheDocument();
            });
        });

        it('should play video when play button is clicked', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const playButton = screen.getByLabelText('Play');
                fireEvent.click(playButton);
            });

            const videoElement = screen.getByRole('video');
            expect(videoElement.play).toHaveBeenCalled();
        });

        it('should pause video when pause button is clicked', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const playButton = screen.getByLabelText('Play');
                fireEvent.click(playButton);
            });

            // Simulate video playing state
            const videoElement = screen.getByRole('video');
            Object.defineProperty(videoElement, 'paused', { value: false });
            fireEvent.play(videoElement);

            await waitFor(() => {
                const pauseButton = screen.getByLabelText('Pause');
                fireEvent.click(pauseButton);
            });

            expect(videoElement.pause).toHaveBeenCalled();
        });

        it('should toggle mute when mute button is clicked', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const muteButton = screen.getByLabelText('Mute');
                fireEvent.click(muteButton);
            });

            const videoElement = screen.getByRole('video');
            expect(videoElement.muted).toBe(true);
        });

        it('should change volume when volume slider is moved', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const volumeSlider = screen.getByLabelText('Volume');
                fireEvent.change(volumeSlider, { target: { value: '0.5' } });
            });

            const videoElement = screen.getByRole('video');
            expect(videoElement.volume).toBe(0.5);
        });

        it('should seek video when progress bar is clicked', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const progressBar = screen.getByLabelText('Seek');
                fireEvent.change(progressBar, { target: { value: '60' } });
            });

            const videoElement = screen.getByRole('video');
            expect(videoElement.currentTime).toBe(60);
        });
    });

    describe('Video Quality Selection', () => {
        it('should show quality selector when multiple qualities available', async () => {
            const mockMultiQualityResponse = {
                ...mockSignedUrlResponse,
                qualities: [
                    { resolution: '720p', url: 'https://example.com/720p.mp4' },
                    { resolution: '1080p', url: 'https://example.com/1080p.mp4' }
                ]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockMultiQualityResponse)
            });

            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                expect(screen.getByLabelText('Quality')).toBeInTheDocument();
            });
        });

        it('should change video quality when selected', async () => {
            const mockMultiQualityResponse = {
                ...mockSignedUrlResponse,
                qualities: [
                    { resolution: '720p', url: 'https://example.com/720p.mp4' },
                    { resolution: '1080p', url: 'https://example.com/1080p.mp4' }
                ]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockMultiQualityResponse)
            });

            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const qualitySelector = screen.getByLabelText('Quality');
                fireEvent.change(qualitySelector, { target: { value: '720p' } });
            });

            const videoElement = screen.getByRole('video');
            expect(videoElement.src).toContain('720p.mp4');
        });
    });

    describe('Fullscreen Functionality', () => {
        it('should enter fullscreen when fullscreen button is clicked', async () => {
            // Mock requestFullscreen
            const mockRequestFullscreen = vi.fn();
            Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
                writable: true,
                value: mockRequestFullscreen
            });

            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const fullscreenButton = screen.getByLabelText('Fullscreen');
                fireEvent.click(fullscreenButton);
            });

            expect(mockRequestFullscreen).toHaveBeenCalled();
        });

        it('should exit fullscreen when escape key is pressed', async () => {
            // Mock exitFullscreen
            const mockExitFullscreen = vi.fn();
            Object.defineProperty(document, 'exitFullscreen', {
                writable: true,
                value: mockExitFullscreen
            });

            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                fireEvent.keyDown(document, { key: 'Escape' });
            });

            expect(mockExitFullscreen).toHaveBeenCalled();
        });
    });

    describe('Keyboard Shortcuts', () => {
        it('should play/pause with spacebar', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const videoElement = screen.getByRole('video');
                fireEvent.keyDown(videoElement, { key: ' ' });
            });

            const videoElement = screen.getByRole('video');
            expect(videoElement.play).toHaveBeenCalled();
        });

        it('should seek forward with right arrow', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const videoElement = screen.getByRole('video');
                videoElement.currentTime = 30;
                fireEvent.keyDown(videoElement, { key: 'ArrowRight' });
            });

            const videoElement = screen.getByRole('video');
            expect(videoElement.currentTime).toBe(40); // +10 seconds
        });

        it('should seek backward with left arrow', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const videoElement = screen.getByRole('video');
                videoElement.currentTime = 30;
                fireEvent.keyDown(videoElement, { key: 'ArrowLeft' });
            });

            const videoElement = screen.getByRole('video');
            expect(videoElement.currentTime).toBe(20); // -10 seconds
        });

        it('should increase volume with up arrow', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const videoElement = screen.getByRole('video');
                videoElement.volume = 0.5;
                fireEvent.keyDown(videoElement, { key: 'ArrowUp' });
            });

            const videoElement = screen.getByRole('video');
            expect(videoElement.volume).toBe(0.6); // +0.1
        });

        it('should decrease volume with down arrow', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const videoElement = screen.getByRole('video');
                videoElement.volume = 0.5;
                fireEvent.keyDown(videoElement, { key: 'ArrowDown' });
            });

            const videoElement = screen.getByRole('video');
            expect(videoElement.volume).toBe(0.4); // -0.1
        });

        it('should toggle mute with M key', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const videoElement = screen.getByRole('video');
                fireEvent.keyDown(videoElement, { key: 'm' });
            });

            const videoElement = screen.getByRole('video');
            expect(videoElement.muted).toBe(true);
        });
    });

    describe('Progress Tracking', () => {
        it('should update progress as video plays', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const videoElement = screen.getByRole('video');
                videoElement.currentTime = 60;
                fireEvent.timeUpdate(videoElement);
            });

            expect(screen.getByText('01:00')).toBeInTheDocument(); // Current time
            expect(screen.getByText('02:00')).toBeInTheDocument(); // Duration
        });

        it('should save progress to localStorage', async () => {
            const mockSetItem = vi.spyOn(Storage.prototype, 'setItem');
            
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const videoElement = screen.getByRole('video');
                videoElement.currentTime = 60;
                fireEvent.timeUpdate(videoElement);
            });

            expect(mockSetItem).toHaveBeenCalledWith(
                'video-progress-course1-lesson1',
                '60'
            );
        });

        it('should restore progress from localStorage', async () => {
            const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
            mockGetItem.mockReturnValue('45');
            
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const videoElement = screen.getByRole('video');
                expect(videoElement.currentTime).toBe(45);
            });
        });
    });

    describe('Error Handling', () => {
        it('should show error when signed URL request fails', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));
            
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                expect(screen.getByText(/Error loading video/)).toBeInTheDocument();
                expect(screen.getByText(/Network error/)).toBeInTheDocument();
            });
        });

        it('should show retry button on error', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));
            
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                expect(screen.getByText('Retry')).toBeInTheDocument();
            });
        });

        it('should retry loading video when retry button is clicked', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'))
                 .mockResolvedValueOnce({
                     ok: true,
                     json: () => Promise.resolve(mockSignedUrlResponse)
                 });
            
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const retryButton = screen.getByText('Retry');
                fireEvent.click(retryButton);
            });

            await waitFor(() => {
                expect(screen.getByRole('video')).toBeInTheDocument();
            });
        });

        it('should handle video playback errors', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const videoElement = screen.getByRole('video');
                fireEvent.error(videoElement);
            });

            expect(screen.getByText(/Video playback error/)).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                expect(screen.getByLabelText('Play')).toBeInTheDocument();
                expect(screen.getByLabelText('Mute')).toBeInTheDocument();
                expect(screen.getByLabelText('Volume')).toBeInTheDocument();
                expect(screen.getByLabelText('Seek')).toBeInTheDocument();
                expect(screen.getByLabelText('Fullscreen')).toBeInTheDocument();
            });
        });

        it('should be keyboard navigable', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const playButton = screen.getByLabelText('Play');
                playButton.focus();
                expect(document.activeElement).toBe(playButton);
            });
        });

        it('should announce state changes to screen readers', async () => {
            render(<VideoPlayer {...mockVideoData} />);
            
            await waitFor(() => {
                const playButton = screen.getByLabelText('Play');
                fireEvent.click(playButton);
            });

            // Check for aria-live region updates
            expect(screen.getByRole('status')).toHaveTextContent(/playing/i);
        });
    });
});