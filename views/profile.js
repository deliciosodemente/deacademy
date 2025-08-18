import { state } from '../state.js';
import { donutSVG, personaBadge, courseCard } from '../components.js';
import { clamp } from '../utils.js';

export function renderProfile(){
  const pct = clamp(state.progress,0,100);
  return `
  <section class="section container">
    <h2>Tu progreso</h2>
    ${personaBadge()}
    <div class="profile-grid">
      <div class="card-kpi">
        ${donutSVG(pct)}
        <div>
          <h3 style="margin:.2rem 0">Curso actual</h3>
          <p class="lead" style="margin:0">Avance general: <strong>${pct}%</strong></p>
        </div>
      </div>
      <div class="card-kpi">
        <div>
          <h3 style="margin:.2rem 0">Insignias</h3>
          <div class="badges">
            <span class="badge"><i class="ph ph-fire-simple" style="color:var(--coral)"></i>Racha x7</span>
            <span class="badge"><i class="ph ph-headphones" style="color:var(--teal)"></i>Listening Pro</span>
            <span class="badge"><i class="ph ph-notebook" style="color:var(--yellow)"></i>Vocab 500</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <h3>Cursos activos</h3>
          <div class="grid courses-grid" style="grid-template-columns:repeat(2,1fr)">
            ${state.courses.slice(0,2).map(courseCard).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <h3>Actividad reciente</h3>
          <ul>
            ${state.activity.map(a=>`<li>${a.text} — <span class="muted">${a.time.fromNow()}</span></li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  </section>`;
}

