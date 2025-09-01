export function mountMiniChat() {
  if (document.querySelector('#miniChatToggle')) return;
  const btn = document.createElement('button');
  btn.id = 'miniChatToggle'; btn.className = 'chat-fab'; btn.innerHTML = '<i class="ph ph-chat-circle-dots"></i>';
  const panel = document.createElement('section');
  panel.className = 'mini-chat'; panel.id = 'miniChat';
  panel.innerHTML = `
    <header>Mini Chat<span style="opacity:.6;font-weight:600"> · IA</span>
      <div style="display:flex;gap:.4rem;align-items:center">
        <button id="miniExit" class="btn btn-ghost" style="padding:.35rem .6rem" aria-label="Salir del Mini Chat">Salir</button>
        <button title="Cerrar" aria-label="Cerrar" style="border:0;background:transparent;cursor:pointer"><i class="ph ph-x"></i></button>
      </div>
    </header>
    <div class="messages" id="miniMsgs" aria-live="polite"></div>
    <div class="composer">
      <input id="miniInput" class="input" placeholder="Escribe aquí..." style="flex:1">
      <button id="miniSend" class="btn btn-primary"><i class="ph ph-arrow-right"></i></button>
    </div>`;
  document.body.appendChild(panel);
  document.body.appendChild(btn);

  const msgsEl = panel.querySelector('#miniMsgs');
  const input = panel.querySelector('#miniInput');
  const send = panel.querySelector('#miniSend');
  const close = panel.querySelector('header button');
  const exitBtn = panel.querySelector('#miniExit');

  let history = [{ role: 'system', content: 'Eres un tutor de inglés breve y claro. Responde en español con ejemplos en inglés cuando sea útil. Máx 2 frases.' }];
  function addMsg(text, me = false) {
    const div = document.createElement('div');
    div.className = 'msg' + (me ? ' me' : '');
    div.textContent = text;
    msgsEl.appendChild(div);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  btn.addEventListener('click', () => { panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex'; input.focus(); });
  close.addEventListener('click', () => { panel.style.display = 'none'; });
  exitBtn.addEventListener('click', () => { panel.style.display = 'none'; });

  async function sendMsg() {
    const text = input.value.trim(); if (!text) return;
    input.value = ''; addMsg(text, true);
    history.push({ role: 'user', content: text });
    const completion = await callAIService({ messages: history.slice(-10) });
    addMsg(completion.content || '...', false);
    history.push({ role: 'assistant', content: completion.content });
  }

  send.addEventListener('click', sendMsg);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

  // Greeting
  setTimeout(() => { addMsg('Hola, ¿en qué parte del inglés te ayudo hoy?'); }, 300);
}

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

    // Fallback responses for chat
    const fallbackResponses = [
      "¡Hola! Estoy aquí para ayudarte con tu aprendizaje de inglés.",
      "¿En qué puedo ayudarte hoy?",
      "¿Tienes alguna pregunta sobre gramática o vocabulario?",
      "¡Excelente pregunta! Te recomiendo practicar más con nuestras lecciones.",
      "¿Te gustaría que te recomiende algunos ejercicios?"
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