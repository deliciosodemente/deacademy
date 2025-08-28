import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { cache, cacheAPI } from './src/cache-manager.js';
import { errorHandler, safeAsync } from './src/error-handler.js';

dayjs.extend(relativeTime);
dayjs.locale('es');

// Default local data used if API is unavailable
const defaultCourses = [
  { id: 1, level: 'Básico', type: 'General', title: 'Inglés desde cero', img: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1200&auto=format&fit=crop', blurb: 'Fundamentos para empezar con confianza.' },
  { id: 2, level: 'Intermedio', type: 'Negocios', title: 'Inglés de negocios', img: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?q=80&w=1200&auto=format&fit=crop', blurb: 'Reuniones, emails y presentaciones.' }
];

const defaultThreads = [
  { id: 't1', title: '¿Cómo mejorar la pronunciación de la "TH"?', author: 'Lucía', time: dayjs().subtract(2, 'hour') },
  { id: 't2', title: 'Recomendaciones para escuchar podcasts', author: 'Marco', time: dayjs().subtract(1, 'day') }
];

export const state = {
  courses: defaultCourses,
  threads: defaultThreads,
  activity: [
    { id: 'a1', text: 'Completaste la lección "Present Simple vs Present Continuous"', time: dayjs().subtract(3, 'hour') }
  ],
  progress: 42,
  persona: JSON.parse(localStorage.getItem('dea_persona') || localStorage.getItem('fluentleap_persona') || 'null')
};

// Try to fetch from API and replace local state if available
const hydrateFromApi = safeAsync(async () => {
  // Use cached API calls with 5-minute TTL
  const courses = await cacheAPI('/api/courses');
  if (courses) {
    state.courses = courses.map(c => ({ ...c }));
  }

  const threads = await cacheAPI('/api/threads');
  if (threads) {
    state.threads = threads.map(t => ({ 
      ...t, 
      time: t.time ? dayjs(t.time) : dayjs() 
    }));
  }
}, null, 'API Hydration');

// Enhanced state management with persistence
export const updateProgress = (increment) => {
  const newProgress = Math.max(0, Math.min(100, state.progress + increment));
  state.progress = newProgress;
  
  // Persist to localStorage
  try {
    localStorage.setItem('dea_progress', String(newProgress));
  } catch (e) {
    errorHandler.reportError(e, 'Progress Persistence');
  }
  
  return newProgress;
};

export const savePersona = (persona) => {
  state.persona = persona;
  
  try {
    localStorage.setItem('dea_persona', JSON.stringify(persona));
    // Clean up old key
    localStorage.removeItem('fluentleap_persona');
  } catch (e) {
    errorHandler.reportError(e, 'Persona Persistence');
  }
}

hydrateFromApi();