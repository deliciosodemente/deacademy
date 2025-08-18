// Minimal Auth0 SPA helper (ESM)
// Usage: import nothing — this file wires login/logout and token management for a simple app.
// It depends on the Auth0 SDK (we'll use the CDN UMD via dynamic import). If you prefer ESM bundle,
// swap the dynamic import to the ESM path.

const cfg = window.AUTH0_CONFIG || {};
if (!cfg.domain || !cfg.clientId) {
    console.warn('Auth0 config not set (window.AUTH0_CONFIG)');
}

let auth0 = null;
let token = null;

async function loadAuth0() {
    if (auth0) return auth0;
    // load the Auth0 SPA SDK from CDN (UMD build)
    const script = document.createElement('script');
    script.src = 'https://cdn.auth0.com/js/auth0-spa-js/1.24/auth0-spa-js.production.js';
    script.async = true;
    document.head.appendChild(script);
    await new Promise((res) => { script.onload = res; script.onerror = res; });
    if (!window.createAuth0Client) {
        console.warn('Auth0 SDK failed to load');
        return null;
    }
    auth0 = await window.createAuth0Client({
        domain: cfg.domain,
        client_id: cfg.clientId,
        cacheLocation: 'localstorage',
        useRefreshTokens: true,
        audience: cfg.audience || undefined,
    });
    return auth0;
}

async function initAuth() {
    const a = await loadAuth0();
    if (!a) return;

    // Handle redirect callback
    if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
        try {
            const result = await a.handleRedirectCallback();
            console.log('Auth redirect handled', result);
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
            console.error('Redirect callback error', err);
        }
    }

    const isAuthenticated = await a.isAuthenticated();
    if (isAuthenticated) {
        token = await a.getTokenSilently();
        onAuthStateChanged(true);
    } else {
        onAuthStateChanged(false);
    }
}

function onAuthStateChanged(isAuth) {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    if (isAuth) {
        loginBtn.textContent = 'Cerrar sesión';
        loginBtn.onclick = logout;
        signupBtn.style.display = 'none';
    } else {
        loginBtn.textContent = 'Iniciar sesión';
        loginBtn.onclick = login;
        signupBtn.style.display = '';
    }
}

async function login() {
    const a = await loadAuth0();
    if (!a) return;
    await a.loginWithRedirect({
        authorizationParams: {
            redirect_uri: window.location.origin + window.location.pathname,
        }
    });
}

async function logout() {
    const a = await loadAuth0();
    if (!a) return;
    // Clear local token cache
    token = null;
    a.logout({ logoutParams: { returnTo: window.location.origin } });
}

async function getAccessToken() {
    if (token) return token;
    const a = await loadAuth0();
    if (!a) return null;
    try {
        token = await a.getTokenSilently();
        return token;
    } catch (err) {
        console.warn('Token silent retrieval failed', err);
        return null;
    }
}

// Helper to call protected API endpoints with the token
export async function authFetch(url, opts = {}) {
    const t = await getAccessToken();
    opts.headers = opts.headers || {};
    if (t) opts.headers['Authorization'] = `Bearer ${t}`;
    const res = await fetch(url, opts);
    return res;
}

// Expose some helpers to window for quick use from dev console or other modules
window.deacademyAuth = {
    init: initAuth,
    login,
    logout,
    getAccessToken,
    authFetch,
};

// auto-init
initAuth().catch((e) => console.error('Auth init failed', e));
