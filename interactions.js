import { $, $$, clamp, toast } from './utils.js';
import { state } from './state.js';
import { mountTutorFAB, selectionLookup } from './tutor.js';
import { dataManager } from './data.js';

export function enhance() {
  // Course filters
  const grid = document.querySelector('#coursesGrid');
  if (grid) {
    const search = document.querySelector('#search');
    const chips = $$('.chip');
    let level = 'Todos', type = 'Todos', q = '';
    function apply() {
      const results = state.courses.filter(c => {
        const byLevel = level === 'Todos' || c.level === level;
        const byType = type === 'Todos' || c.type === type;
        const byQ = !q || (c.title + c.blurb).toLowerCase().includes(q);
        return byLevel && byType && byQ;
      });
      grid.innerHTML = results.map(c => `
        <article class="card" role="article">
          <div class="card-media"><img src="${c.img}" alt="Imagen del curso ${c.title}"></div>
          <div class="card-body">
            <span class="tag ${c.level === 'Básico' ? 'basic' : c.level === 'Intermedio' ? 'intermediate' : 'advanced'}"><i class="ph ph-graduation-cap"></i>${c.level} • ${c.type}${c.premium ? ' • Premium' : ''}</span>
            <h3>${c.title}</h3>
            <p class="muted">${c.blurb}</p>
            <div style="margin-top:.35rem;display:flex;gap:.5rem">
              <a class="btn btn-primary" href="#/lesson">Empezar</a>
              <button class="btn btn-ghost" aria-label="Ver detalles de ${c.title}" data-course="${c.id}">Detalles</button>
              ${c.premium ? `<button class="btn btn-primary" data-buy="${c.id}"><i class="ph ph-credit-card"></i> Suscribirse</button>` : ''}
            </div>
          </div>
        </article>`).join('') || `<p>No se encontraron cursos.</p>`;
      // attach buy handlers
      grid.querySelectorAll('[data-buy]').forEach(btn => {
        btn.addEventListener('click', () => {
          const link = window.deaConfig?.stripePaymentLink;
          if (link) { window.open(link, '_blank', 'noopener'); }
          else { toast('Configura window.deaConfig.stripePaymentLink para habilitar el pago.'); }
        });
      });
    }
    search?.addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); apply(); });
    chips.forEach(ch => {
      ch.addEventListener('click', () => {
        const filter = ch.dataset.filter, val = ch.dataset.value;
        $$('.chip[data-filter="' + filter + '"]').forEach(x => x.setAttribute('aria-pressed', 'false'));
        ch.setAttribute('aria-pressed', 'true');
        if (filter === 'level') level = val;
        if (filter === 'type') type = val;
        apply();
      });
    });
  }

  // Lesson quiz
  const options = $$('.option');
  if (options.length) {
    let selected = null;
    options.forEach(opt => {
      opt.addEventListener('click', () => select(opt));
      opt.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(opt); }
      });
    });
    function select(opt) {
      options.forEach(o => o.setAttribute('aria-checked', 'false'));
      opt.setAttribute('aria-checked', 'true');
      selected = opt;
    }
    document.querySelector('#submitQuiz')?.addEventListener('click', () => {
      const fb = document.querySelector('#quizFeedback');
      if (!selected) { fb.textContent = 'Selecciona una opción.'; fb.className = 'feedback'; return; }
      const ok = selected.dataset.correct === 'true';
      fb.textContent = ok ? '¡Correcto! Pregunta abierta y amable.' : 'No es ideal. Evita preguntas invasivas o negativas al iniciar.';
      fb.className = 'feedback ' + (ok ? 'correct' : 'incorrect');
      if (ok) {
        state.progress = clamp(state.progress + 8, 0, 100);
        const bar = document.querySelector('.progress > span');
        if (bar) bar.style.width = state.progress + '%';
      }
    });
  }

  // Community composer
  const postBtn = document.querySelector('#postBtn');
  if (postBtn) {
    postBtn.addEventListener('click', async () => {
      const title = document.querySelector('#postTitle').value.trim();
      const body = document.querySelector('#postBody').value.trim();
      if (!title || !body) { alert('Completa título y contenido.'); return; }
      try {
        if (window.deaAuth?.user) { await dataManager.collection('thread_v1').create({ title, body }); }
        else { state.threads.unshift({ id: 't' + Math.random().toString(16).slice(2), title, author: 'Tú', time: dayjs() }); }
      } catch (e) { state.threads.unshift({ id: 't' + Math.random().toString(16).slice(2), title, author: 'Tú', time: dayjs() }); }
      location.hash = '#/community';
      // rely on hashchange listener to re-render
    });
  }

  // Lesson: AI Tutor + Generative exercises
  if (location.hash.includes('/lesson')) {
    mountTutorFAB();
    document.querySelector('#genMore')?.addEventListener('click', async () => {
      const btn = document.querySelector('#genMore'); btn.disabled = true; btn.textContent = 'Generando...';
      const interests = state.persona?.intereses?.join(', ') || 'general';
      const messages = [
        { role: 'system', content: 'Eres un generador de ejercicios de inglés conciso. Devuelve 3 oraciones para practicar Present Perfect con contexto actual y cercano a los intereses del usuario.' },
        { role: 'user', content: `Intereses: ${interests}. Nivel aproximado: ${state.persona?.nivel || 'Intermedio'}.` }
      ];
      try {
        const completion = await callAIService({ messages });
        const out = document.createElement('div');
        out.className = 'card';
        out.innerHTML = `<div class="card-body"><h3>Nuevos ejercicios</h3><ol>${completion.content.split('\n').map(l => l.trim()).filter(Boolean).map(x => `<li>${x}</li>`).join('')}</ol></div>`;
        document.querySelector('.lesson-panel')?.appendChild(out);
      } finally {
        btn.disabled = false; btn.textContent = '¡Desafíame!';
      }
    });

    document.addEventListener('mouseup', selectionLookup);
    document.addEventListener('keyup', e => { if (e.key === 'Shift') selectionLookup(); });
  }

  if (!enhance._motivationTimer) {
    enhance._motivationTimer = setTimeout(() => toast("¡Lo estás haciendo genial! 5 minutos más y desbloqueas 'Constancia Diaria'."), 30000);
  }
}

// Production AI service integration
async function callAIService(options) {
  try {
    // Replace with your AI service endpoint (OpenAI, Azure OpenAI, etc.)
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAccessToken()}`
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    return { content: data.content || 'Lo siento, no pude procesar tu consulta en este momento.' };
  } catch (error) {
    console.error('AI service error:', error);

    // Fallback educational content
    return {
      content: `
        <h3>Información sobre esta palabra/frase</h3>
        <p>Esta es una palabra/frase importante en inglés. Te recomendamos:</p>
        <ul>
          <li>Practicar su pronunciación</li>
          <li>Usarla en diferentes contextos</li>
          <li>Revisar ejemplos similares</li>
        </ul>
        <p><em>Servicio de IA temporalmente no disponible. Contenido educativo básico mostrado.</em></p>
      `
    };
  }
}

async function getAccessToken() {
  if (window.deaAuth?.manager) {
    return await window.deaAuth.manager.getAccessToken();
  }
  return null;
}