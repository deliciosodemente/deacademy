/**
 * Home Features Module
 * Funcionalidades específicas para la página de inicio
 */

// Inicializar características de la página de inicio
export function initializeHomeFeatures() {
    console.log('🏠 Inicializando características de la página de inicio');
    
    // Configurar animaciones de entrada
    setupEntryAnimations();
    
    // Configurar interacciones de características
    setupFeatureInteractions();
    
    // Configurar lazy loading de imágenes
    setupLazyLoading();
}

// Configurar animaciones de entrada
function setupEntryAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });
    
    // Observar elementos con clase 'feature-card'
    document.querySelectorAll('.feature-card, .hero-section, .stats-section').forEach(el => {
        observer.observe(el);
    });
}

// Configurar interacciones de características
function setupFeatureInteractions() {
    // Hover effects para tarjetas de características
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
}

// Configurar lazy loading de imágenes
function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Exportar funciones principales
export {
    setupEntryAnimations,
    setupFeatureInteractions,
    setupLazyLoading
};

// Auto-inicializar si el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHomeFeatures);
} else {
    initializeHomeFeatures();
}