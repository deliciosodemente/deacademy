import { $, $$, clamp, toast } from './utils.js';
import { state, updateProgress } from './state.js';
import { mountTutorFAB, selectionLookup } from './tutor.js';
import { withErrorHandling } from './src/error-handler.js';

export const enhance = withErrorHandling(() => {
  // Course filters
  const grid = document.querySelector('#coursesGrid');
  if (grid){
    const search = document.querySelector('#search');
    const chips = $$('.chip');
    let level='Todos', type='Todos', q='';
    function apply(){
      const results = state.courses.filter(c=>{
        const byLevel = level==='Todos' || c.level===level;
        const byType = type==='Todos' || c.type===type;
        const byQ = !q || (c.title+c.blurb).toLowerCase().includes(q);
        return byLevel && byType && byQ;
      });
      grid.innerHTML = results.map(c=>`
        <article class="card" role="article">
          <div class="card-media"><img src="${c.img}" alt="Imagen del curso ${c.title}"></div>
          <div class="card-body">
            <span class="tag ${c.level === 'Básico' ? 'basic' : c.level === 'Intermedio' ? 'intermediate' : 'advanced'}"><i class="ph ph-graduation-cap"></i>${c.level} • ${c.type}</span>
            <h3>${c.title}</h3>
            <p class="muted">${c.blurb}</p>
            <div style="margin-top:.35rem;display:flex;gap:.5rem">
              <a class="btn btn-primary" href="#/lesson">Empezar</a>
              <button class="btn btn-ghost" aria-label="Ver detalles de ${c.title}" data-course="${c.id}">Detalles</button>
            </div>
          </div>
        </article>`).join('') || `<p>No se encontraron cursos.</p>`;
    }
    search?.addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); apply(); });
    chips.forEach(ch=>{
      ch.addEventListener('click', ()=>{
        const filter = ch.dataset.filter, val = ch.dataset.value;
        $$('.chip[data-filter="'+filter+'"]').forEach(x=>x.setAttribute('aria-pressed','false'));
        ch.setAttribute('aria-pressed','true');
        if (filter==='level') level = val;
        if (filter==='type') type = val;
        apply();
      });
    });
  }

  // Lesson quiz
  const options = $$('.option');
  if (options.length){
    let selected = null;
    options.forEach(opt=>{
      opt.addEventListener('click', ()=>select(opt));
      opt.addEventListener('keydown', e=>{
        if (e.key==='Enter' || e.key===' '){ e.preventDefault(); select(opt); }
      });
    });
    function select(opt){
      options.forEach(o=>o.setAttribute('aria-checked','false'));
      opt.setAttribute('aria-checked','true');
      selected = opt;
    }
    document.querySelector('#submitQuiz')?.addEventListener('click', ()=>{
      const fb = document.querySelector('#quizFeedback');
      if (!selected){ fb.textContent = 'Selecciona una opción.'; fb.className='feedback'; return; }
      const ok = selected.dataset.correct === 'true';
      fb.textContent = ok ? '¡Correcto! Pregunta abierta y amable.' : 'No es ideal. Evita preguntas invasivas o negativas al iniciar.';
      fb.className = 'feedback ' + (ok ? 'correct' : 'incorrect');
      if (ok){
        const newProgress = updateProgress(8);
        const bar = document.querySelector('.progress > span');
        if (bar) bar.style.width = newProgress + '%';
      }
    });
  }

  // Community composer
  const postBtn = document.querySelector('#postBtn');
  if (postBtn){
    postBtn.addEventListener('click', ()=>{
      const title = document.querySelector('#postTitle').value.trim();
      const body = document.querySelector('#postBody').value.trim();
      if (!title || !body){ alert('Completa título y contenido.'); return; }
      state.threads.unshift({ id: 't'+Math.random().toString(16).slice(2), title, author: 'Tú', time: dayjs() });
      location.hash = '#/community';
      // rely on hashchange listener to re-render
    });
  }

  // Lesson: AI Tutor + Generative exercises
  if (location.hash.includes('/lesson')){
    mountTutorFAB();
    document.querySelector('#genMore')?.addEventListener('click', async ()=>{
      const btn = document.querySelector('#genMore'); btn.disabled = true; btn.textContent = 'Generando...';
      const interests = state.persona?.intereses?.join(', ') || 'general';
      const messages = [
        { role:'system', content:'Eres un generador de ejercicios de inglés conciso. Devuelve 3 oraciones para practicar Present Perfect con contexto actual y cercano a los intereses del usuario.' },
        { role:'user', content:`Intereses: ${interests}. Nivel aproximado: ${state.persona?.nivel || 'Intermedio'}.` }
      ];
      try{
        const completion = await websim.chat.completions.create({ messages });
        const out = document.createElement('div');
        out.className='card';
        out.innerHTML = `<div class="card-body"><h3>Nuevos ejercicios</h3><ol>${completion.content.split('\n').map(l=>l.trim()).filter(Boolean).map(x=>`<li>${x}</li>`).join('')}</ol></div>`;
        document.querySelector('.lesson-panel')?.appendChild(out);
      }finally{
        btn.disabled = false; btn.textContent = '¡Desafíame!';
      }
    });

    document.addEventListener('mouseup', selectionLookup);
    document.addEventListener('keyup', e=>{ if(e.key==='Shift') selectionLookup(); });
  }

  if (!enhance._motivationTimer){
    enhance._motivationTimer = setTimeout(()=>toast("¡Lo estás haciendo genial! 5 minutos más y desbloqueas 'Constancia Diaria'."), 30000);
  }
}, 'UI Enhancement');