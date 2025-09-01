export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function focusMain() { requestAnimationFrame(() => document.querySelector('#app')?.focus()); }

export function setupHeader() {
  const btn = document.querySelector('#navToggle');
  const mobile = document.querySelector('#mobileNav');

  // Setup mobile navigation toggle
  btn?.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    mobile.setAttribute('aria-expanded', String(!expanded));
    mobile.style.display = expanded ? 'none' : 'block';
  });

  // Setup enhanced auth state management
  setupAuthStateHeader();
}

/**
 * Enhanced header authentication state management
 */
export function setupAuthStateHeader() {
  // Listen for auth state changes
  const updateHeader = (authState) => {
    const cta = document.querySelector('.cta-group');
    if (!cta) return;

    if (authState.isLoading) {
      // Show loading state
      cta.innerHTML = `
        <div class="auth-loading" style="display:flex;align-items:center;gap:.5rem;color:var(--muted);">
          <div class="spinner" style="width:16px;height:16px;border:2px solid var(--border);border-top:2px solid var(--primary);border-radius:50%;animation:spin 1s linear infinite;"></div>
          <span style="font-size:.9rem;">Cargando...</span>
        </div>
      `;
    } else if (authState.isAuthenticated && authState.user) {
      // Show authenticated user state
      const { name, picture, email } = authState.user;
      const displayName = name || email?.split('@')[0] || 'Usuario';

      cta.innerHTML = `
        <div class="user-menu" style="position:relative;">
          <button class="btn btn-ghost user-menu-trigger" id="userMenuBtn" aria-expanded="false" aria-haspopup="true">
            <img src="${picture || 'https://ui-avatars.com/api/?name=Usuario&background=0a66ff&color=fff'}" 
                 alt="${displayName}" 
                 style="width:28px;height:28px;border-radius:999px;border:1px solid var(--border);margin-right:.5rem"/>
            <span class="user-name" style="font-size:.9rem;max-width:12ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${displayName}</span>
            <i class="ph ph-caret-down" style="margin-left:.25rem;font-size:.8rem;"></i>
          </button>
          
          <div class="user-dropdown" id="userDropdown" style="display:none;position:absolute;top:100%;right:0;background:var(--bg);border:1px solid var(--border);border-radius:8px;box-shadow:var(--shadow-md);min-width:200px;z-index:1000;margin-top:.5rem;">
            <div class="user-info" style="padding:1rem;border-bottom:1px solid var(--border);">
              <div style="font-weight:600;font-size:.9rem;">${displayName}</div>
              <div style="color:var(--muted);font-size:.8rem;">${email || ''}</div>
            </div>
            
            <div class="user-actions" style="padding:.5rem 0;">
              <a href="#/profile" class="dropdown-item" style="display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;text-decoration:none;color:var(--text);transition:background .2s;">
                <i class="ph ph-user-circle"></i>
                <span>Mi Perfil</span>
              </a>
              <a href="#/progress" class="dropdown-item" style="display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;text-decoration:none;color:var(--text);transition:background .2s;">
                <i class="ph ph-chart-line"></i>
                <span>Mi Progreso</span>
              </a>
              <a href="#/settings" class="dropdown-item" style="display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;text-decoration:none;color:var(--text);transition:background .2s;">
                <i class="ph ph-gear"></i>
                <span>Configuración</span>
              </a>
              <hr style="margin:.5rem 0;border:none;border-top:1px solid var(--border);">
              <button class="dropdown-item logout-btn" id="logoutBtn" style="display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;background:none;border:none;color:var(--text);cursor:pointer;width:100%;text-align:left;transition:background .2s;">
                <i class="ph ph-sign-out"></i>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      `;

      // Setup dropdown functionality
      setupUserDropdown();

      // Setup logout functionality
      document.querySelector('#logoutBtn')?.addEventListener('click', async () => {
        try {
          if (window.dea?.auth?.logout) {
            await window.dea.auth.logout();
          } else if (window.deaAuth?.manager) {
            await window.deaAuth.manager.logout();
          }
        } catch (error) {
          console.error('Logout failed:', error);
          toast('Error al cerrar sesión');
        }
      });

    } else {
      // Show unauthenticated state
      cta.innerHTML = `
        <button class="btn btn-ghost" id="loginBtn" aria-label="Iniciar sesión">Iniciar sesión</button>
        <button class="btn btn-primary" id="signupBtn" aria-label="Probar gratis">Probar gratis</button>
      `;

      // Setup login buttons
      document.querySelector('#loginBtn')?.addEventListener('click', async () => {
        try {
          if (window.dea?.auth?.login) {
            await window.dea.auth.login();
          }
        } catch (error) {
          console.error('Login failed:', error);
          toast('Error al iniciar sesión');
        }
      });

      document.querySelector('#signupBtn')?.addEventListener('click', async () => {
        try {
          if (window.dea?.auth?.login) {
            await window.dea.auth.login({ screen_hint: 'signup' });
          }
        } catch (error) {
          console.error('Signup failed:', error);
          toast('Error al registrarse');
        }
      });
    }

    // Add CSS for animations if not present
    addHeaderStyles();
  };

  // Listen for auth state changes
  window.addEventListener('authStateChanged', (event) => {
    updateHeader(event.detail);
  });

  // Initial header update
  setTimeout(() => {
    const authState = window.deaAuth || { isAuthenticated: false, isLoading: false, user: null };
    updateHeader(authState);
  }, 100);
}

