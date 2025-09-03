export async function initAuth() {
  try {
    console.log('🔐 Initializing Auth0 with enhanced manager and system integrations...');

    // Import the new Auth0Manager and system integrations
    const [
      { auth0Manager },
      { getAuth0Config, validateAuth0Config },
      errorBoundaryModule,
      accessibilityModule,
      performanceModule
    ] = await Promise.all([
      import('./lib/auth0-manager.js'),
      import('./config/auth0-config.js'),
      import('./lib/error-boundary.js').catch(() => ({ errorBoundary: null })),
      import('./lib/accessibility-manager.js').catch(() => ({ accessibilityManager: null })),
      import('./lib/performance-monitor.js').catch(() => ({ performanceMonitor: null }))
    ]);

    const errorBoundary = errorBoundaryModule?.errorBoundary;
    const accessibilityManager = accessibilityModule?.accessibilityManager;
    const performanceMonitor = performanceModule?.performanceMonitor;

    // Get configuration from multiple sources
    const cfg = window.deaConfig || {};
    const environment = window.dea?.config?.getConfig()?.environment || 'development';
    const defaultConfig = getAuth0Config(environment);

    // Merge configurations (window.deaConfig takes precedence)
    const auth0Config = {
      domain: cfg.auth0Domain || cfg.AUTH0_DOMAIN || defaultConfig.domain,
      clientId: cfg.auth0ClientId || cfg.AUTH0_CLIENT_ID || defaultConfig.clientId,
      audience: cfg.auth0Audience || cfg.AUTH0_AUDIENCE || defaultConfig.audience,
      scope: cfg.auth0Scope || defaultConfig.scope,
      redirectUri: cfg.auth0RedirectUri || defaultConfig.redirectUri,
      logoutUri: cfg.auth0LogoutUri || defaultConfig.logoutUri
    };

    // Validate configuration
    if (!auth0Config.domain || !auth0Config.clientId || !window.createAuth0Client) {
      console.warn('⚠️ Auth0 not properly configured, using fallback mode');

      // Report configuration error
      if (errorBoundary) {
        errorBoundary.captureError(new Error('Auth0 configuration missing'), {
          type: 'authentication',
          context: 'Auth0 initialization',
          config: { domain: !!auth0Config.domain, clientId: !!auth0Config.clientId }
        });
      }

      window.deaAuth = { client: null, user: null, manager: null };
      return;
    }

    validateAuth0Config(auth0Config);

    // Track initialization performance
    const initStartTime = performanceMonitor ? performance.now() : null;

    // Initialize Auth0Manager
    await auth0Manager.initializeAuth0Client(auth0Config);

    // Track initialization completion
    if (performanceMonitor && initStartTime) {
      const initTime = performance.now() - initStartTime;
      performanceMonitor.recordMetric('Auth0InitTime', initTime, {
        timestamp: Date.now(),
        environment
      });
    }

    // Set up enhanced auth state change listener
    auth0Manager.onAuthStateChange((authState) => {
      // Update global deaAuth object for backward compatibility
      window.deaAuth = {
        client: authState.client,
        user: authState.user,
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        manager: auth0Manager
      };

      // Handle authentication state changes
      handleAuthStateChange(authState, {
        errorBoundary,
        accessibilityManager,
        performanceMonitor
      });

      // Sync user profile if authenticated
      if (authState.isAuthenticated && authState.user && window.dea?.upsertCurrentUserProfile) {
        window.dea.upsertCurrentUserProfile(authState.user);
      }

      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: authState
      }));
    });

    // Set up authentication error handling
    setupAuthErrorHandling(auth0Manager, errorBoundary, accessibilityManager);

    // Set up accessibility enhancements for auth UI
    setupAuthAccessibilityEnhancements(accessibilityManager);

    console.log('✅ Auth0 enhanced manager with system integrations initialized successfully');
    return auth0Manager;

  } catch (error) {
    console.error('❌ Auth0 initialization failed:', error);

    // Report initialization error
    try {
      const { errorBoundary } = await import('./lib/error-boundary.js');
      errorBoundary?.captureError(error, {
        type: 'authentication',
        context: 'Auth0 initialization failure'
      });
    } catch (e) {
      // Ignore error boundary import failure
    }

    // Fallback to basic mode
    window.deaAuth = { client: null, user: null, manager: null, error };
    throw error;
  }
}

