import { state } from './state.js';
import { toast } from './utils.js';

let conversationHistory = [];

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

        // Fallback responses for onboarding
        if (options.json) {
            return {
                content: JSON.stringify({
                    persona: "Estudiante motivado",
                    titulo: "Aprendiz de inglés",
                    nivel: "Intermedio",
                    intereses: ["conversación", "gramática", "vocabulario"],
                    estilo: "visual"
                })
            };
        }

        const fallbackResponses = [
            "¡Perfecto! ¿Qué nivel dirías que tienes: básico, intermedio o avanzado?",
            "Interesante. ¿Prefieres aprender viendo, escuchando o practicando?",
            "Genial. ¿Qué temas te interesan más: negocios, viajes, entretenimiento?",
            "Excelente. Con esa información puedo crear tu plan personalizado."
        ];

        return {
            content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
        };
    }
}

async function getAccessToken() {
    if (window.deaAuth?.manager) {
        return await window.deaAuth.manager.getAccessToken();
    }
    return null;
}

export function initOnboarding() {
    if (state.persona) return;
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
          <button id="exitOnboarding" class="btn btn-ghost" aria-label="Salir de onboarding">Salir</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(wrap);
    const chatEl = wrap.querySelector('#chat');
    wrap.querySelector('#send').addEventListener('click', () => sendMsg());
    wrap.querySelector('#msg').addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

    async function sendMsg() {
        const input = wrap.querySelector('#msg');
        const text = input.value.trim(); if (!text) return;
        chatEl.insertAdjacentHTML('beforeend', `<div class="bubble me">${text}</div>`);
        input.value = '';
        conversationHistory.push({ role: 'user', content: text });
        const completion = await callAIService({
            messages: [
                { role: 'system', content: 'Eres un agente amable que hace preguntas breves para perfilar objetivos, nivel de confianza, intereses (3-5) y estilo (visual, auditivo, práctico). Responde en 1-2 frases máximo.' },
                ...conversationHistory.slice(-10)
            ],
        });
        chatEl.insertAdjacentHTML('beforeend', `<div class="bubble">${completion.content}</div>`);
        chatEl.parentElement.scrollTop = chatEl.parentElement.scrollHeight;
        conversationHistory.push(completion);
    }

    wrap.querySelector('#finish').addEventListener('click', async () => {
        const completion = await callAIService({
            json: true,
            messages: [
                {
                    role: 'system', content: `Genera JSON con esta forma y nada más:
{ "persona": string, "titulo": string, "nivel": "Básico" | "Intermedio" | "Avanzado", "intereses": string[], "estilo": "visual" | "auditivo" | "practico" }` },
                ...conversationHistory.slice(-10),
                { role: 'user', content: 'Crea mi Learning Persona basada en nuestra conversación. Solo JSON.' }
            ],
        });
        const p = JSON.parse(completion.content);
        state.persona = p; localStorage.setItem('dea_persona', JSON.stringify(p)); localStorage.removeItem('fluentleap_persona');
        toast(`¡Listo! Te asignamos: ${p.titulo || p.persona}`);
        wrap.remove();
        if (location.hash === '#/profile') {
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
    });
    wrap.querySelector('#exitOnboarding').addEventListener('click', () => {
        wrap.remove();
    });
}