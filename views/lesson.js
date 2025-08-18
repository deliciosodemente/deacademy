import { state } from '../state.js';

export function renderLesson(){
  return `
  <section class="section container">
    <h2>Lección: Small Talk en el trabajo</h2>
    <div class="lesson-layout">
      <div>
        <div class="player" role="img" aria-label="Video de lección">
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1400&auto=format&fit=crop" alt="Clase en línea" style="width:100%;height:100%;object-fit:cover;opacity:.9">
        </div>
        <div class="section" style="padding:1rem 0">
          <div class="progress" aria-label="Progreso de la lección">
            <span style="width:${state.progress}%"></span>
          </div>
          <p class="lead" style="margin-top:.5rem">Progreso: <strong>${state.progress}%</strong></p>
        </div>
      </div>
      <aside class="lesson-panel" aria-label="Panel de actividades">
        <div class="card">
          <div class="card-body">
            <h3>Notas clave</h3>
            <ul>
              <li><strong>Break the ice:</strong> expresión para iniciar conversación.</li>
              <li>Usa preguntas abiertas: "How was your weekend?"</li>
              <li>Evita temas polémicos al inicio.</li>
            </ul>
          </div>
        </div>

        <div class="quiz" role="group" aria-labelledby="q1">
          <h3 id="q1">Quiz rápido</h3>
          <p>Elige la mejor respuesta para iniciar una conversación:</p>
          <div class="option" role="radio" tabindex="0" data-correct="false" aria-checked="false">
            <i class="ph ph-circle"></i><span>Why do you look tired?</span>
          </div>
          <div class="option" role="radio" tabindex="0" data-correct="true" aria-checked="false">
            <i class="ph ph-circle"></i><span>How has your day been so far?</span>
          </div>
          <div class="option" role="radio" tabindex="0" data-correct="false" aria-checked="false">
            <i class="ph ph-circle"></i><span>What's your salary?</span>
          </div>
          <button class="btn btn-primary" id="submitQuiz" style="margin-top:.5rem">Comprobar</button>
          <button class="btn btn-ghost" id="genMore" style="margin-top:.5rem">¡Desafíame!</button>
          <div class="feedback" id="quizFeedback" aria-live="polite"></div>
        </div>
      </aside>
    </div>
  </section>`;
}

