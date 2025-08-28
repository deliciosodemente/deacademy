/**
 * SEO and meta management for SPA
 */

class SEOManager {
  constructor() {
    this.defaultMeta = {
      title: 'Digital English Academy — Aprende inglés con confianza',
      description: 'Plataforma integral de aprendizaje de inglés: cursos por niveles, lecciones interactivas, comunidad y progreso personal.',
      keywords: 'inglés, aprender inglés, cursos inglés, lecciones interactivas, english academy',
      image: '/og-image.jpg',
      url: window.location.origin
    };

    this.routeMeta = {
      '/': {
        title: 'Digital English Academy — Aprende inglés con confianza',
        description: 'Domina el inglés con lecciones interactivas, cursos por niveles y una comunidad que te impulsa.',
        keywords: 'inglés, aprender inglés, cursos online, lecciones interactivas'
      },
      '/courses': {
        title: 'Cursos de Inglés por Niveles — Digital English Academy',
        description: 'Explora nuestros cursos de inglés organizados por nivel: básico, intermedio y avanzado. Encuentra el curso perfecto para ti.',
        keywords: 'cursos inglés, niveles inglés, básico intermedio avanzado, inglés negocios'
      },
      '/lesson': {
        title: 'Lecciones Interactivas de Inglés — Digital English Academy',
        description: 'Aprende inglés con lecciones interactivas, videos, quizzes y ejercicios prácticos adaptados a tu nivel.',
        keywords: 'lecciones inglés, ejercicios inglés, quizzes inglés, aprendizaje interactivo'
      },
      '/community': {
        title: 'Comunidad de Estudiantes de Inglés — Digital English Academy',
        description: 'Únete a nuestra comunidad de estudiantes. Comparte dudas, descubre recursos y celebra tus logros.',
        keywords: 'comunidad inglés, foro inglés, estudiantes inglés, ayuda inglés'
      },
      '/profile': {
        title: 'Tu Progreso en Inglés — Digital English Academy',
        description: 'Revisa tu progreso, insignias ganadas y cursos completados en tu perfil personalizado.',
        keywords: 'progreso inglés, perfil estudiante, insignias inglés, seguimiento aprendizaje'
      }
    };

    this.setupHistoryAPI();
  }

  /**
   * Update page meta information
   */
  updateMeta(route) {
    const meta = this.routeMeta[route] || this.defaultMeta;
    
    // Update title
    document.title = meta.title;

    // Update or create meta tags
    this.setMetaTag('description', meta.description);
    this.setMetaTag('keywords', meta.keywords);
    
    // Open Graph tags
    this.setMetaTag('og:title', meta.title, 'property');
    this.setMetaTag('og:description', meta.description, 'property');
    this.setMetaTag('og:image', meta.image || this.defaultMeta.image, 'property');
    this.setMetaTag('og:url', window.location.href, 'property');
    this.setMetaTag('og:type', 'website', 'property');
    this.setMetaTag('og:site_name', 'Digital English Academy', 'property');

    // Twitter Card tags
    this.setMetaTag('twitter:card', 'summary_large_image', 'name');
    this.setMetaTag('twitter:title', meta.title, 'name');
    this.setMetaTag('twitter:description', meta.description, 'name');
    this.setMetaTag('twitter:image', meta.image || this.defaultMeta.image, 'name');

    // Canonical URL
    this.setLinkTag('canonical', window.location.href);

    // Language
    document.documentElement.lang = 'es';
  }

  /**
   * Set or update meta tag
   */
  setMetaTag(name, content, attribute = 'name') {
    let tag = document.querySelector(`meta[${attribute}="${name}"]`);
    
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, name);
      document.head.appendChild(tag);
    }
    
    tag.setAttribute('content', content);
  }

  /**
   * Set or update link tag
   */
  setLinkTag(rel, href) {
    let tag = document.querySelector(`link[rel="${rel}"]`);
    
    if (!tag) {
      tag = document.createElement('link');
      tag.setAttribute('rel', rel);
      document.head.appendChild(tag);
    }
    
    tag.setAttribute('href', href);
  }

  /**
   * Setup History API for better URLs (optional upgrade from hash routing)
   */
  setupHistoryAPI() {
    // This would be used if migrating from hash routing to history API
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.route) {
        this.updateMeta(event.state.route);
      }
    });
  }

  /**
   * Generate structured data for search engines
   */
  generateStructuredData(route) {
    const baseData = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "Digital English Academy",
      "description": this.defaultMeta.description,
      "url": this.defaultMeta.url,
      "logo": `${this.defaultMeta.url}/logo.png`,
      "sameAs": [
        // Add social media URLs here
      ]
    };

    let structuredData = baseData;

    switch (route) {
      case '/courses':
        structuredData = {
          ...baseData,
          "@type": "Course",
          "name": "Cursos de Inglés Online",
          "description": "Cursos de inglés por niveles: básico, intermedio y avanzado",
          "provider": {
            "@type": "Organization",
            "name": "Digital English Academy"
          },
          "educationalLevel": ["Beginner", "Intermediate", "Advanced"],
          "inLanguage": "es",
          "teaches": "English Language"
        };
        break;

      case '/lesson':
        structuredData = {
          ...baseData,
          "@type": "LearningResource",
          "name": "Lecciones Interactivas de Inglés",
          "description": "Lecciones interactivas con videos, quizzes y ejercicios",
          "educationalUse": "instruction",
          "interactivityType": "active",
          "learningResourceType": "lesson"
        };
        break;
    }

    this.setStructuredData(structuredData);
  }

  /**
   * Insert structured data into page
   */
  setStructuredData(data) {
    // Remove existing structured data
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Generate sitemap data (for server-side generation)
   */
  getSitemapData() {
    return Object.keys(this.routeMeta).map(route => ({
      url: `${this.defaultMeta.url}#${route}`,
      lastmod: new Date().toISOString(),
      changefreq: route === '/' ? 'daily' : 'weekly',
      priority: route === '/' ? '1.0' : '0.8'
    }));
  }

  /**
   * Track page views (integrate with analytics)
   */
  trackPageView(route) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: document.title,
        page_location: window.location.href
      });
    }

    // Other analytics services can be added here
    this.sendAnalytics('page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: route
    });
  }

  /**
   * Send analytics data
   */
  sendAnalytics(eventName, data) {
    // This would integrate with your analytics service
    console.log('Analytics:', eventName, data);
    
    // Example: Send to custom analytics endpoint
    if (navigator.sendBeacon) {
      const payload = JSON.stringify({
        event: eventName,
        data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });
      
      navigator.sendBeacon('/api/analytics', payload);
    }
  }
}

// Create global SEO manager
export const seoManager = new SEOManager();

// Utility function to update page info
export const updatePageInfo = (route) => {
  seoManager.updateMeta(route);
  seoManager.generateStructuredData(route);
  seoManager.trackPageView(route);
};