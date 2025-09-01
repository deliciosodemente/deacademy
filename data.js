import { state } from './state.js';

// Production-ready data layer using localStorage and API
class DataManager {
  constructor() {
    this.collections = new Map();
    this.initializeStorage();
  }

  initializeStorage() {
    // Initialize localStorage collections if they don't exist
    const collections = ['course_v2', 'thread_v1', 'profile_v1'];
    collections.forEach(name => {
      if (!localStorage.getItem(`dea_${name}`)) {
        localStorage.setItem(`dea_${name}`, JSON.stringify([]));
      }
    });
  }

  collection(name) {
    return {
      getList: () => {
        try {
          return JSON.parse(localStorage.getItem(`dea_${name}`) || '[]');
        } catch (e) {
          console.warn(`Failed to load collection ${name}:`, e);
          return [];
        }
      },
      create: async (data) => {
        try {
          const items = this.collection(name).getList();
          const newItem = { id: Date.now(), created_at: new Date().toISOString(), ...data };
          items.push(newItem);
          localStorage.setItem(`dea_${name}`, JSON.stringify(items));
          return newItem;
        } catch (e) {
          console.error(`Failed to create item in ${name}:`, e);
          throw e;
        }
      },
      update: async (id, data) => {
        try {
          const items = this.collection(name).getList();
          const index = items.findIndex(item => item.id === id);
          if (index !== -1) {
            items[index] = { ...items[index], ...data, updated_at: new Date().toISOString() };
            localStorage.setItem(`dea_${name}`, JSON.stringify(items));
            return items[index];
          }
          throw new Error(`Item with id ${id} not found`);
        } catch (e) {
          console.error(`Failed to update item in ${name}:`, e);
          throw e;
        }
      },
      filter: (criteria) => ({
        getList: () => {
          const items = this.collection(name).getList();
          return items.filter(item => {
            return Object.keys(criteria).every(key => item[key] === criteria[key]);
          });
        }
      })
    };
  }
}

const dataManager = new DataManager();

async function seedDatabase() {
  // seed courses if empty
  const cCol = dataManager.collection('course_v2');
  if ((cCol.getList() || []).length === 0) {
    for (const c of state.courses) {
      await cCol.create({
        level: c.level,
        type: c.type,
        title: c.title,
        img: c.img,
        blurb: c.blurb,
        premium: !!c.premium,
      });
    }
  }
  // seed threads if empty
  const tCol = dataManager.collection('thread_v1');
  if ((tCol.getList() || []).length === 0) {
    for (const t of state.threads) {
      await tCol.create({
        title: t.title,
        author: t.author,
      });
    }
  }
}

async function syncFromDB() {
  // sync courses
  const coursesRec = dataManager.collection('course_v2').getList();
  if (coursesRec && coursesRec.length) {
    state.courses = coursesRec.map((r, i) => ({
      id: i + 1,
      level: r.level,
      type: r.type,
      title: r.title,
      img: r.img,
      blurb: r.blurb,
      premium: !!r.premium,
    }));
  }
  // sync threads
  const threadsRec = dataManager.collection('thread_v1').getList();
  if (threadsRec && threadsRec.length) {
    state.threads = threadsRec.map(r => ({
      id: r.id,
      title: r.title,
      author: r.username || r.author || 'Usuario',
      time: dayjs(r.created_at),
    }));
  }
  // trigger re-render
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

async function generateCourseImages() {
  // Use placeholder images for courses - in production, integrate with your preferred image service
  const placeholderImages = [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=450&fit=crop'
  ];

  for (let i = 0; i < state.courses.length; i++) {
    const c = state.courses[i];
    if (!c.img || c.img.includes('websim')) {
      c.img = placeholderImages[i % placeholderImages.length];

      // try to persist if a matching record exists (by title)
      const match = dataManager.collection('course_v2').filter({ title: c.title }).getList()[0];
      if (match) {
        await dataManager.collection('course_v2').update(match.id, { img: c.img });
      }
    }
  }
  // trigger re-render
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

async function upsertCurrentUserProfile(auth0User) {
  try {
    if (!auth0User) return;

    const col = dataManager.collection('profile_v1');
    const existing = col.filter({ auth0_sub: auth0User.sub }).getList()[0];
    const payload = {
      auth0_sub: auth0User.sub,
      name: auth0User.name || auth0User.email?.split('@')[0] || 'Usuario',
      picture: auth0User.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth0User.name || 'Usuario')}&background=0a66ff&color=fff`,
      email: auth0User.email,
      persona: state.persona || null
    };
    state.currentProfile = existing ? await col.update(existing.id, payload) : await col.create(payload);
  } catch (e) {
    console.warn('upsert profile failed', e);
  }
}

function forceResize() {
  try {
    window.dispatchEvent(new Event('resize'));
    const h = Math.max(600, document.documentElement.scrollHeight || document.body.scrollHeight || 0);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'DEA_WIDGET_HEIGHT', h }, '*');
    }
  } catch (e) {
    console.warn('forceResize error', e);
  }
}

export { dataManager, seedDatabase, syncFromDB, generateCourseImages, forceResize, upsertCurrentUserProfile };