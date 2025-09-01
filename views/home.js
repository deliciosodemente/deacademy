import { feature, courseCard } from '../components.js';
import { state } from '../state.js';

export function renderHome(){
  return `
  <section class="hero container">
    <video class="bg-video" autoplay muted loop playsinline aria-hidden="true">
      <source src="https://videos.pexels.com/video-files/3195390/3195390-uhd_2560_1440_25fps.mp4" type="video/mp4">
    </video>
    <div class="glass">
      <span class="eyebrow">Aprende inglés con confianza</span>
      <h1>Domina el inglés con lecciones interactivas, cursos por niveles y una comunidad que te impulsa.</h1>
      <p>Avanza a tu ritmo con rutas personalizadas, profesores nativos y actividades prácticas diseñadas para el mundo real.</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <a class="btn btn-primary" href="#/courses" aria-label="Explorar cursos">Explorar cursos</a>
        <a class="btn btn-ghost" href="#/lesson" aria-label="Probar una lección">Probar una lección</a>
      </div>
      <div class="features">
        ${feature('ph-sliders','Aprendizaje adaptativo','Rutas según tu nivel y objetivos.')}
        ${feature('ph-headset','Profesores nativos','Clases y feedback experto.')}
        ${feature('ph-game-controller','Interactividad','Ejercicios, juegos y retos.')}
        ${feature('ph-users-three','Comunidad','Aprende acompañado y motivado.')}
      </div>
    </div>
    <div class="hero-spacer" aria-hidden="true"></div>
  </section>

  <section class="section container">
    <h2>Beneficios clave</h2>
    <p class="lead">Todo lo que necesitas para progresar con claridad, constancia y motivación.</p>
    <div class="grid courses-grid">
      ${state.courses.slice(0,3).map(courseCard).join('')}
    </div>
  </section>`;
}

