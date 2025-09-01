import { state } from './state.js';
import { toast } from './utils.js';

export function mountTutorFAB() {
  if (document.querySelector('#tutorFab')) return;
  const btn = document.createElement('button');
  btn.id = 'tutorFab'; btn.className = 'tutor-fab'; btn.innerHTML = '<i class="ph ph-sparkle"></i> Tutor IA';
  btn.addEventListener('click', () => toast('Selecciona una palabra o frase y el tutor te ayudará.'));
  document.body.appendChild(btn);
}

export async function selectionLookup() {
  const sel = String(window.getSelection()).trim();
  if (!sel) return;
  const personaHint = state.persona?.intereses?.[0] || 'general';
  const messages = [
    { role: 'system', content: 'Define en inglés simple y da 1-2 sinónimos y 1 ejemplo adaptado al interés indicado. Responde en español + ejemplo en inglés.' },
    { role: 'user', content: `Palabra o frase: "${sel}". Interés: ${personaHint}. Nivel: ${state.persona?.nivel || 'Intermedio'}.` }
  ];
  // In production, integrate with OpenAI API or your preferred AI service
  const completion = await callAIService(messages);
  toast(completion.content, 6000);
}

// Production AI service integration
async function callAIService(messages) {
  try {
    // Replace with your AI service endpoint (OpenAI, Azure OpenAI, etc.)
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAccessToken()}`
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    return { content: data.content || 'Lo siento, no pude procesar tu consulta en este momento.' };
  } catch (error) {
    console.error('AI service error:', error);
    return { content: 'Servicio de tutoría temporalmente no disponible. Por favor, intenta más tarde.' };
  }
}

async function getAccessToken() {
  if (window.deaAuth?.manager) {
    return await window.deaAuth.manager.getAccessToken();
  }
  return null;
}