/**
 * Handle authentication state changes with system integrations
 */
function handleAuthStateChange(authState, systems) {
  const { errorBoundary, accessibilityManager, performanceMonitor } = systems;

  // Store authentication state in session storage for route protection
  try {
    if (authState.isAuthenticated) {
      sessionStorage.setItem('dea_auth_state', 'authenticated');
      if (authState.user) {
        sessionStorage.setItem('dea_user_info', JSON.stringify({
          id: authState.user.sub,
          email: authState.user.email,
          name: authState.user.name,
          timestamp: Date.now()
        }));
      }
    } else {
      sessionStorage.removeItem('dea_auth_state');
      sessionStorage.removeItem('dea_user_info');
    }
  } catch (error) {
    console.warn('Failed to update session storage:', error);
  }

  // Announce authentication state changes to screen readers
  if (accessibilityManager) {
    if (authState.isAuthenticated && authState.user) {
      const userName = authState.user.name || authState.user.email || 'Usuario';
      accessibilityManager.announce(`Sesión iniciada como ${userName}`, 'polite');
    } else if (!authState.isAuthenticated && !authState.isLoading) {
      accessibilityManager.announce('Sesión cerrada', 'polite');
    }
  }

  // Update UI elements based on auth state
  updateAuthUI(authState);

  // Track authentication events
  if (performanceMonitor) {
    if (authState.isAuthenticated) {
      performanceMonitor.recordMetric('UserAuthenticated', 1, {
        timestamp: Date.now(),
        userId: authState.user?.sub
      });
    }
  }

  // Handle authentication errors
  if (authState.error && errorBoundary) {
    errorBoundary.captureError(authState.error, {
      type: 'authentication',
      context: 'Auth state change error'
    });
  }
}

/**
 * Update authentication UI elements
 */
function updateAuthUI(authState) {
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const userProfile = document.querySelector('.user-profile');

  if (authState.isLoading) {
    // Show loading state
    if (loginBtn) {
      loginBtn.textContent = 'Cargando...';
      loginBtn.disabled = true;
    }
    if (signupBtn) {
      signupBtn.style.display = 'none';
    }
    return;
  }

  if (authState.isAuthenticated && authState.user) {
    // Show authenticated state
    if (loginBtn) {
      loginBtn.textContent = 'Mi Cuenta';
      loginBtn.disabled = false;
      loginBtn.onclick = () => showUserMenu();
    }
    if (signupBtn) {
      signupBtn.style.display = 'none';
    }

    // Update user profile display
    updateUserProfileDisplay(authState.user);

  } else {
    // Show unauthenticated state
    if (loginBtn) {
      loginBtn.textContent = 'Iniciar sesión';
      loginBtn.disabled = false;
      loginBtn.onclick = () => login();
    }
    if (signupBtn) {
      signupBtn.style.display = 'inline-flex';
      signupBtn.onclick = () => login({ screen_hint: 'signup' });
    }

    // Hide user profile
    if (userProfile) {
      userProfile.style.display = 'none';
    }
  }
}

/**
 * Update user profile display
 */
function updateUserProfileDisplay(user) {
  let userProfile = document.querySelector('.user-profile');

  if (!userProfile) {
    // Create user profile element
    userProfile = document.createElement('div');
    userProfile.className = 'user-profile';

    const ctaGroup = document.querySelector('.cta-group');
    if (ctaGroup) {
      ctaGroup.appendChild(userProfile);
    }
  }

  const userName = user.name || user.email || 'Usuario';
  const userAvatar = user.picture || '/default-avatar.svg';

  userProfile.innerHTML = `
    <div class="user-avatar">
      <img src="${userAvatar}" alt="Avatar de ${userName}" width="32" height="32">
    </div>
    <div class="user-info">
      <span class="user-name">${userName}</span>
    </div>
    <button class="user-menu-toggle" aria-label="Abrir menú de usuario" onclick="showUserMenu()">
      <i class="ph ph-caret-down" aria-hidden="true"></i>
    </button>
  `;

  userProfile.style.display = 'flex';
}

