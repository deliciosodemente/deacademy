/**
 * Centralized error handling system
 */

class ErrorHandler {
  constructor() {
    this.setupGlobalHandlers();
    this.errors = [];
  }

  setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Unhandled Promise Rejection');
      event.preventDefault();
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'JavaScript Error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }

  handleError(error, context = 'Unknown', metadata = {}) {
    const errorInfo = {
      message: error?.message || String(error),
      stack: error?.stack,
      context,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errors.push(errorInfo);
    this.logError(errorInfo);
    this.notifyUser(errorInfo);

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
  }

  logError(errorInfo) {
    console.group(`🚨 Error: ${errorInfo.context}`);
    console.error('Message:', errorInfo.message);
    console.error('Stack:', errorInfo.stack);
    console.error('Metadata:', errorInfo.metadata);
    console.groupEnd();

    // In production, send to monitoring service
    if (this.isProduction()) {
      this.sendToMonitoring(errorInfo);
    }
  }

  notifyUser(errorInfo) {
    // Don't spam users with technical errors
    if (this.shouldNotifyUser(errorInfo)) {
      const message = this.getUserFriendlyMessage(errorInfo);
      this.showUserNotification(message, 'error');
    }
  }

  shouldNotifyUser(errorInfo) {
    // Don't notify for network errors or minor issues
    const ignoredPatterns = [
      /network/i,
      /fetch/i,
      /loading/i,
      /script error/i
    ];

    return !ignoredPatterns.some(pattern => 
      pattern.test(errorInfo.message)
    );
  }

  getUserFriendlyMessage(errorInfo) {
    const friendlyMessages = {
      'API Error': 'Hubo un problema conectando con el servidor. Por favor, intenta de nuevo.',
      'Network Error': 'Problema de conexión. Verifica tu internet.',
      'JavaScript Error': 'Algo salió mal. La página se recargará automáticamente.',
      'Unhandled Promise Rejection': 'Error inesperado. Intenta refrescar la página.'
    };

    return friendlyMessages[errorInfo.context] || 
           'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
  }

  showUserNotification(message, type = 'error') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ff6b6b' : '#0cb3a9'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      z-index: 1000;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;
    
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <i class="ph ph-${type === 'error' ? 'warning-circle' : 'check-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">
          <i class="ph ph-x"></i>
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  async sendToMonitoring(errorInfo) {
    try {
      // In a real app, send to service like Sentry, LogRocket, etc.
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorInfo)
      });
    } catch (e) {
      // Silently fail - don't create error loops
      console.warn('Failed to send error to monitoring:', e);
    }
  }

  isProduction() {
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1';
  }

  // Public API for manual error reporting
  reportError(error, context, metadata) {
    this.handleError(error, context, metadata);
  }

  getErrorHistory() {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Create global instance
export const errorHandler = new ErrorHandler();

// Utility functions for common error scenarios
export const withErrorHandling = (fn, context) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.reportError(error, context, { args });
      throw error; // Re-throw to allow caller to handle
    }
  };
};

export const safeAsync = (fn, fallback = null, context = 'Async Operation') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.reportError(error, context, { args });
      return fallback;
    }
  };
};