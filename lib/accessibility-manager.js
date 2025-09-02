/**
 * Accessibility Manager for Digital English Academy
 * Handles keyboard navigation, screen reader support, and accessibility enhancements
 */

export class AccessibilityManager {
    constructor() {
        this.isInitialized = false;
        this.focusHistory = [];
        this.skipLinks = [];
        this.liveRegions = new Map();
        this.focusTraps = new Map();
        this.keyboardShortcuts = new Map();
        this.announcements = [];

        // Settings
        this.settings = {
            enableKeyboardNavigation: true,
            enableScreenReaderSupport: true,
            enableHighContrast: false,
            enableReducedMotion: false,
            announceRouteChanges: true,
            focusOutlineVisible: true,
            keyboardShortcutsEnabled: true
        };

        // Accessibility preferences
        this.preferences = {
            fontSize: 'normal', // small, normal, large, extra-large
            contrast: 'normal', // normal, high
            motion: 'normal', // normal, reduced
            screenReader: false
        };

        // Focus management
        this.focusManager = {
            currentFocus: null,
            previousFocus: null,
            focusStack: [],
            trapStack: []
        };

        // Keyboard navigation state
        this.keyboardNavigation = {
            isActive: false,
            lastKeyboardEvent: null,
            focusVisible: false
        };
    }

    /**
     * Initialize the accessibility manager
     */
    initialize(config = {}) {
        if (this.isInitialized) return;

        this.settings = { ...this.settings, ...config };

        // Detect user preferences
        this.detectUserPreferences();

        // Set up keyboard navigation
        if (this.settings.enableKeyboardNavigation) {
            this.setupKeyboardNavigation();
        }

        // Set up screen reader support
        if (this.settings.enableScreenReaderSupport) {
            this.setupScreenReaderSupport();
        }

        // Create skip links
        this.createSkipLinks();

        // Set up ARIA live regions
        this.setupLiveRegions();

        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Set up focus management
        this.setupFocusManagement();

        // Apply user preferences
        this.applyAccessibilityPreferences();

        // Set up route change announcements
        if (this.settings.announceRouteChanges) {
            this.setupRouteChangeAnnouncements();
        }

        this.isInitialized = true;
        console.log('♿ Accessibility Manager initialized');
    }

    /**
     * Detect user accessibility preferences
     */
    detectUserPreferences() {
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.preferences.motion = 'reduced';
            this.settings.enableReducedMotion = true;
        }

