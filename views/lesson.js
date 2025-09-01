import { state } from '../state.js';
import { apiClient } from '../lib/api-client.js';

async function getSignedVideoUrl(videoKey) {
  try {
    const { signedUrl } = await apiClient.post('/video/signed-url', { videoKey });
    return signedUrl;
  } catch (error) {
    console.error('Error fetching signed URL:', error);
    return null;
  }
}

export async function renderLesson(){
  const videoKey = 'lessons/small-talk-work.mp4'; // Example video key
  const videoUrl = await getSignedVideoUrl(videoKey);

  return `
  <section class="section container">
    <h2>Lección: Small Talk en el trabajo</h2>
    <div class="lesson-layout">
      <div>
        <div class="player" role="region" aria-label="Video de lección">
          ${videoUrl ? `
            <video controls width="100%" src="${videoUrl}">
              Tu navegador no soporta el tag de video.
            </video>
          ` : `
            <div class="error-placeholder">
              <i class="ph ph-warning-circle"></i>
              <p>No se pudo cargar el video. Inténtalo de nuevo más tarde.</p>
            </div>
          `}
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

