import { state } from '../state.js';
import { courseCard } from '../components.js';

export function renderCourses(){
  const levels = ['Todos','Básico','Intermedio','Avanzado'];
  const types = ['Todos','General','Negocios','Exámenes'];
  return `
  <section class="section container">
    <h2>Cursos y niveles</h2>
    <p class="lead">Organización clara por nivel y tipo, con búsqueda y filtros visuales.</p>
    <div class="filters" role="group" aria-label="Filtros de cursos">
      <input class="input" id="search" type="search" placeholder="Buscar cursos..." aria-label="Buscar cursos">
      <div class="filters" id="levelFilters" aria-label="Filtrar por nivel">
        ${levels.map((l,i)=>`<button class="chip" data-filter="level" data-value="${l}" aria-pressed="${i===0?'true':'false'}">${l}</button>`).join('')}
      </div>
      <div class="filters" id="typeFilters" aria-label="Filtrar por tipo">
        ${types.map((t,i)=>`<button class="chip" data-filter="type" data-value="${t}" aria-pressed="${i===0?'true':'false'}">${t}</button>`).join('')}
      </div>
    </div>
    <div class="grid courses-grid" id="coursesGrid">
      ${state.courses.map(courseCard).join('')}
    </div>
  </section>
`;
}