/**
 * Demo Mode Configuration
 * Controls which features are enabled without credentials
 */

export const demoConfig = {
    // Demo mode - set to false when credentials are configured
    isDemoMode: true,

    // Feature flags for demo
    features: {
        // Always enabled in demo
        navigation: true,
        responsive: true,
        courses: true,
        lessons: true,
        community: true,
        profile: true,

        // Disabled in demo (require credentials)
        realAuth: false,
        realPayments: false,
        realAI: false,
        realDatabase: false,

        // Demo versions enabled
        demoAuth: true,
        demoPayments: true,
        demoAI: true,
        demoDatabase: true
    },

    // Demo data
    demoUser: {
        name: "Usuario Demo",
        email: "demo@denglishacademy.com",
        picture: "https://ui-avatars.com/api/?name=Usuario+Demo&background=0a66ff&color=fff",
        level: "Intermedio",
        progress: 65,
        coursesCompleted: 3,
        lessonsCompleted: 24,
        streakDays: 7
    },

    // Demo messages
    messages: {
        authDisabled: "🎯 Modo Demo: El login estará disponible en la versión de producción",
        paymentsDisabled: "💳 Modo Demo: Los pagos estarán disponibles en la versión de producción",
        aiDisabled: "🤖 Modo Demo: IA avanzada estará disponible en la versión de producción",
        databaseDisabled: "💾 Modo Demo: Datos guardados localmente, base de datos en producción"
    },

    // Demo responses for AI
    aiResponses: [
        "¡Hola! En la versión completa tendré IA avanzada para ayudarte mejor.",
        "Esta es una respuesta de demostración. ¡En producción seré mucho más inteligente!",
        "🎯 Demo: En la versión real podré ayudarte con gramática, vocabulario y conversación.",
        "¡Excelente pregunta! La IA completa estará disponible después del lanzamiento.",
        "En modo demo solo puedo dar respuestas básicas. ¡Espera a ver la versión completa!"
    ],

    // Demo courses data
    demoCourses: [
        {
            id: 1,
            title: "English Basics",
            level: "Básico",
            type: "Gramática",
            img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop",
            blurb: "Aprende los fundamentos del inglés",
            premium: false,
            lessons: 12,
            duration: "2 horas",
            progress: 75
        },
        {
            id: 2,
            title: "Business English",
            level: "Intermedio",
            type: "Conversación",
            img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop",
            blurb: "Inglés profesional para el trabajo",
            premium: true,
            lessons: 15,
            duration: "3 horas",
            progress: 40
        },
        {
            id: 3,
            title: "Advanced Grammar",
            level: "Avanzado",
            type: "Gramática",
            img: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=450&fit=crop",
            blurb: "Domina la gramática avanzada",
            premium: true,
            lessons: 20,
            duration: "4 horas",
            progress: 10
        }
    ],

    // Demo community threads
    demoThreads: [
        {
            id: 1,
            title: "¿Cómo mejorar mi pronunciación?",
            author: "María García",
            time: "hace 2 horas",
            replies: 8,
            likes: 15
        },
        {
            id: 2,
            title: "Recursos para practicar listening",
            author: "Carlos López",
            time: "hace 5 horas",
            replies: 12,
            likes: 23
        },
        {
            id: 3,
            title: "Diferencias entre Present Perfect y Past Simple",
            author: "Ana Martínez",
            time: "hace 1 día",
            replies: 6,
            likes: 18
        }
    ]
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(featureName) {
    return demoConfig.features[featureName] || false;
}

/**
 * Get demo message for disabled feature
 */
export function getDemoMessage(featureName) {
    const messageKey = featureName + 'Disabled';
    return demoConfig.messages[messageKey] || 'Esta funcionalidad estará disponible en la versión completa';
}

/**
 * Get random AI response for demo
 */
export function getDemoAIResponse() {
    const responses = demoConfig.aiResponses;
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Show demo notification
 */
export function showDemoNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `demo-notification demo-${type}`;
    notification.innerHTML = `
    <div class="demo-notification-content">
      <span class="demo-icon">🎯</span>
      <span class="demo-message">${message}</span>
      <button class="demo-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

    // Add styles if not present
    if (!document.querySelector('#demo-styles')) {
        const styles = document.createElement('style');
        styles.id = 'demo-styles';
        styles.textContent = `
      .demo-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f0f9ff;
        border: 1px solid #0ea5e9;
        border-radius: 8px;
        padding: 1rem;
        max-width: 400px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease;
      }
      
      .demo-notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .demo-icon {
        font-size: 1.2rem;
      }
      
      .demo-message {
        flex: 1;
        font-size: 0.9rem;
        color: #0c4a6e;
      }
      
      .demo-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #64748b;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .demo-close:hover {
        color: #0c4a6e;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Initialize demo mode
 */
export function initDemoMode() {
    if (!demoConfig.isDemoMode) return;

    // Add demo indicator to page
    const demoIndicator = document.createElement('div');
    demoIndicator.id = 'demo-indicator';
    demoIndicator.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      cursor: pointer;
    " onclick="this.style.display='none'">
      🎯 MODO DEMO
    </div>
  `;

    document.body.appendChild(demoIndicator);

    // Show welcome message
    setTimeout(() => {
        showDemoNotification(
            'Bienvenido al demo de Digital English Academy. Todas las funcionalidades están disponibles para explorar.',
            'info'
        );
    }, 2000);

    console.log('🎯 Demo mode initialized');
    console.log('📋 Available features:', Object.keys(demoConfig.features).filter(f => demoConfig.features[f]));
}

// Auto-initialize if in demo mode
if (typeof window !== 'undefined' && demoConfig.isDemoMode) {
    window.addEventListener('DOMContentLoaded', initDemoMode);
}