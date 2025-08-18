import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
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
async function hydrateFromApi() {
  try {
    const cRes = await fetch('/api/courses');
    if (cRes.ok) {
      const courses = await cRes.json();
      state.courses = courses.map(c => ({ ...c }));
    }
    const tRes = await fetch('/api/threads');
    if (tRes.ok) {
      const threads = await tRes.json();
      // convert times to dayjs objects when present
      state.threads = threads.map(t => ({ ...t, time: t.time ? dayjs(t.time) : dayjs() }));
    }
  } catch (e) {
    // API unavailable; keep defaults
    console.info('API not available, using local state');
  }
}

hydrateFromApi();