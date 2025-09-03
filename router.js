import { enhance } from './interactions.js';
import { focusMain } from './utils.js';
import { renderHome } from './views/home.js';
import { renderCourses } from './views/courses.js';
import { renderLesson } from './views/lesson.js';
import { renderCommunity } from './views/community.js';
import { renderProfile } from './views/profile.js';
import { renderNotFound } from './views/notfound.js';
import { renderPrivacy } from './views/privacy.js';
import { renderTerms } from './views/terms.js';
import { renderContact } from './views/contact.js';
import { renderHelp } from './views/help.js';

// Enhanced Router with integrated systems
class EnhancedRouter {
  constructor() {
    this.routes = {
      '/': {
        renderer: renderHome,
        title: 'Inicio - Digital English Academy',
        requiresAuth: false,
        preload: ['home-assets']
      },
      '/courses': {
        renderer: renderCourses,
        title: 'Cursos - Digital English Academy',
        requiresAuth: false,
        preload: ['course-assets']
      },
      '/lesson': {
        renderer: renderLesson,
        title: 'Lección - Digital English Academy',
        requiresAuth: true,
        preload: ['lesson-assets', 'video-player']
      },
      '/premium-lesson': {
        renderer: renderLesson,
        title: 'Lección Premium - Digital English Academy',
        requiresAuth: true,
        requiresPremium: true,
        preload: ['lesson-assets', 'video-player']
      },
      '/community': {
        renderer: renderCommunity,
        title: 'Comunidad - Digital English Academy',
        requiresAuth: true,
        preload: ['community-assets']
      },
      '/profile': {
        renderer: renderProfile,
        title: 'Perfil - Digital English Academy',
        requiresAuth: true,
        preload: ['profile-assets']
      },
      '/privacy': {
        renderer: renderPrivacy,
        title: 'Privacidad - FluentLeap',
        requiresAuth: false
      },
      '/terms': {
        renderer: renderTerms,
        title: 'Términos y Condiciones - FluentLeap',
        requiresAuth: false
      },
      '/contact': {
        renderer: renderContact,
        title: 'Contacto - FluentLeap',
        requiresAuth: false
      },
      '/help': {
        renderer: renderHelp,
        title: 'Ayuda - FluentLeap',
        requiresAuth: false
      },
      '/admin': {
        renderer: () => import('./views/admin.js').then(m => m.renderAdmin()),
        title: 'Administración - Digital English Academy',
        requiresAuth: true,
        requiredRoles: ['admin'],
        preload: ['admin-assets']
      },
      '/teacher': {
        renderer: () => import('./views/teacher.js').then(m => m.renderTeacher()),
        title: 'Panel Docente - Digital English Academy',
        requiresAuth: true,
        requiredRoles: ['teacher', 'admin'],
        preload: ['teacher-assets']
      },
      '/moderator': {
        renderer: () => import('./views/moderator.js').then(m => m.renderModerator()),
        title: 'Moderación - Digital English Academy',
        requiresAuth: true,
        requiredRoles: ['moderator', 'admin'],
        preload: ['moderator-assets']
      },
      '/logout': {
        renderer: async () => await this.renderLogout(),
        title: 'Cerrando Sesión - Digital English Academy',
        requiresAuth: false,
        skipLayout: true
      }
    };

    this.currentRoute = null;
    this.previousRoute = null;
    this.navigationStartTime = null;
    this.routeGuards = [];
    this.routeMiddleware = [];
    this.isInitialized = false;

    // System integrations
    this.errorBoundary = null;
    this.performanceMonitor = null;
    this.accessibilityManager = null;
  }