/**
 * Setup user dropdown functionality
 */
function setupUserDropdown() {
  const trigger = document.querySelector('#userMenuBtn');
  const dropdown = document.querySelector('#userDropdown');

  if (!trigger || !dropdown) return;

  // Toggle dropdown
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';

    if (isOpen) {
      closeUserDropdown();
    } else {
      openUserDropdown();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
      closeUserDropdown();
    }
  });

  // Close dropdown on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeUserDropdown();
    }
  });

  // Add hover effects to dropdown items
  const dropdownItems = dropdown.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.background = 'var(--primary-050)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });
  });
}

/**
 * Open user dropdown
 */
function openUserDropdown() {
  const trigger = document.querySelector('#userMenuBtn');
  const dropdown = document.querySelector('#userDropdown');

  if (trigger && dropdown) {
    trigger.setAttribute('aria-expanded', 'true');
    dropdown.style.display = 'block';
    dropdown.style.opacity = '0';
    dropdown.style.transform = 'translateY(-10px)';

    requestAnimationFrame(() => {
      dropdown.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      dropdown.style.opacity = '1';
      dropdown.style.transform = 'translateY(0)';
    });
  }
}

/**
 * Close user dropdown
 */
function closeUserDropdown() {
  const trigger = document.querySelector('#userMenuBtn');
  const dropdown = document.querySelector('#userDropdown');

  if (trigger && dropdown) {
    trigger.setAttribute('aria-expanded', 'false');
    dropdown.style.opacity = '0';
    dropdown.style.transform = 'translateY(-10px)';

    setTimeout(() => {
      dropdown.style.display = 'none';
    }, 200);
  }
}

/**
 * Add header-specific styles
 */
function addHeaderStyles() {
  if (document.querySelector('#header-auth-styles')) return;

  const styles = document.createElement('style');
  styles.id = 'header-auth-styles';
  styles.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .user-menu-trigger {
      display: flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
    }
    
    .user-dropdown {
      animation: fadeInUp 0.2s ease;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .dropdown-item:focus {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
      background: var(--primary-050);
    }
    
    .auth-loading .spinner {
      animation: spin 1s linear infinite;
    }
  `;

  document.head.appendChild(styles);
}

export function toast(text, ms = 4000) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:rgba(17,19,23,.9);color:#fff;padding:.6rem .8rem;border-radius:12px;z-index:70;max-width:min(92vw,680px)';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, ms);
}

// small a11y helpers injection
const style = document.createElement('style');
style.textContent = `.muted{ color: var(--muted); } .visually-hidden{ position:absolute!important;height:1px;width:1px;overflow:hidden;clip:rect(1px,1px,1px,1px);white-space:nowrap; }`;
document.head.appendChild(style);