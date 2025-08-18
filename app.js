import { navigate, initRouter } from './router.js';
import { setupHeader } from './utils.js';
import { initOnboarding } from './onboarding.js';

window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#year').textContent = new Date().getFullYear();
  setupHeader();
  initRouter();
  navigate();
  initOnboarding();
});