  /**
   * Initialize enhanced router with system integrations
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Import and initialize integrated systems
      await this.initializeSystemIntegrations();

      // Set up route guards
      this.setupRouteGuards();

      // Set up navigation tracking
      this.setupNavigationTracking();

      // Set up error handling
      this.setupErrorHandling();

      this.isInitialized = true;
      console.log('🧭 Enhanced Router initialized');

    } catch (error) {
      console.error('❌ Router initialization failed:', error);

      // Fallback to basic router functionality
      this.isInitialized = true;
    }
  }

  /**
   * Check if user is authenticated
   */
  async checkAuthentication() {
    try {
      if (window.deaAuth?.manager) {
        return window.deaAuth.manager.isUserAuthenticated();
      }

      if (window.deaAuth?.client) {
        return await window.deaAuth.client.isAuthenticated();
      }

      return false;
    } catch (error) {
      console.error('❌ Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Check if user has required roles
   */
  async checkUserRoles(requiredRoles) {
    try {
      if (!window.deaAuth?.manager) {
        return false;
      }

      return await window.deaAuth.manager.hasAnyRole(requiredRoles);
    } catch (error) {
      console.error('❌ Role check failed:', error);
      return false;
    }
  }

  /**
   * Check if user has premium access
   */
  async checkPremiumAccess() {
    try {
      if (!window.deaAuth?.manager) {
        return false;
      }

      return await window.deaAuth.manager.hasPremiumAccess();
    } catch (error) {
      console.error('❌ Premium access check failed:', error);
      return false;
    }
  }

  /**
   * Show authentication required message
   */
  showAuthenticationRequired() {
    const message = `
      <div class="auth-required-message">
        <div class="message-content">
          <h2>Iniciar Sesión Requerido</h2>
          <p>Necesitas iniciar sesión para acceder a esta página.</p>
          <div class="message-actions">
            <button onclick="window.deaAuth?.login?.()" class="btn btn-primary">
              Iniciar Sesión
            </button>
            <button onclick="this.closest('.auth-required-message').remove()" class="btn btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    `;

    this.showMessage(message);

    // Announce to screen readers
    if (this.accessibilityManager) {
      this.accessibilityManager.announce('Se requiere iniciar sesión para acceder a esta página', 'assertive');
    }
  }

  /**
   * Show access denied message
   */
  showAccessDenied(requiredRoles) {
    const roleNames = {
      admin: 'Administrador',
      teacher: 'Docente',
      moderator: 'Moderador',
      student: 'Estudiante'
    };

    const roleList = requiredRoles.map(role => roleNames[role] || role).join(', ');

    const message = `
      <div class="access-denied-message">
        <div class="message-content">
          <h2>Acceso Denegado</h2>
          <p>No tienes los permisos necesarios para acceder a esta página.</p>
          <p><strong>Roles requeridos:</strong> ${roleList}</p>
          <div class="message-actions">
            <button onclick="history.back()" class="btn btn-primary">
              Volver
            </button>
            <button onclick="this.closest('.access-denied-message').remove()" class="btn btn-ghost">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    `;

    this.showMessage(message);

    // Announce to screen readers
    if (this.accessibilityManager) {
      this.accessibilityManager.announce('Acceso denegado. No tienes los permisos necesarios.', 'assertive');
    }
  }

  /**
   * Show premium required message
   */
  showPremiumRequired() {
    const message = `
      <div class="premium-required-message">
        <div class="message-content">
          <h2>Suscripción Premium Requerida</h2>
          <p>Esta función está disponible solo para usuarios Premium.</p>
          <div class="premium-benefits">
            <ul>
              <li>Acceso a lecciones avanzadas</li>
              <li>Contenido descargable</li>
              <li>Soporte prioritario</li>
              <li>Certificados de finalización</li>
            </ul>
          </div>
          <div class="message-actions">
            <button onclick="this.showPremiumUpgrade()" class="btn btn-primary">
              Actualizar a Premium
            </button>
            <button onclick="history.back()" class="btn btn-ghost">
              Volver
            </button>
          </div>
        </div>
      </div>
    `;

    this.showMessage(message);

    // Announce to screen readers
    if (this.accessibilityManager) {
      this.accessibilityManager.announce('Se requiere suscripción Premium para acceder a este contenido', 'assertive');
    }
  }

  /**
   * Show premium upgrade dialog
   */
  showPremiumUpgrade() {
    // This would integrate with Stripe for subscription management
    console.log('🔄 Redirecting to premium upgrade...');

    // For now, just navigate to a premium page
    this.navigate('/premium');
  }

  /**
   * Show message overlay
   */
  showMessage(messageHTML) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.auth-required-message, .access-denied-message, .premium-required-message');
    existingMessages.forEach(msg => msg.remove());

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'message-overlay';
    overlay.innerHTML = messageHTML;

    // Add styles
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const messageContent = overlay.querySelector('.message-content');
    if (messageContent) {
      messageContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
        margin: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;
    }

    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Handle successful authentication redirect
   */
  async handleAuthRedirect() {
    try {
      // Check for intended route
      const intendedRoute = sessionStorage.getItem('dea_intended_route');

      if (intendedRoute) {
        sessionStorage.removeItem('dea_intended_route');
        console.log('🔄 Redirecting to intended route:', intendedRoute);
        this.navigate(intendedRoute);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Auth redirect handling failed:', error);
      return false;
    }
  }

  /**
   * Initialize system integrations
   */
  async initializeSystemIntegrations() {
    try {
      // Import systems dynamically to avoid circular dependencies
      const [
        { errorBoundary },
        { performanceMonitor },
        { accessibilityManager }
      ] = await Promise.all([
        import('./lib/error-boundary.js').catch(() => ({ errorBoundary: null })),
        import('./lib/performance-monitor.js').catch(() => ({ performanceMonitor: null })),
        import('./lib/accessibility-manager.js').catch(() => ({ accessibilityManager: null }))
      ]);

      this.errorBoundary = errorBoundary;
      this.performanceMonitor = performanceMonitor;
      this.accessibilityManager = accessibilityManager;

      console.log('🔗 Router system integrations loaded');

    } catch (error) {
      console.warn('⚠️ Some router integrations failed to load:', error);
    }
  }

  /**
   * Set up route guards for authentication and authorization
   */
  setupRouteGuards() {
    // Authentication guard
    this.addRouteGuard(async (to, from) => {
      const route = this.routes[to];

      if (route?.requiresAuth) {
        const isAuthenticated = await this.checkAuthentication();

        if (!isAuthenticated) {
          console.log('🔒 Route requires authentication, redirecting to login');

          // Store intended route for redirect after login
          sessionStorage.setItem('dea_intended_route', to);

          // Trigger login flow
          if (window.deaAuth?.manager) {
            await window.deaAuth.manager.loginWithRedirect();
            return false; // Block navigation
          } else if (window.deaAuth?.login) {
            window.deaAuth.login();
            return false; // Block navigation
          }

          // Fallback: show login message
          this.showAuthenticationRequired();
          return false;
        }
      }

      return true; // Allow navigation
    });

    // Role-based authorization guard
    this.addRouteGuard(async (to, from) => {
      const route = this.routes[to];

      if (route?.requiredRoles && route.requiredRoles.length > 0) {
        const hasRequiredRole = await this.checkUserRoles(route.requiredRoles);

        if (!hasRequiredRole) {
          console.log('🚫 User lacks required roles for route:', route.requiredRoles);

          // Show access denied message
          this.showAccessDenied(route.requiredRoles);
          return false;
        }
      }

      return true; // Allow navigation
    });

    // Premium subscription guard
    this.addRouteGuard(async (to, from) => {
      const route = this.routes[to];

      if (route?.requiresPremium) {
        const hasPremiumAccess = await this.checkPremiumAccess();

        if (!hasPremiumAccess) {
          console.log('💎 Route requires premium access');

          // Show premium upgrade message
          this.showPremiumRequired();
          return false;
        }
      }

      return true; // Allow navigation
    });

    // Session validation guard
    this.addRouteGuard(async (to, from) => {
      const route = this.routes[to];

      if (route?.requiresAuth) {
        try {
          // Check if Auth0 token is expired
          if (window.deaAuth?.client) {
            const token = await window.deaAuth.client.getTokenSilently().catch(() => null);
            if (!token) {
              console.log('🔒 Token expired or invalid, redirecting to login');
              sessionStorage.setItem('dea_intended_route', to);
              await window.deaAuth.manager.loginWithRedirect();
              return false;
            }
          }
        } catch (error) {
          console.warn('⚠️ Session validation failed:', error);
          // Continue with normal auth check
        }
      }

      return true;
    });

    // Performance guard - preload route assets
    this.addRouteGuard(async (to, from) => {
      const route = this.routes[to];

      if (route?.preload && this.performanceMonitor) {
        try {
          await this.preloadRouteAssets(route.preload);
        } catch (error) {
          console.warn('⚠️ Failed to preload route assets:', error);
          // Don't block navigation for preload failures
        }
      }

      return true;
    });
  }

  /**
   * Add route guard
   */
  addRouteGuard(guard) {
    this.routeGuards.push(guard);
  }

  /**
   * Check if user is authenticated
   */
  async checkAuthentication() {
    try {
      // Check Auth0 authentication
      if (window.deaAuth?.client) {
        const isAuthenticated = await window.deaAuth.client.isAuthenticated();
        
        if (isAuthenticated) {
          // Double-check with token validation
          try {
            const token = await window.deaAuth.client.getTokenSilently();
            return !!token;
          } catch (tokenError) {
            console.warn('Token validation failed:', tokenError);
            return false;
          }
        }
        
        return false;
      }

      // Fallback: check for user object and session storage
      if (window.deaAuth?.user) {
        return true;
      }

      // Check session storage for auth state
      const authState = sessionStorage.getItem('dea_auth_state');
      return authState === 'authenticated';

    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Show authentication required message
   */
  showAuthenticationRequired() {
    const message = 'Esta página requiere que inicies sesión para continuar.';

    if (this.accessibilityManager) {
      this.accessibilityManager.announce(message, 'assertive');
    }

    // Show user-friendly message
    const notification = document.createElement('div');
    notification.className = 'auth-required-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🔒</div>
        <div class="notification-message">${message}</div>
        <div class="notification-actions">
          <button onclick="window.deaAuth?.login()" class="btn btn-primary">
            Iniciar Sesión
          </button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn btn-ghost">
            Cerrar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  /**
   * Preload route assets
   */
  async preloadRouteAssets(assets) {
    const preloadPromises = assets.map(asset => {
      switch (asset) {
        case 'home-assets':
          return this.preloadHomeAssets();
        case 'course-assets':
          return this.preloadCourseAssets();
        case 'lesson-assets':
          return this.preloadLessonAssets();
        case 'community-assets':
          return this.preloadCommunityAssets();
        case 'profile-assets':
          return this.preloadProfileAssets();
        case 'video-player':
          return this.preloadVideoPlayer();
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Preload home assets
   */
  async preloadHomeAssets() {
    // Preload home-specific resources
    const assets = [
      '/hero-image.jpg',
      '/home-features.js'
    ];

    return this.preloadAssets(assets);
  }

  /**
   * Preload course assets
   */
  async preloadCourseAssets() {
    const assets = [
      '/course-thumbnails.jpg',
      '/course-data.json'
    ];

    return this.preloadAssets(assets);
  }

  /**
   * Preload lesson assets
   */
  async preloadLessonAssets() {
    const assets = [
      '/lesson-player.js',
      '/lesson-styles.css'
    ];

    return this.preloadAssets(assets);
  }

  /**
   * Preload community assets
   */
  async preloadCommunityAssets() {
    const assets = [
      '/community-chat.js',
      '/community-styles.css'
    ];

    return this.preloadAssets(assets);
  }

  /**
   * Preload profile assets
   */
  async preloadProfileAssets() {
    const assets = [
      '/profile-editor.js',
      '/profile-styles.css'
    ];

    return this.preloadAssets(assets);
  }

  /**
   * Preload video player
   */
  async preloadVideoPlayer() {
    const assets = [
      '/video-player.js',
      '/video-controls.css'
    ];

    return this.preloadAssets(assets);
  }

  /**
   * Generic asset preloader
   */
  async preloadAssets(assets) {
    const preloadPromises = assets.map(asset => {
      return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'preload';

        if (asset.endsWith('.js')) {
          link.as = 'script';
        } else if (asset.endsWith('.css')) {
          link.as = 'style';
        } else if (asset.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
          link.as = 'image';
        } else {
          link.as = 'fetch';
          link.crossOrigin = 'anonymous';
        }

        link.href = asset;
        link.onload = resolve;
        link.onerror = resolve; // Don't fail on preload errors

        document.head.appendChild(link);

        // Timeout fallback
        setTimeout(resolve, 3000);
      });
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Set up navigation tracking
   */
  setupNavigationTracking() {
    // Track navigation performance
    if (this.performanceMonitor) {
      this.addRouteMiddleware((to, from) => {
        this.performanceMonitor.markMilestone(`navigation-start-${to}`);
      });
    }
  }

  /**
   * Add route middleware
   */
  addRouteMiddleware(middleware) {
    this.routeMiddleware.push(middleware);
  }

  /**
   * Set up error handling for navigation
   */
  setupErrorHandling() {
    if (this.errorBoundary) {
      // Capture navigation errors
      window.addEventListener('error', (event) => {
        if (event.filename?.includes('router') || event.message?.includes('navigation')) {
          this.errorBoundary.captureError(event.error, {
            type: 'navigation',
            route: this.currentRoute,
            context: 'Router navigation error'
          });
        }
      });
    }
  }

  /**
   * Enhanced navigation function
   */
  async navigate() {
    const hash = location.hash.replace('#', '') || '/';

    try {
      this.navigationStartTime = performance.now();

      // Store previous route
      this.previousRoute = this.currentRoute;
      this.currentRoute = hash;

      // Run route guards
      const canNavigate = await this.runRouteGuards(hash, this.previousRoute);
      if (!canNavigate) {
        // Restore previous route if navigation was blocked
        if (this.previousRoute) {
          this.currentRoute = this.previousRoute;
          history.replaceState(null, '', `#${this.previousRoute}`);
        }
        return;
      }

      // Run middleware
      await this.runRouteMiddleware(hash, this.previousRoute);

      // Check for static HTML routes first
      const staticRoutes = {
        '/welcome': {
          file: './views/welcome.html',
          title: 'Welcome - Digital English Academy'
        },
        '/system-logs': {
          file: './views/system-logs.html',
          title: 'System Logs - Digital English Academy'
        },
        '/logs': {
          file: './views/logs.html',
          title: 'Application Logs - Digital English Academy'
        },
        '/technical-logs': {
          file: './views/technical-logs.html',
          title: 'Technical Logs - Digital English Academy'
        }
      };

      const staticRoute = staticRoutes[hash];
      
      if (staticRoute) {
        // Handle static HTML routes
        document.title = staticRoute.title;
        
        try {
          const response = await fetch(staticRoute.file);
          if (response.ok) {
            const htmlContent = await response.text();
            // Replace the entire document content for static routes
            document.documentElement.innerHTML = htmlContent;
            return;
          }
        } catch (error) {
          console.warn(`Failed to load static route ${hash}:`, error);
          // Fall through to normal route handling
        }
      }

      // Get route configuration for dynamic routes
      const routeConfig = this.routes[hash];
      const renderer = routeConfig?.renderer || renderNotFound;

      // Update document title
      if (routeConfig?.title) {
        document.title = routeConfig.title;
      }

      // Render the route
      const view = document.querySelector('#main-content') || document.querySelector('#app');
      if (view) {
        // Clear loading placeholder
        const placeholder = view.querySelector('.main-content-placeholder');
        if (placeholder) {
          placeholder.remove();
        }

        // Render new content
        const content = await renderer();
        view.innerHTML = content;

        // Enhance interactions
        enhance();

        // Focus management
        focusMain();

        // Announce route change for screen readers
        if (this.accessibilityManager) {
          const routeTitle = routeConfig?.title || 'Nueva página';
          this.accessibilityManager.announce(`Navegado a: ${routeTitle}`, 'polite');
        }
      }

      // Track navigation performance
      if (this.performanceMonitor) {
        const navigationTime = performance.now() - this.navigationStartTime;
        this.performanceMonitor.recordMetric('NavigationTime', navigationTime, {
          route: hash,
          previousRoute: this.previousRoute
        });
      }

      // Dispatch navigation complete event
      window.dispatchEvent(new CustomEvent('navigationComplete', {
        detail: {
          route: hash,
          previousRoute: this.previousRoute,
          navigationTime: performance.now() - this.navigationStartTime
        }
      }));

      console.log(`🧭 Navigated to: ${hash}`);

    } catch (error) {
      console.error('❌ Navigation error:', error);

      // Report error
      if (this.errorBoundary) {
        this.errorBoundary.captureError(error, {
          type: 'navigation',
          route: hash,
          previousRoute: this.previousRoute
        });
      }

      // Fallback to error page
      this.renderErrorPage(error);
    }
  }

  /**
   * Run route guards
   */
  async runRouteGuards(to, from) {
    for (const guard of this.routeGuards) {
      try {
        const result = await guard(to, from);
        if (result === false) {
          return false;
        }
      } catch (error) {
        console.error('Route guard error:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * Run route middleware
   */
  async runRouteMiddleware(to, from) {
    for (const middleware of this.routeMiddleware) {
      try {
        await middleware(to, from);
      } catch (error) {
        console.error('Route middleware error:', error);
      }
    }
  }

  /**
   * Render error page
   */
  renderErrorPage(error) {
    const view = document.querySelector('#main-content') || document.querySelector('#app');
    if (view) {
      view.innerHTML = `
        <div class="error-page">
          <div class="error-content">
            <h1>Error de Navegación</h1>
            <p>Ocurrió un error al cargar la página solicitada.</p>
            <button onclick="location.reload()" class="btn btn-primary">
              Recargar Página
            </button>
            <button onclick="location.hash = '#/'" class="btn btn-ghost">
              Ir al Inicio
            </button>
          </div>
        </div>
      `;
    }
  }

  /**
   * Render logout page
   */
  renderLogout() {
    // Load the logout.html content
    return fetch('./views/logout.html')
      .then(response => response.text())
      .catch(() => {
        // Fallback if logout.html is not found
        return `
          <div class="logout-container">
            <div class="logout-content">
              <div class="logout-spinner"></div>
              <h2>Cerrando Sesión...</h2>
              <p>Por favor espera mientras procesamos tu solicitud.</p>
            </div>
          </div>
        `;
      });
  }

  /**
   * Get current route information
   */
  getCurrentRoute() {
    return {
      current: this.currentRoute,
      previous: this.previousRoute,
      config: this.routes[this.currentRoute]
    };
  }

  /**
   * Programmatic navigation
   */
  navigateTo(route) {
    location.hash = `#${route}`;
  }

  /**
   * Go back to previous route
   */
  goBack() {
    if (this.previousRoute) {
      this.navigateTo(this.previousRoute);
    } else {
      history.back();
    }
  }
}

// Create enhanced router instance
const enhancedRouter = new EnhancedRouter();

// Legacy compatibility exports
export function initRouter() {
  return enhancedRouter.initialize();
}

export function navigate() {
  return enhancedRouter.navigate();
}

// Enhanced exports
export { enhancedRouter };
export const router = enhancedRouter;

