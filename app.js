import { navigate, initRouter } from './router.js';
import { setupHeader } from './utils.js';
import { initOnboarding } from './onboarding.js';
import { room, seedDatabase, syncFromDB, generateCourseImages, forceResize } from './data.js';
import { mountMiniChat } from './mini-chat.js';

window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#year').textContent = new Date().getFullYear();
  setupHeader();
  initRouter();
  navigate();
  initOnboarding();
  mountMiniChat();
  // expose handy tools on window for ops/debug and WP integration
  window.dea = { room, seedDatabase, syncFromDB, generateCourseImages, forceResize };
});