        // Check for high contrast preference
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            this.preferences.contrast = 'high';
            this.settings.enableHighContrast = true;
        }

        // Check for screen reader
        this.preferences.screenReader = this.detectScreenReader();

        // Load saved preferences
        this.loadSavedPreferences();

        console.log('🔍 Accessibility preferences detected:', this.preferences);
    }

    /**
     * Detect screen reader usage
     */
    detectScreenReader() {
        // Check for common screen reader indicators
        const indicators = [
            navigator.userAgent.includes('NVDA'),
            navigator.userAgent.includes('JAWS'),
            navigator.userAgent.includes('VoiceOver'),
            window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
            'speechSynthesis' in window
        ];

        return indicators.some(indicator => indicator);
    }

    /**
     * Load saved accessibility preferences
     */
    loadSavedPreferences() {
        const saved = localStorage.getItem('dea_accessibility_preferences');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                this.preferences = { ...this.preferences, ...preferences };
            } catch (error) {
                console.warn('Failed to load accessibility preferences:', error);
            }
        }
    }

    /**
     * Save accessibility preferences
     */
    savePreferences() {
        try {
            localStorage.setItem('dea_accessibility_preferences', JSON.stringify(this.preferences));
            console.log('💾 Accessibility preferences saved');
        } catch (error) {
            console.warn('Failed to save accessibility preferences:', error);
        }
    }

    /**
     * Set up keyboard navigation enhancements
     */
    setupKeyboardNavigation() {
        // Track keyboard usage
        document.addEventListener('keydown', (event) => {
            this.keyboardNavigation.isActive = true;
            this.keyboardNavigation.lastKeyboardEvent = event;
            this.keyboardNavigation.focusVisible = true;

            this.handleKeyboardNavigation(event);
        });

        // Track mouse usage to hide focus outlines when not needed
        document.addEventListener('mousedown', () => {
            this.keyboardNavigation.focusVisible = false;
            document.body.classList.remove('keyboard-navigation');
        });

        // Add keyboard navigation class when using keyboard
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        // Set up tab navigation improvements
        this.improveTabNavigation();

        console.log('⌨️ Keyboard navigation configured');
    }

    /**
     * Handle keyboard navigation events
     */
    handleKeyboardNavigation(event) {
        const { key, ctrlKey, altKey, shiftKey } = event;

        // Handle Tab navigation
        if (key === 'Tab') {
            this.handleTabNavigation(event);
        }

        // Handle Escape key
        if (key === 'Escape') {
            this.handleEscapeKey(event);
        }

        // Handle Enter and Space on interactive elements
        if (key === 'Enter' || key === ' ') {
            this.handleActivationKeys(event);
        }

        // Handle arrow keys for custom navigation
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            this.handleArrowNavigation(event);
        }

        // Handle keyboard shortcuts
        if (ctrlKey || altKey) {
            this.handleKeyboardShortcuts(event);
        }
    }

    /**
     * Handle Tab navigation
     */
    handleTabNavigation(event) {
        const activeElement = document.activeElement;

        // Store focus history
        if (activeElement && activeElement !== document.body) {
            this.focusHistory.push({
                element: activeElement,
                timestamp: Date.now(),
                url: window.location.href
            });

            // Keep history manageable
            if (this.focusHistory.length > 50) {
                this.focusHistory = this.focusHistory.slice(-50);
            }
        }

        // Handle focus traps
        if (this.focusManager.trapStack.length > 0) {
            const currentTrap = this.focusManager.trapStack[this.focusManager.trapStack.length - 1];
            if (!this.handleFocusTrap(event, currentTrap)) {
                event.preventDefault();
            }
        }
    }

    /**
     * Handle Escape key
     */
    handleEscapeKey(event) {
        // Close modals or focus traps
        if (this.focusManager.trapStack.length > 0) {
            const currentTrap = this.focusManager.trapStack.pop();
            this.releaseFocusTrap(currentTrap.id);
            event.preventDefault();
        }

        // Close dropdowns or menus
        const openDropdowns = document.querySelectorAll('[aria-expanded="true"]');
        openDropdowns.forEach(dropdown => {
            dropdown.setAttribute('aria-expanded', 'false');
            this.announce('Menú cerrado');
        });
    }

    /**
     * Handle activation keys (Enter/Space)
     */
    handleActivationKeys(event) {
        const target = event.target;

        // Handle custom interactive elements
        if (target.hasAttribute('role')) {
            const role = target.getAttribute('role');

            if (['button', 'link', 'menuitem', 'tab'].includes(role)) {
                if (event.key === 'Enter' || (event.key === ' ' && role === 'button')) {
                    target.click();
                    event.preventDefault();
                }
            }
        }

        // Handle elements with tabindex
        if (target.hasAttribute('tabindex') && target.tabIndex >= 0) {
            if (target.onclick || target.addEventListener) {
                target.click();
                event.preventDefault();
            }
        }
    }

    /**
     * Handle arrow key navigation
     */
    handleArrowNavigation(event) {
        const target = event.target;
        const parent = target.closest('[role="menu"], [role="menubar"], [role="tablist"], [role="listbox"]');

        if (parent) {
            this.handleArrowNavigationInContainer(event, parent);
        }
    }

    /**
     * Handle arrow navigation within containers
     */
    handleArrowNavigationInContainer(event, container) {
        const role = container.getAttribute('role');
        const items = container.querySelectorAll('[role="menuitem"], [role="tab"], [role="option"]');
        const currentIndex = Array.from(items).indexOf(event.target);

        if (currentIndex === -1) return;

        let nextIndex;

        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                nextIndex = (currentIndex + 1) % items.length;
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                nextIndex = (currentIndex - 1 + items.length) % items.length;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = items.length - 1;
                break;
            default:
                return;
        }

        if (nextIndex !== undefined && items[nextIndex]) {
            items[nextIndex].focus();
            event.preventDefault();
        }
    }

    /**
     * Improve tab navigation
     */
    improveTabNavigation() {
        // Ensure all interactive elements are focusable
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');

        interactiveElements.forEach(element => {
            if (!element.hasAttribute('tabindex') && element.tabIndex < 0) {
                element.tabIndex = 0;
            }
        });

        // Add focus indicators
        this.addFocusIndicators();
    }

    /**
     * Add visual focus indicators
     */
    addFocusIndicators() {
        if (document.querySelector('#accessibility-focus-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'accessibility-focus-styles';
        styles.textContent = `
            .keyboard-navigation *:focus {
                outline: 2px solid #0066cc !important;
                outline-offset: 2px !important;
            }
            
            .keyboard-navigation button:focus,
            .keyboard-navigation a:focus,
            .keyboard-navigation input:focus,
            .keyboard-navigation select:focus,
            .keyboard-navigation textarea:focus {
                box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.3) !important;
            }
            
            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: #000;
                color: #fff;
                padding: 8px;
                text-decoration: none;
                border-radius: 4px;
                z-index: 10000;
                transition: top 0.3s;
            }
            
            .skip-link:focus {
                top: 6px;
            }
            
            .sr-only {
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                padding: 0 !important;
                margin: -1px !important;
                overflow: hidden !important;
                clip: rect(0, 0, 0, 0) !important;
                white-space: nowrap !important;
                border: 0 !important;
            }
            
            .high-contrast {
                filter: contrast(150%) !important;
            }
            
            .reduced-motion * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
            
            .large-text {
                font-size: 1.2em !important;
            }
            
            .extra-large-text {
                font-size: 1.5em !important;
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Create skip links for better navigation
     */
    createSkipLinks() {
        const skipLinksContainer = document.createElement('div');
        skipLinksContainer.className = 'skip-links';
        skipLinksContainer.setAttribute('aria-label', 'Enlaces de navegación rápida');

        const skipLinks = [
            { href: '#main-content', text: 'Saltar al contenido principal' },
            { href: '#navigation', text: 'Saltar a la navegación' },
            { href: '#footer', text: 'Saltar al pie de página' }
        ];

        skipLinks.forEach(link => {
            const skipLink = document.createElement('a');
            skipLink.href = link.href;
            skipLink.className = 'skip-link';
            skipLink.textContent = link.text;

            skipLink.addEventListener('click', (event) => {
                event.preventDefault();
                const target = document.querySelector(link.href);
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                    this.announce(`Navegado a ${link.text.toLowerCase()}`);
                }
            });

            skipLinksContainer.appendChild(skipLink);
            this.skipLinks.push(skipLink);
        });

        document.body.insertBefore(skipLinksContainer, document.body.firstChild);
        console.log('🔗 Skip links created');
    }

    /**
     * Set up screen reader support
     */
    setupScreenReaderSupport() {
        // Create ARIA live regions
        this.createLiveRegions();

        // Enhance existing elements with ARIA attributes
        this.enhanceWithARIA();

        // Set up page structure announcements
        this.setupPageStructureAnnouncements();

        console.log('🔊 Screen reader support configured');
    }

    /**
     * Create ARIA live regions
     */
    createLiveRegions() {
        // Polite announcements (non-interrupting)
        const politeRegion = document.createElement('div');
        politeRegion.id = 'aria-live-polite';
        politeRegion.setAttribute('aria-live', 'polite');
        politeRegion.setAttribute('aria-atomic', 'true');
        politeRegion.className = 'sr-only';
        document.body.appendChild(politeRegion);
        this.liveRegions.set('polite', politeRegion);

        // Assertive announcements (interrupting)
        const assertiveRegion = document.createElement('div');
        assertiveRegion.id = 'aria-live-assertive';
        assertiveRegion.setAttribute('aria-live', 'assertive');
        assertiveRegion.setAttribute('aria-atomic', 'true');
        assertiveRegion.className = 'sr-only';
        document.body.appendChild(assertiveRegion);
        this.liveRegions.set('assertive', assertiveRegion);

        // Status announcements
        const statusRegion = document.createElement('div');
        statusRegion.id = 'aria-live-status';
        statusRegion.setAttribute('role', 'status');
        statusRegion.setAttribute('aria-live', 'polite');
        statusRegion.className = 'sr-only';
        document.body.appendChild(statusRegion);
        this.liveRegions.set('status', statusRegion);

        console.log('📢 ARIA live regions created');
    }

    /**
     * Set up page structure announcements
     */
    setupPageStructureAnnouncements() {
        // Announce page title changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.target === document.head) {
                    const titleElement = document.querySelector('title');
                    if (titleElement) {
                        this.announce(`Page loaded: ${titleElement.textContent}`, 'polite');
                    }
                }
            });
        });

        observer.observe(document.head, {
            childList: true,
            subtree: true
        });

        // Announce main content changes
        const mainContent = document.querySelector('main, [role="main"], #main-content');
        if (mainContent) {
            const contentObserver = new MutationObserver(() => {
                this.announce('Content updated', 'polite');
            });

            contentObserver.observe(mainContent, {
                childList: true,
                subtree: true
            });
        }

        console.log('📋 Page structure announcements configured');
    }

    /**
     * Enhance existing elements with ARIA attributes
     */
    enhanceWithARIA() {
        // Add landmarks
        this.addLandmarks();

        // Enhance form elements
        this.enhanceFormElements();

        // Enhance interactive elements
        this.enhanceInteractiveElements();

        // Add descriptive text
        this.addDescriptiveText();
    }

    /**
     * Add ARIA landmarks
     */
    addLandmarks() {
        // Main content
        const main = document.querySelector('main') || document.querySelector('#main-content');
        if (main && !main.hasAttribute('role')) {
            main.setAttribute('role', 'main');
            main.setAttribute('aria-label', 'Contenido principal');
        }

        // Navigation
        const nav = document.querySelector('nav') || document.querySelector('.navigation');
        if (nav && !nav.hasAttribute('role')) {
            nav.setAttribute('role', 'navigation');
            nav.setAttribute('aria-label', 'Navegación principal');
        }

        // Header
        const header = document.querySelector('header') || document.querySelector('.site-header');
        if (header && !header.hasAttribute('role')) {
            header.setAttribute('role', 'banner');
            header.setAttribute('aria-label', 'Encabezado del sitio');
        }

        // Footer
        const footer = document.querySelector('footer') || document.querySelector('.site-footer');
        if (footer && !footer.hasAttribute('role')) {
            footer.setAttribute('role', 'contentinfo');
            footer.setAttribute('aria-label', 'Información del sitio');
        }
    }

    /**
     * Enhance form elements
     */
    enhanceFormElements() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            // Add form labels
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (!input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) {
                    const label = form.querySelector(`label[for="${input.id}"]`);
                    if (!label && input.placeholder) {
                        input.setAttribute('aria-label', input.placeholder);
                    }
                }

                // Add required field indicators
                if (input.hasAttribute('required')) {
                    input.setAttribute('aria-required', 'true');

                    // Add visual indicator
                    if (!input.parentNode.querySelector('.required-indicator')) {
                        const indicator = document.createElement('span');
                        indicator.className = 'required-indicator';
                        indicator.textContent = ' *';
                        indicator.setAttribute('aria-label', 'campo requerido');
                        input.parentNode.appendChild(indicator);
                    }
                }
            });

            // Add form validation messages
            this.setupFormValidation(form);
        });
    }

    /**
     * Set up form validation with accessibility
     */
    setupFormValidation(form) {
        const inputs = form.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            input.addEventListener('invalid', (event) => {
                const message = event.target.validationMessage;
                this.announceFormError(event.target, message);
            });

            input.addEventListener('input', () => {
                if (input.checkValidity()) {
                    this.clearFormError(input);
                }
            });
        });
    }

    /**
     * Announce form validation errors
     */
    announceFormError(input, message) {
        // Create or update error message
        let errorElement = document.querySelector(`#${input.id}-error`);
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = `${input.id}-error`;
            errorElement.className = 'form-error';
            errorElement.setAttribute('role', 'alert');
            input.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        input.setAttribute('aria-describedby', errorElement.id);
        input.setAttribute('aria-invalid', 'true');

        // Announce to screen readers
        this.announce(`Error en ${input.name || input.id}: ${message}`, 'assertive');
    }

    /**
     * Clear form validation errors
     */
    clearFormError(input) {
        const errorElement = document.querySelector(`#${input.id}-error`);
        if (errorElement) {
            errorElement.remove();
        }

        input.removeAttribute('aria-describedby');
        input.removeAttribute('aria-invalid');
    }

    /**
     * Enhance interactive elements
     */
    enhanceInteractiveElements() {
        // Buttons without proper labels
        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        buttons.forEach(button => {
            if (!button.textContent.trim()) {
                const icon = button.querySelector('i, svg, .icon');
                if (icon) {
                    button.setAttribute('aria-label', 'Botón');
                }
            }
        });

        // Links without proper labels
        const links = document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])');
        links.forEach(link => {
            if (!link.textContent.trim()) {
                const icon = link.querySelector('i, svg, .icon');
                if (icon) {
                    link.setAttribute('aria-label', 'Enlace');
                }
            }
        });

        // Add role and state information
        const toggleButtons = document.querySelectorAll('[data-toggle]');
        toggleButtons.forEach(button => {
            if (!button.hasAttribute('aria-expanded')) {
                button.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /**
     * Add descriptive text for complex elements
     */
    addDescriptiveText() {
        // Images without alt text
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach(img => {
            img.setAttribute('alt', 'Imagen');
        });

        // Decorative images
        const decorativeImages = document.querySelectorAll('img[alt=""], img.decorative');
        decorativeImages.forEach(img => {
            img.setAttribute('role', 'presentation');
        });

        // Complex widgets
        const widgets = document.querySelectorAll('[data-widget]');
        widgets.forEach(widget => {
            if (!widget.hasAttribute('aria-label')) {
                const widgetType = widget.dataset.widget;
                widget.setAttribute('aria-label', `Widget de ${widgetType}`);
            }
        });
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        // Common shortcuts
        this.keyboardShortcuts.set('Alt+1', () => {
            const main = document.querySelector('main, #main-content');
            if (main) {
                main.focus();
                this.announce('Navegado al contenido principal');
            }
        });

        this.keyboardShortcuts.set('Alt+2', () => {
            const nav = document.querySelector('nav, .navigation');
            if (nav) {
                const firstLink = nav.querySelector('a, button');
                if (firstLink) {
                    firstLink.focus();
                    this.announce('Navegado al menú principal');
                }
            }
        });

        this.keyboardShortcuts.set('Alt+3', () => {
            const search = document.querySelector('input[type="search"], #search');
            if (search) {
                search.focus();
                this.announce('Navegado al campo de búsqueda');
            }
        });

        // Help shortcut
        this.keyboardShortcuts.set('Alt+H', () => {
            this.showKeyboardShortcutsHelp();
        });

        console.log('⌨️ Keyboard shortcuts configured');
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        const shortcut = this.getShortcutKey(event);
        const handler = this.keyboardShortcuts.get(shortcut);

        if (handler) {
            event.preventDefault();
            handler();
        }
    }

    /**
     * Get shortcut key combination
     */
    getShortcutKey(event) {
        const parts = [];

        if (event.ctrlKey) parts.push('Ctrl');
        if (event.altKey) parts.push('Alt');
        if (event.shiftKey) parts.push('Shift');

        parts.push(event.key);

        return parts.join('+');
    }

    /**
     * Show keyboard shortcuts help
     */
    showKeyboardShortcutsHelp() {
        const helpContent = `
            Atajos de teclado disponibles:
            Alt+1: Ir al contenido principal
            Alt+2: Ir al menú de navegación
            Alt+3: Ir al campo de búsqueda
            Alt+H: Mostrar esta ayuda
            Tab: Navegar entre elementos
            Escape: Cerrar menús o diálogos
        `;

        this.announce(helpContent, 'polite');
        console.log('📋 Keyboard shortcuts help displayed');
    }

    /**
     * Set up focus management
     */
    setupFocusManagement() {
        // Track focus changes
        document.addEventListener('focusin', (event) => {
            this.focusManager.previousFocus = this.focusManager.currentFocus;
            this.focusManager.currentFocus = event.target;
        });

        // Handle focus loss
        document.addEventListener('focusout', (event) => {
            // Delay to allow new focus to be set
            setTimeout(() => {
                if (!document.activeElement || document.activeElement === document.body) {
                    this.handleFocusLoss();
                }
            }, 10);
        });
    }

    /**
     * Handle focus loss
     */
    handleFocusLoss() {
        // If focus is lost, try to restore it to a logical place
        if (this.focusManager.previousFocus && this.focusManager.previousFocus.isConnected) {
            this.focusManager.previousFocus.focus();
        } else {
            // Focus the main content area
            const main = document.querySelector('main, #main-content');
            if (main) {
                main.focus();
            }
        }
    }

    /**
     * Create focus trap for modals/dialogs
     */
    createFocusTrap(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Focus trap container not found: ${containerId}`);
            return null;
        }

        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        const trap = {
            id: containerId,
            container,
            firstFocusable,
            lastFocusable,
            previousFocus: document.activeElement,
            options
        };

        this.focusTraps.set(containerId, trap);
        this.focusManager.trapStack.push(trap);

        // Focus the first element
        if (firstFocusable) {
            firstFocusable.focus();
        }

        console.log(`🔒 Focus trap created for: ${containerId}`);
        return trap;
    }

    /**
     * Handle focus trap navigation
     */
    handleFocusTrap(event, trap) {
        if (event.key !== 'Tab') return true;

        const { firstFocusable, lastFocusable } = trap;

        if (event.shiftKey) {
            // Shift+Tab
            if (document.activeElement === firstFocusable) {
                lastFocusable.focus();
                return false;
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                firstFocusable.focus();
                return false;
            }
        }

        return true;
    }

    /**
     * Release focus trap
     */
    releaseFocusTrap(containerId) {
        const trap = this.focusTraps.get(containerId);
        if (!trap) return;

        // Remove from stack
        const stackIndex = this.focusManager.trapStack.findIndex(t => t.id === containerId);
        if (stackIndex > -1) {
            this.focusManager.trapStack.splice(stackIndex, 1);
        }

        // Restore previous focus
        if (trap.previousFocus && trap.previousFocus.isConnected) {
            trap.previousFocus.focus();
        }

        this.focusTraps.delete(containerId);
        console.log(`🔓 Focus trap released for: ${containerId}`);
    }

    /**
     * Set up route change announcements
     */
    setupRouteChangeAnnouncements() {
        // Listen for route changes
        let currentUrl = window.location.href;

        const announceRouteChange = () => {
            const newUrl = window.location.href;
            if (newUrl !== currentUrl) {
                currentUrl = newUrl;

                // Get page title or heading
                const title = document.title || document.querySelector('h1')?.textContent || 'Nueva página';
                this.announce(`Navegado a: ${title}`, 'polite');

                // Focus the main content
                setTimeout(() => {
                    const main = document.querySelector('main, #main-content, h1');
                    if (main) {
                        main.focus();
                    }
                }, 100);
            }
        };

        // Listen for history changes
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function (...args) {
            originalPushState.apply(history, args);
            setTimeout(announceRouteChange, 0);
        };

        history.replaceState = function (...args) {
            originalReplaceState.apply(history, args);
            setTimeout(announceRouteChange, 0);
        };

        window.addEventListener('popstate', announceRouteChange);
    }

    /**
     * Announce message to screen readers
     */
    announce(message, priority = 'polite') {
        const region = this.liveRegions.get(priority);
        if (!region) {
            console.warn(`Live region not found: ${priority}`);
            return;
        }

        // Clear previous message
        region.textContent = '';

        // Add new message after a brief delay
        setTimeout(() => {
            region.textContent = message;

            // Store announcement
            this.announcements.push({
                message,
                priority,
                timestamp: Date.now()
            });

            // Keep announcements history manageable
            if (this.announcements.length > 20) {
                this.announcements = this.announcements.slice(-20);
            }
        }, 100);

        console.log(`📢 Announced (${priority}): ${message}`);
    }

    /**
     * Apply accessibility preferences
     */
    applyAccessibilityPreferences() {
        const body = document.body;

        // Apply font size
        body.classList.remove('large-text', 'extra-large-text');
        if (this.preferences.fontSize === 'large') {
            body.classList.add('large-text');
        } else if (this.preferences.fontSize === 'extra-large') {
            body.classList.add('extra-large-text');
        }

        // Apply contrast
        body.classList.toggle('high-contrast', this.preferences.contrast === 'high');

        // Apply motion preference
        body.classList.toggle('reduced-motion', this.preferences.motion === 'reduced');

        console.log('🎨 Accessibility preferences applied');
    }

    /**
     * Update accessibility preference
     */
    updatePreference(key, value) {
        this.preferences[key] = value;
        this.applyAccessibilityPreferences();
        this.savePreferences();

        this.announce(`Preferencia actualizada: ${key} cambiado a ${value}`);
    }

    /**
     * Get accessibility status
     */
    getAccessibilityStatus() {
        return {
            isInitialized: this.isInitialized,
            preferences: this.preferences,
            settings: this.settings,
            keyboardNavigation: this.keyboardNavigation,
            focusTraps: Array.from(this.focusTraps.keys()),
            recentAnnouncements: this.announcements.slice(-5)
        };
    }

    /**
     * Clean up accessibility manager
     */
    cleanup() {
        // Release all focus traps
        this.focusTraps.forEach((trap, id) => {
            this.releaseFocusTrap(id);
        });

        // Remove live regions
        this.liveRegions.forEach(region => {
            if (region.parentNode) {
                region.parentNode.removeChild(region);
            }
        });

        // Remove skip links
        this.skipLinks.forEach(link => {
            if (link.parentNode) {
                link.parentNode.removeChild(link);
            }
        });

        this.isInitialized = false;
        console.log('♿ Accessibility Manager cleaned up');
    }
}

// Export singleton instance
export const accessibilityManager = new AccessibilityManager();