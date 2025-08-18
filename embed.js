// Creates an embeddable iframe widget for easy WordPress integration.
(function(){
  const HTML = ({ initialRoute = '/' } = {}) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Digital English Academy — Widget</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./styles.css" />
  <script src="https://unpkg.com/@phosphor-icons/web"></script>
  <script type="importmap">
  {
    "imports": {
      "dayjs": "https://esm.sh/dayjs@1.11.11",
      "dayjs/plugin/relativeTime": "https://esm.sh/dayjs@1.11.11/plugin/relativeTime",
      "dayjs/locale/es": "https://esm.sh/dayjs@1.11.11/locale/es"
    }
  }
  </script>
  <style>
    body { margin: 0; background: transparent; }
    .site-header, .site-footer { position: static; }
  </style>
</head>
<body>
  <a class="skip-link" href="#app">Saltar al contenido</a>
  <header class="site-header" role="banner">
    <div class="container header-inner">
      <a href="#/" class="brand" aria-label="Inicio Digital English Academy">
        <div class="brand-mark" aria-hidden="true">DE</div>
        <span class="brand-name">Digital English Academy</span>
      </a>
      <nav class="primary-nav" aria-label="Principal">
        <a href="#/courses" class="nav-link"><i class="ph ph-books" aria-hidden="true"></i><span>Cursos</span></a>
        <a href="#/lesson" class="nav-link"><i class="ph ph-play-circle" aria-hidden="true"></i><span>Lección</span></a>
        <a href="#/community" class="nav-link"><i class="ph ph-chats-circle" aria-hidden="true"></i><span>Comunidad</span></a>
        <a href="#/profile" class="nav-link"><i class="ph ph-user-circle" aria-hidden="true"></i><span>Perfil</span></a>
      </nav>
      <div class="cta-group">
        <button class="btn btn-ghost" id="loginBtn" aria-label="Iniciar sesión">Iniciar sesión</button>
        <button class="btn btn-primary" id="signupBtn" aria-label="Probar gratis">Probar gratis</button>
      </div>
      <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="mobileNav" aria-label="Abrir menú">
        <i class="ph ph-list"></i>
      </button>
    </div>
    <nav class="mobile-nav" id="mobileNav" aria-label="Navegación móvil">
      <a href="#/courses" class="nav-link"><i class="ph ph-books"></i><span>Cursos</span></a>
      <a href="#/lesson" class="nav-link"><i class="ph ph-play-circle"></i><span>Lección</span></a>
      <a href="#/community" class="nav-link"><i class="ph ph-chats-circle"></i><span>Comunidad</span></a>
      <a href="#/profile" class="nav-link"><i class="ph ph-user-circle"></i><span>Perfil</span></a>
    </nav>
  </header>

  <div class="app-bg" aria-hidden="true">
    <video class="app-bg-video" autoplay muted loop playsinline>
      <source src="/efe50645-3bff-48ed-8183-5cac009e4469.mp4" type="video/mp4">
    </video>
    <div class="app-bg-overlay"></div>
  </div>

  <main id="app" tabindex="-1" role="main" class="view"></main>

  <footer class="site-footer" role="contentinfo">
    <div class="container footer-inner">
      <div class="footer-brand">
        <div class="brand-mark" aria-hidden="true">DE</div>
        <span class="brand-name">Digital English Academy</span>
      </div>
      <nav class="footer-nav" aria-label="Pie">
        <a href="#/courses">Cursos</a>
        <a href="#/community">Comunidad</a>
        <a href="#/profile">Perfil</a>
        <a href="#/">Inicio</a>
      </nav>
      <p class="legal"> Digital English Academy. Todos los derechos reservados.</p>
    </div>
  </footer>

  <script>
    try { if (true) { location.hash = '#' + (window.initialRoute || '/'); } } catch(e){}
    (function(){
      const postHeight = () => parent.postMessage({ type:'DEA_WIDGET_HEIGHT', h: document.documentElement.scrollHeight }, '*');
      window.addEventListener('load', postHeight);
      const ro = new ResizeObserver(postHeight);
      ro.observe(document.body);
      window.addEventListener('hashchange', postHeight);
      setInterval(postHeight, 800);
    })();
  </script>
  <script type="module" src="./app.js"></script>
</body>
</html>
`.trim();

  function mount(selectorOrEl, options = {}){
    const target = typeof selectorOrEl === 'string' ? document.querySelector(selectorOrEl) : selectorOrEl;
    if (!target) { console.error('DEAWidget: target not found'); return; }
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title','Digital English Academy');
    iframe.style.width = '100%';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.loading = 'lazy';
    iframe.style.height = (options.height || 900) + 'px';

    const doc = HTML(options);
    const tagged = doc.replace(
      '<script type="module" src="./app.js"></script>',
      `<script>window.initialRoute=${JSON.stringify(options.route || '/')};</script>\n  <script type="module" src="./app.js"></script>`
    );

    iframe.srcdoc = tagged;
    target.appendChild(iframe);

    const onMsg = (e) => {
      if (!e || !e.data || e.data.type !== 'DEA_WIDGET_HEIGHT') return;
      const h = Math.max(600, Number(e.data.h) || 0);
      iframe.style.height = h + 'px';
    };
    window.addEventListener('message', onMsg);

    return {
      navigate: (route) => {
        const r = String(route || '/');
        iframe.contentWindow?.postMessage({ type:'DEA_NAV', route: r }, '*');
        try { iframe.contentWindow.location.hash = '#' + r; } catch(e){}
      },
      destroy: () => {
        window.removeEventListener('message', onMsg);
        iframe.remove();
      }
    };
  }

  window.DEAWidget = { mount };
})();
