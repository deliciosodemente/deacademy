export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
export const clamp = (v,min,max)=> Math.max(min, Math.min(max, v));

export function focusMain(){ requestAnimationFrame(()=> document.querySelector('#app')?.focus()); }

export function setupHeader(){
  const btn = document.querySelector('#navToggle');
  const mobile = document.querySelector('#mobileNav');
  btn?.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    mobile.setAttribute('aria-expanded', String(!expanded));
    mobile.style.display = expanded ? 'none' : 'block';
  });
}

export function toast(text, ms=4000){
  const t = document.createElement('div');
  t.style.cssText='position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:rgba(17,19,23,.9);color:#fff;padding:.6rem .8rem;border-radius:12px;z-index:70;max-width:min(92vw,680px)';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.transition='opacity .3s'; t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, ms);
}

// small a11y helpers injection
const style = document.createElement('style');
style.textContent = `.muted{ color: var(--muted); } .visually-hidden{ position:absolute!important;height:1px;width:1px;overflow:hidden;clip:rect(1px,1px,1px,1px);white-space:nowrap; }`;
document.head.appendChild(style);