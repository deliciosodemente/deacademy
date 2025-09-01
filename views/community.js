import { state } from '../state.js';
import { threadCard } from '../components.js';

export function renderCommunity(){
  return `
  <section class="section container">
    <h2>Comunidad y foros</h2>
    <p class="lead">Comparte dudas, descubre recursos y celebra tus logros.</p>
    <div class="community">
      <div aria-label="Lista de hilos">
        ${state.threads.map(threadCard).join('')}
      </div>
      <div class="composer" aria-label="Crear publicación">
        <h3>Crear nuevo hilo</h3>
        <label for="postTitle" class="visually-hidden">Título</label>
        <input class="input" id="postTitle" placeholder="Título del hilo" aria-label="Título del hilo" />
        <label for="postBody" class="visually-hidden">Contenido</label>
        <textarea id="postBody" placeholder="Escribe tu mensaje..." aria-label="Contenido del hilo"></textarea>
        <div class="row">
          <div class="badges">
            <span class="badge"><i class="ph ph-hash"></i>Pronunciación</span>
            <span class="badge"><i class="ph ph-hash"></i>Vocabulario</span>
            <span class="badge"><i class="ph ph-hash"></i>Listening</span>
          </div>
          <button class="btn btn-primary" id="postBtn">Publicar</button>
        </div>
      </div>
    </div>
  </section>`;
}

