import { state } from './state.js';
import { toast } from './utils.js';

export function mountTutorFAB(){
  if(document.querySelector('#tutorFab')) return;
  const btn = document.createElement('button');
  btn.id='tutorFab'; btn.className='tutor-fab'; btn.innerHTML='<i class="ph ph-sparkle"></i> Tutor IA';
  btn.addEventListener('click', ()=>toast('Selecciona una palabra o frase y el tutor te ayudará.'));
  document.body.appendChild(btn);
}

export async function selectionLookup(){
  const sel = String(window.getSelection()).trim();
  if(!sel) return;
  const personaHint = state.persona?.intereses?.[0] || 'general';
  const messages = [
    { role:'system', content:'Define en inglés simple y da 1-2 sinónimos y 1 ejemplo adaptado al interés indicado. Responde en español + ejemplo en inglés.' },
    { role:'user', content:`Palabra o frase: "${sel}". Interés: ${personaHint}. Nivel: ${state.persona?.nivel || 'Intermedio'}.` }
  ];
  const completion = await websim.chat.completions.create({ messages });
  toast(completion.content, 6000);
}