export function mountMiniChat(){
  if (document.querySelector('#miniChatToggle')) return;
  const btn = document.createElement('button');
  btn.id='miniChatToggle'; btn.className='chat-fab'; btn.innerHTML='<i class="ph ph-chat-circle-dots"></i>';
  const panel = document.createElement('section');
  panel.className='mini-chat'; panel.id='miniChat';
  panel.innerHTML = `
    <header>Mini Chat<span style="opacity:.6;font-weight:600"> · IA</span>
      <button title="Cerrar" aria-label="Cerrar" style="border:0;background:transparent;cursor:pointer"><i class="ph ph-x"></i></button>
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

  let history = [{ role:'system', content:'Eres un tutor de inglés breve y claro. Responde en español con ejemplos en inglés cuando sea útil. Máx 2 frases.' }];
  function addMsg(text, me=false){
    const div = document.createElement('div');
    div.className = 'msg' + (me ? ' me' : '');
    div.textContent = text;
    msgsEl.appendChild(div);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  btn.addEventListener('click', ()=>{ panel.style.display = panel.style.display==='flex' ? 'none' : 'flex'; input.focus(); });
  close.addEventListener('click', ()=>{ panel.style.display='none'; });

  async function sendMsg(){
    const text = input.value.trim(); if(!text) return;
    input.value=''; addMsg(text, true);
    history.push({ role:'user', content:text });
    const completion = await websim.chat.completions.create({ messages: history.slice(-10) });
    addMsg(completion.content || '...', false);
    history.push({ role:'assistant', content: completion.content });
  }

  send.addEventListener('click', sendMsg);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') sendMsg(); });

  // Greeting
  setTimeout(()=>{ addMsg('Hola, ¿en qué parte del inglés te ayudo hoy?'); }, 300);
}