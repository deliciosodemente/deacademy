/**
 * Course Player for Digital English Academy
 * Interactive course content player with video, audio, and exercises
 */

export class CoursePlayer {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            autoplay: false,
            showControls: true,
            enableSubtitles: true,
            enableNotes: true,
            enableProgress: true,
            ...options
        };

        this.currentLesson = null;
        this.progress = 0;
        this.isPlaying = false;
    }

    /**
     * Initialize course player
     */
    async initialize() {
        try {
            console.log('🎥 Initializing course player...');

            // Render player interface
            this.render();

            // Setup event listeners
            this.setupEventListeners();

            console.log('✅ Course player initialized');

        } catch (error) {
            console.error('❌ Course player initialization failed:', error);
            throw error;
        }
    }

    /**
     * Render player interface
     */
    render() {
        const playerHTML = `
            <div class="course-player">
                <div class="player-header">
                    <h2 class="lesson-title">Cargando lección...</h2>
                    <div class="lesson-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <span class="progress-text">0%</span>
                    </div>
                </div>

                <div class="player-content">
                    <div class="video-container">
                        <div class="video-placeholder">
                            <i class="ph ph-play-circle" aria-hidden="true"></i>
                            <span>Reproductor de video próximamente</span>
                        </div>
                    </div>

                    <div class="player-controls">
                        <button class="btn btn-primary" id="play-pause-btn">
                            <i class="ph ph-play" aria-hidden="true"></i>
                            <span>Reproducir</span>
                        </button>
                        
                        <div class="time-display">
                            <span id="current-time">00:00</span>
                            <span>/</span>
                            <span id="total-time">00:00</span>
                        </div>

                        <button class="btn btn-ghost" id="subtitles-btn">
                            <i class="ph ph-closed-captioning" aria-hidden="true"></i>
                            <span>Subtítulos</span>
                        </button>

                        <button class="btn btn-ghost" id="notes-btn">
                            <i class="ph ph-note" aria-hidden="true"></i>
                            <span>Notas</span>
                        </button>
                    </div>
                </div>

                <div class="player-sidebar">
                    <div class="lesson-notes" id="lesson-notes" style="display: none;">
                        <h3>Notas de la Lección</h3>
                        <textarea placeholder="Escribe tus notas aquí..."></textarea>
                        <button class="btn btn-primary btn-small">Guardar Notas</button>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = playerHTML;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const playPauseBtn = document.getElementById('play-pause-btn');
        const subtitlesBtn = document.getElementById('subtitles-btn');
        const notesBtn = document.getElementById('notes-btn');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }

        if (subtitlesBtn) {
            subtitlesBtn.addEventListener('click', () => this.toggleSubtitles());
        }

        if (notesBtn) {
            notesBtn.addEventListener('click', () => this.toggleNotes());
        }
    }

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;

        const playPauseBtn = document.getElementById('play-pause-btn');
        const icon = playPauseBtn.querySelector('i');
        const text = playPauseBtn.querySelector('span');

        if (this.isPlaying) {
            icon.className = 'ph ph-pause';
            text.textContent = 'Pausar';
        } else {
            icon.className = 'ph ph-play';
            text.textContent = 'Reproducir';
        }

        console.log(this.isPlaying ? '▶️ Playing' : '⏸️ Paused');
    }

    /**
     * Toggle subtitles
     */
    toggleSubtitles() {
        console.log('📝 Subtitles toggled');
        // Subtitle functionality to be implemented
    }

    /**
     * Toggle notes panel
     */
    toggleNotes() {
        const notesPanel = document.getElementById('lesson-notes');
        if (notesPanel) {
            const isVisible = notesPanel.style.display !== 'none';
            notesPanel.style.display = isVisible ? 'none' : 'block';
        }
    }

    /**
     * Load lesson content with container service
     */
    async loadLesson(lessonId) {
        try {
            console.log('📚 Loading lesson:', lessonId);

            // Show loading state
            this.showLoadingState();

            // Fetch video metadata and signed URL from the API
            const response = await fetch('/api/video/signed-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({ 
                    videoKey: `courses/lesson-${lessonId}/video.mp4` 
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch signed URL: ${response.statusText}`);
            }

            const { signedUrl } = await response.json();

            // Create lesson object with enhanced metadata
            this.currentLesson = {
                id: lessonId,
                title: `Lección ${lessonId}`,
                duration: 300, // 5 minutes
                videoUrl: signedUrl,
                subtitles: `courses/lesson-${lessonId}/subtitles.vtt`,
                thumbnail: `courses/lesson-${lessonId}/thumbnail.jpg`
            };

            // Update UI
            this.updateLessonUI();

            // Initialize advanced video player with container service features
            await this.initializeVideoPlayer();

            console.log('✅ Lesson loaded with container service');

        } catch (error) {
            console.error('❌ Failed to load lesson:', error);
            this.showErrorState(error.message);
            throw error;
        }
    }

    /**
     * Get authentication token
     */
    async getAuthToken() {
        // Get token from Auth0 or local storage
        return localStorage.getItem('auth_token') || '';
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
            videoContainer.innerHTML = `
                <div class="video-loading">
                    <div class="loading-spinner"></div>
                    <span>Cargando video...</span>
                </div>
            `;
        }
    }

    /**
     * Show error state
     */
    showErrorState(message) {
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
            videoContainer.innerHTML = `
                <div class="video-error">
                    <i class="ph ph-warning-circle" aria-hidden="true"></i>
                    <span>Error: ${message}</span>
                    <button class="btn btn-primary" onclick="location.reload()">Reintentar</button>
                </div>
            `;
        }
    }

    /**
     * Update lesson UI
     */
    updateLessonUI() {
        const titleElement = document.querySelector('.lesson-title');
        if (titleElement) {
            titleElement.textContent = this.currentLesson.title;
        }
    }

    /**
     * Initialize advanced video player with container service
     */
    async initializeVideoPlayer() {
        const videoContainer = document.querySelector('.video-container');
        if (!videoContainer || !this.currentLesson) return;

        // Create advanced video element with container service features
        const videoHTML = `
            <video 
                id="course-video" 
                class="video-player"
                preload="metadata"
                crossorigin="anonymous"
                playsinline
                style="width: 100%; height: auto;"
            >
                <source src="${this.currentLesson.videoUrl}" type="video/mp4">
                <track 
                    kind="subtitles" 
                    src="${this.currentLesson.subtitles}" 
                    srclang="es" 
                    label="Español"
                    default
                >
                Tu navegador no soporta el elemento video.
            </video>
            <div class="video-overlay">
                <div class="video-controls-overlay">
                    <button class="play-overlay-btn">
                        <i class="ph ph-play-circle" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `;

        videoContainer.innerHTML = videoHTML;

        // Setup video event listeners
        this.setupVideoEventListeners();

        // Initialize adaptive streaming if supported
        this.initializeAdaptiveStreaming();
    }

    /**
     * Setup video event listeners
     */
    setupVideoEventListeners() {
        const video = document.getElementById('course-video');
        if (!video) return;

        // Progress tracking
        video.addEventListener('timeupdate', () => {
            if (video.duration) {
                const progress = (video.currentTime / video.duration) * 100;
                this.updateProgress(progress);
            }
        });

        // Play/pause state
        video.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
        });

        video.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
        });

        // Error handling
        video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            this.showErrorState('Error al cargar el video');
        });

        // Metadata loaded
        video.addEventListener('loadedmetadata', () => {
            this.updateTimeDisplay();
        });

        // Overlay play button
        const playOverlayBtn = document.querySelector('.play-overlay-btn');
        if (playOverlayBtn) {
            playOverlayBtn.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }
    }

    /**
     * Initialize adaptive streaming
     */
    initializeAdaptiveStreaming() {
        const video = document.getElementById('course-video');
        if (!video) return;

        // Check for HLS support (for future implementation)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            console.log('✅ HLS supported');
        }

        // Check for DASH support (for future implementation)
        if (video.canPlayType('application/dash+xml')) {
            console.log('✅ DASH supported');
        }

        // Implement quality selection based on network conditions
        this.adaptVideoQuality();
    }

    /**
     * Adapt video quality based on network conditions
     */
    adaptVideoQuality() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const effectiveType = connection.effectiveType;

            console.log(`📶 Network: ${effectiveType}`);

            // Future: Implement quality switching based on network
            // For now, log the network type for monitoring
        }
    }

    /**
     * Update play button state
     */
    updatePlayButton() {
        const playBtn = document.getElementById('play-pause-btn');
        const playIcon = playBtn?.querySelector('i');
        const playText = playBtn?.querySelector('span');

        if (this.isPlaying) {
            playIcon?.setAttribute('class', 'ph ph-pause');
            if (playText) playText.textContent = 'Pausar';
        } else {
            playIcon?.setAttribute('class', 'ph ph-play');
            if (playText) playText.textContent = 'Reproducir';
        }
    }

    /**
     * Update time display
     */
    updateTimeDisplay() {
        const video = document.getElementById('course-video');
        const currentTimeEl = document.getElementById('current-time');
        const totalTimeEl = document.getElementById('total-time');

        if (video && currentTimeEl && totalTimeEl) {
            currentTimeEl.textContent = this.formatTime(video.currentTime || 0);
            totalTimeEl.textContent = this.formatTime(video.duration || 0);
        }
    }

    /**
     * Format time in MM:SS format
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Update progress
     */
    updateProgress(percentage) {
        this.progress = Math.max(0, Math.min(100, percentage));

        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');

        if (progressFill) {
            progressFill.style.width = `${this.progress}%`;
        }

        if (progressText) {
            progressText.textContent = `${Math.round(this.progress)}%`;
        }
    }

    /**
     * Get current progress
     */
    getProgress() {
        return this.progress;
    }

    /**
     * Destroy player
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }

        this.currentLesson = null;
        this.progress = 0;
        this.isPlaying = false;
    }
}

// Export for use in other modules
export default CoursePlayer;