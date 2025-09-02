import { navigate } from './router.js';
import { appBootstrap } from './lib/app-bootstrap.js';
import { configManager } from './lib/configuration-manager.js';
import { initOnboarding } from './onboarding.js';
import { dataManager, seedDatabase, syncFromDB, generateCourseImages, forceResize } from './data.js';
import { mountMiniChat } from './mini-chat.js';
import { prepareForProduction } from './build.js';
import { login, logout, getUser } from './auth.js';
import { ChatInterface } from './components/chat-interface.js';

// Handle route changes
window.addEventListener('hashchange', navigate);

// Initialize application when DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Set current year in footer
    document.querySelector('#year').textContent = new Date().getFullYear();

    // Initialize the application with bootstrap system
    console.log('🚀 Starting Digital English Academy...');
    await appBootstrap.initialize();

    // Navigate to current route
    navigate();

    // Initialize additional features
    initOnboarding();
    mountMiniChat();
    
    // Initialize chat interface
    const chatInterface = new ChatInterface('chat-container');
    window.dea = window.dea || {};
    window.dea.chatInterface = chatInterface;

    // Wire up authentication buttons after Auth0 is initialized
    setTimeout(() => {
      const loginBtn = document.querySelector('#loginBtn');
      const signupBtn = document.querySelector('#signupBtn');
      loginBtn?.addEventListener('click', () => login());
      signupBtn?.addEventListener('click', () => login({ screen_hint: 'signup' }));

      // Update user profile if authenticated
      if (window.deaAuth?.user) {
        window.dea.upsertCurrentUserProfile(window.deaAuth.user);
      }
    }, 1000);

    // Expose enhanced API on window for ops/debug and WP integration
    window.dea = {
      ...window.dea,
      // Legacy compatibility
      dataManager,
      seedDatabase,
      syncFromDB,
      generateCourseImages,
      forceResize,
      prepareForProduction,
      auth: { login, logout, getUser },
      upsertCurrentUserProfile: (u) => import('./data.js').then(m => m.upsertCurrentUserProfile(u)),

      // New enhanced API
      config: configManager,
      bootstrap: appBootstrap,

      // Utility methods
      restart: () => location.reload(),
      setFeature: (name, enabled) => configManager.setFeatureFlag(name, enabled),
      getStatus: () => appBootstrap.getInitializationStatus()
    };

    // Auto-enable production tweaks via URL params or localStorage
    const params = new URLSearchParams(location.search);
    if (params.get('prod') === '1' || localStorage.getItem('dea_prod') === '1') {
      prepareForProduction();
    }

    console.log('✅ Digital English Academy initialized successfully!');

  } catch (error) {
    console.error('❌ Failed to initialize Digital English Academy:', error);

    // Fallback to basic functionality
    console.log('🔄 Falling back to basic mode...');
    try {
      const { setupHeader } = await import('./utils.js');
      const { initRouter } = await import('./router.js');
      setupHeader();
      initRouter();
      navigate();
      console.log('⚠️ Running in basic mode');
    } catch (fallbackError) {
      console.error('❌ Even fallback failed:', fallbackError);
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; font-family: system-ui;">
          <div>
            <h1>🚨 Application Error</h1>
            <p>Digital English Academy failed to load properly.</p>
            <button onclick="location.reload()" style="padding: 0.5rem 1rem; margin-top: 1rem; background: #0a66ff; color: white; border: none; border-radius: 8px; cursor: pointer;">
              Reload Page
            </button>
          </div>
        </div>
      `;
    }
  }
});

// Listen for initialization complete event
window.addEventListener('deaInitialized', (event) => {
  console.log('🎉 Initialization complete:', event.detail);

  // Could trigger analytics, show welcome message, etc.
  if (configManager.isDevelopmentMode()) {
    console.log('🔧 Development tools available via window.dea');
  }
});