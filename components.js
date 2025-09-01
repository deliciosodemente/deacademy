import { state } from './state.js';

export function feature(icon, title, text){
  return `
  <div class="feature" role="listitem">
    <i class="ph ${icon}" aria-hidden="true"></i>
    <h3>${title}</h3>
    <p>${text}</p>
  </div>`;
}

export function courseCard(c){
  const tagClass = c.level === 'Básico' ? 'basic' : c.level === 'Intermedio' ? 'intermediate' : 'advanced';
  return `
  <article class="card" role="article" aria-labelledby="c-${c.id}-title">
    <div class="card-media"><img src="${c.img}" alt="Imagen del curso ${c.title}"></div>
    <div class="card-body">
      <span class="tag ${tagClass}"><i class="ph ph-graduation-cap"></i>${c.level} • ${c.type}${c.premium ? ' • Premium' : ''}</span>
      <h3 id="c-${c.id}-title">${c.title}</h3>
      <p class="muted">${c.blurb}</p>
      <div style="margin-top:.35rem;display:flex;gap:.5rem">
        <a class="btn btn-primary" href="#/lesson">Empezar</a>
        <button class="btn btn-ghost" aria-label="Ver detalles de ${c.title}" data-course="${c.id}">Detalles</button>
        ${c.premium ? `<button class="btn btn-primary" data-buy="${c.id}" aria-label="Suscribirse a ${c.title}"><i class="ph ph-credit-card"></i> Suscribirse</button>` : ''}
      </div>
    </div>
  </article>`;
}

export function threadCard(t){
  return `
  <article class="thread">
    <h4>${t.title}</h4>
    <div class="meta">Por ${t.author} • ${t.time.fromNow()}</div>
    <div style="margin-top:.5rem;display:flex;gap:.5rem">
      <button class="btn btn-ghost"><i class="ph ph-arrow-fat-up"></i> Votar</button>
      <button class="btn btn-ghost"><i class="ph ph-chat-circle"></i> Responder</button>
    </div>
  </article>`;
}

export function donutSVG(pct){
  const r=36, c=2*Math.PI*r, off=c - (pct/100)*c;
  return `
  <svg class="donut" viewBox="0 0 100 100" role="img" aria-label="Progreso ${pct}%">
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="#eef1f7" stroke-width="12"/>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="url(#g)" stroke-width="12"
      stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round" transform="rotate(-90 50 50)"/>
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="var(--primary)"/>
        <stop offset="100%" stop-color="var(--teal)"/>
      </linearGradient>
    </defs>
    <text x="50" y="54" text-anchor="middle" font-size="18" font-weight="700" fill="currentColor">${pct}%</text>
  </svg>`;
}

export function personaBadge(){
  if(!state.persona) return '';
  const p = state.persona;
  return `
  <div class="card" style="margin:1rem 0">
    <div class="card-body" style="display:flex;align-items:center;gap:.75rem">
      <i class="ph ph-user-focus" style="font-size:1.4rem;color:var(--primary)"></i>
      <div>
        <strong>Tu Learning Persona:</strong> ${p.titulo || p.persona}
        <div class="muted" style="margin-top:.2rem">${(p.intereses||[]).slice(0,5).join(' • ')}</div>
      </div>
    </div>
  </div>`;
}