/**
 * Show user menu
 */
function showUserMenu() {
  // Create or show user menu
  let userMenu = document.querySelector('.user-menu');

  if (!userMenu) {
    userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
      <div class="user-menu-content">
        <a href="#/profile" class="user-menu-item">
          <i class="ph ph-user" aria-hidden="true"></i>
          <span>Mi Perfil</span>
        </a>
        <a href="#/settings" class="user-menu-item">
          <i class="ph ph-gear" aria-hidden="true"></i>
          <span>Configuración</span>
        </a>
        <hr class="user-menu-divider">
        <button class="user-menu-item" onclick="logout()">
          <i class="ph ph-sign-out" aria-hidden="true"></i>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    `;

    document.body.appendChild(userMenu);

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!userMenu.contains(event.target) && !event.target.closest('.user-profile')) {
        userMenu.remove();
      }
    });
  }

  // Position menu
  const userProfile = document.querySelector('.user-profile');
  if (userProfile) {
    const rect = userProfile.getBoundingClientRect();
    userMenu.style.position = 'absolute';
    userMenu.style.top = `${rect.bottom + 8}px`;
    userMenu.style.right = '20px';
    userMenu.style.zIndex = '1000';
  }
}

/**
 * Set up authentication error handling
 */
function setupAuthErrorHandling(auth0Manager, errorBoundary, accessibilityManager) {
  if (!errorBoundary) return;

  // Listen for Auth0 errors
  window.addEventListener('auth0Error', (event) => {
    const error = event.detail.error;

    errorBoundary.captureError(error, {
      type: 'authentication',
      context: 'Auth0 error event',
      additionalInfo: event.detail
    });

    // Announce error to screen readers
    if (accessibilityManager) {
      const userMessage = getAuthErrorMessage(error);
      accessibilityManager.announce(userMessage, 'assertive');
    }
  });

  // Set up error recovery for authentication
  auth0Manager.onError = (error) => {
    errorBoundary.captureError(error, {
      type: 'authentication',
      context: 'Auth0Manager error'
    });
  };
}

/**
 * Get user-friendly authentication error message
 */
function getAuthErrorMessage(error) {
  const errorMessages = {
    'login_required': 'Es necesario iniciar sesión para continuar',
    'consent_required': 'Se requiere consentimiento adicional',
    'interaction_required': 'Se requiere interacción adicional',
    'access_denied': 'Acceso denegado',
    'unauthorized': 'No autorizado',
    'invalid_request': 'Solicitud inválida',
    'server_error': 'Error del servidor de autenticación'
  };

  const errorCode = error.error || error.code || 'unknown';
  return errorMessages[errorCode] || 'Error de autenticación. Por favor, intenta nuevamente.';
}

/**
 * Set up accessibility enhancements for authentication UI
 */
function setupAuthAccessibilityEnhancements(accessibilityManager) {
  if (!accessibilityManager) return;

  // Enhance login/signup buttons
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');

  if (loginBtn) {
    loginBtn.setAttribute('aria-describedby', 'login-desc');

    if (!document.getElementById('login-desc')) {
      const desc = document.createElement('span');
      desc.id = 'login-desc';
      desc.className = 'sr-only';
      desc.textContent = 'Acceder a tu cuenta existente';
      loginBtn.parentNode.appendChild(desc);
    }
  }

  if (signupBtn) {
    signupBtn.setAttribute('aria-describedby', 'signup-desc');

    if (!document.getElementById('signup-desc')) {
      const desc = document.createElement('span');
      desc.id = 'signup-desc';
      desc.className = 'sr-only';
      desc.textContent = 'Crear una cuenta nueva y probar gratis';
      signupBtn.parentNode.appendChild(desc);
    }
  }

  // Set up focus management for authentication flows
  window.addEventListener('authStateChanged', (event) => {
    const authState = event.detail;

    if (authState.isAuthenticated) {
      // Focus user profile or main content after login
      const userProfile = document.querySelector('.user-profile');
      const mainContent = document.querySelector('#main-content');

      if (userProfile) {
        userProfile.focus();
      } else if (mainContent) {
        mainContent.focus();
      }
    }
  });
}

export async function login(options = {}) {
  try {
    // Use enhanced Auth0Manager if available
    if (window.deaAuth?.manager) {
      console.log('🔐 Using enhanced Auth0Manager for login...');

      // Determine login method based on options
      if (options.popup || options.usePopup) {
        await window.deaAuth.manager.loginWithPopup(options);
      } else {
        await window.deaAuth.manager.loginWithRedirect(options);
      }
      return;
    }

    // Fallback to basic Auth0 client
    if (!window.deaAuth?.client) {
      console.warn('Auth0 not configured');
      return;
    }

    console.log('🔐 Using basic Auth0 client for login...');
    await window.deaAuth.client.loginWithRedirect({
      authorizationParams: { screen_hint: options.screen_hint || undefined }
    });

  } catch (error) {
    console.error('❌ Login failed:', error);
    throw error;
  }
}

export async function logout() {
  try {
    // Clear session storage immediately
    try {
      sessionStorage.removeItem('dea_auth_state');
      sessionStorage.removeItem('dea_user_info');
      sessionStorage.removeItem('dea_intended_route');
    } catch (storageError) {
      console.warn('Failed to clear session storage:', storageError);
    }

    // Use enhanced Auth0Manager if available
    if (window.deaAuth?.manager) {
      console.log('🚪 Using enhanced Auth0Manager for logout...');
      await window.deaAuth.manager.logout();
      return;
    }

    // Fallback to basic Auth0 client
    if (!window.deaAuth?.client) {
      console.warn('Auth0 not configured');
      return;
    }

    console.log('🚪 Using basic Auth0 client for logout...');
    await window.deaAuth.client.logout({
      logoutParams: { returnTo: window.location.origin + window.location.pathname }
    });

  } catch (error) {
    console.error('❌ Logout failed:', error);
    throw error;
  }
}

export function getUser() {
  // Use enhanced Auth0Manager if available
  if (window.deaAuth?.manager) {
    return window.deaAuth.manager.getUser();
  }

  // Fallback to basic user object
  return window.deaAuth?.user || null;
}

// Additional enhanced functions
export async function getAccessToken(options = {}) {
  if (window.deaAuth?.manager) {
    return await window.deaAuth.manager.getAccessToken(options);
  }

  if (window.deaAuth?.client) {
    return await window.deaAuth.client.getTokenSilently(options);
  }

  throw new Error('Auth0 not configured');
}

export function isAuthenticated() {
  if (window.deaAuth?.manager) {
    return window.deaAuth.manager.isUserAuthenticated();
  }

  return Boolean(window.deaAuth?.user);
}

export async function getUserProfile() {
  if (window.deaAuth?.manager) {
    return await window.deaAuth.manager.getUserProfile();
  }

  return getUser();
}

export async function updateUserPreferences(preferences) {
  if (window.deaAuth?.manager) {
    return await window.deaAuth.manager.updateUserPreferences(preferences);
  }

  throw new Error('Enhanced Auth0Manager not available');
}

export function onAuthStateChange(callback) {
  if (window.deaAuth?.manager) {
    return window.deaAuth.manager.onAuthStateChange(callback);
  }

  // Fallback: listen to custom event
  const handler = (event) => callback(event.detail);
  window.addEventListener('authStateChanged', handler);

  return () => window.removeEventListener('authStateChanged', handler);
}