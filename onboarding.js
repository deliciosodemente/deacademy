import { state, savePersona } from './state.js';
import { toast } from './utils.js';
import { withErrorHandling } from './src/error-handler.js';

let conversationHistory = [];
export const initOnboarding = withErrorHandling(() => {
  if(state.persona) return;
  const wrap = document.createElement('div');
  wrap.className = 'onboarding';
  wrap.innerHTML = `
    <div class="sheet">
      <div class="glass" style="background:rgba(255,255,255,.55);padding:1rem;border-radius:14px;border:1px solid var(--border)">
        <h2 style="margin:.2rem 0 0">Bienvenido a Digital English Academy</h2>
        <p class="lead" style="margin:.2rem 0 1rem">Conversemos para personalizar tu aprendizaje.</p>
        <div id="chat" class="chat" aria-live="polite">
          <div class="bubble">Hola, soy tu guía IA. ¿Quieres inglés para viajar, para tu trabajo o para ver series sin subtítulos?</div>
        </div>
        <div style="display:flex;gap:.5rem;margin-top:.6rem">
          <input id="msg" class="input" placeholder="Escribe tu respuesta..." style="flex:1">
          <button id="send" class="btn btn-primary">Enviar</button>
          <button id="finish" class="btn btn-ghost">Crear mi plan</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const chatEl = wrap.querySelector('#chat');
  wrap.querySelector('#send').addEventListener('click', ()=>sendMsg());
  wrap.querySelector('#msg').addEventListener('keydown', e=>{ if(e.key==='Enter') sendMsg(); });

  async function sendMsg(){
    const input = wrap.querySelector('#msg');
    const text = input.value.trim(); if(!text) return;
    chatEl.insertAdjacentHTML('beforeend', `<div class="bubble me">${text}</div>`);
    input.value='';
    conversationHistory.push({ role:'user', content:text });
    const completion = await websim.chat.completions.create({
      messages: [
        { role:'system', content:'Eres un agente amable que hace preguntas breves para perfilar objetivos, nivel de confianza, intereses (3-5) y estilo (visual, auditivo, práctico). Responde en 1-2 frases máximo.' },
        ...conversationHistory.slice(-10)
      ],
    });
    chatEl.insertAdjacentHTML('beforeend', `<div class="bubble">${completion.content}</div>`);
    chatEl.parentElement.scrollTop = chatEl.parentElement.scrollHeight;
    conversationHistory.push(completion);
  }

  wrap.querySelector('#finish').addEventListener('click', async ()=>{
    const completion = await websim.chat.completions.create({
      json: true,
      messages: [
        { role:'system', content:`Genera JSON con esta forma y nada más:
{ "persona": string, "titulo": string, "nivel": "Básico" | "Intermedio" | "Avanzado", "intereses": string[], "estilo": "visual" | "auditivo" | "practico" }` },
        ...conversationHistory.slice(-10),
        { role:'user', content:'Crea mi Learning Persona basada en nuestra conversación. Solo JSON.' }
      ],
    });
    const p = JSON.parse(completion.content);
    savePersona(p);
    toast(`¡Listo! Te asignamos: ${p.titulo || p.persona}`);
    wrap.remove();
    if (location.hash==='#/profile'){
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  });
}, 'Onboarding');