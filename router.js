import { enhance } from './interactions.js';
import { focusMain } from './utils.js';
import { errorHandler, withErrorHandling } from './src/error-handler.js';
import { updatePageInfo } from './src/seo-manager.js';
import { renderHome } from './views/home.js';
import { renderCourses } from './views/courses.js';
import { renderLesson } from './views/lesson.js';
import { renderCommunity } from './views/community.js';
import { renderProfile } from './views/profile.js';
import { renderNotFound } from './views/notfound.js';

const routes = {
  '/': renderHome,
  '/courses': renderCourses,
  '/lesson': renderLesson,
  '/community': renderCommunity,
  '/profile': renderProfile
};

export function initRouter(){
  // no-op placeholder for future route guards
}

export function navigate() {
  const hash = location.hash.replace('#','') || '/';
  const view = document.querySelector('#app');
  
  try {
    const renderer = routes[hash] || renderNotFound;
    view.innerHTML = renderer();
    enhance();
    focusMain();
    updatePageInfo(hash);
  } catch (error) {
    errorHandler.reportError(error, 'Navigation Error', { route: hash });
    view.innerHTML = renderNotFound();
  }
}

