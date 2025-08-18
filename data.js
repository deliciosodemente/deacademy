import { state } from './state.js';

const room = new WebsimSocket();

async function seedDatabase() {
  // seed courses if empty
  const cCol = room.collection('course_v1');
  if ((cCol.getList() || []).length === 0) {
    for (const c of state.courses) {
      await cCol.create({
        level: c.level,
        type: c.type,
        title: c.title,
        img: c.img,
        blurb: c.blurb,
      });
    }
  }
  // seed threads if empty
  const tCol = room.collection('thread_v1');
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
  const coursesRec = room.collection('course_v1').getList();
  if (coursesRec && coursesRec.length) {
    state.courses = coursesRec.map((r, i) => ({
      id: i + 1,
      level: r.level,
      type: r.type,
      title: r.title,
      img: r.img,
      blurb: r.blurb,
    }));
  }
  // sync threads
  const threadsRec = room.collection('thread_v1').getList();
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
  // generate AI images for all courses and persist if possible
  for (const c of state.courses) {
    try {
      const result = await websim.imageGen({
        prompt: `${c.title}, ${c.type} English course, clean educational photography, diverse people learning, premium lighting`,
        aspect_ratio: '16:9',
      });
      if (result?.url) {
        c.img = result.url;
        // try to persist if a matching record exists (by title)
        const match = room.collection('course_v1').filter({ title: c.title }).getList()[0];
        if (match) {
          await room.collection('course_v1').update(match.id, { img: result.url });
        }
      }
    } catch (e) {
      console.warn('Image generation failed for', c.title, e);
    }
  }
  // trigger re-render
  window.dispatchEvent(new HashChangeEvent('hashchange'));
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

export { room, seedDatabase, syncFromDB, generateCourseImages, forceResize };