/* 99 Club Studio · Online Play feedback + modal behaviour v1.62 */
(function(){
'use strict';
let toast=null,toastTimer=0,activeModal=null,lastFocus=null,inerted=[];
const focusable='button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function ensureToast(){if(toast)return toast;toast=document.createElement('div');toast.className='tt99-play-hint-toast';toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.appendChild(toast);return toast;}
function showHint(){setTimeout(()=>{const status=document.getElementById('tt99-play-status');let text=String(status?.textContent||'').trim();if(!text||/^hint shown\.?$/i.test(text)){const how=String(document.getElementById('tt99-play-how-text')?.textContent||'').trim();text=how?`Look at the highlighted part of the puzzle. ${how}`:'Look at the highlighted part of the puzzle and use the rule that restricts it most.';}const t=ensureToast();t.textContent=text;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.hidden=true;},8500);},0);}

document.addEventListener('click',e=>{if(e.target.closest?.('#tt99-play-hint'))showHint();});

function setInert(el,on){if(!el)return;if(on){if(!el.inert){el.inert=true;inerted.push(el);}}else el.inert=false;}
function modalCandidates(){return [...document.querySelectorAll('.tt99-share-dialog:not([hidden]),#tt99-play-complete:not([hidden])')];}
function releaseModal(){for(const el of inerted.splice(0))setInert(el,false);document.documentElement.classList.remove('tt99-modal-open');activeModal=null;const target=lastFocus;lastFocus=null;if(target?.isConnected)setTimeout(()=>target.focus?.(),0);}
function activateModal(modal){if(activeModal===modal)return;if(activeModal)releaseModal();activeModal=modal;lastFocus=document.activeElement;document.documentElement.classList.add('tt99-modal-open');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
  if(modal.classList.contains('tt99-share-dialog')){for(const child of [...document.body.children])if(child!==modal&&child!==toast)setInert(child,true);}else{
    document.querySelectorAll('.masthead,#footer,.search-content').forEach(el=>setInert(el,true));
    const shell=modal.closest('.tt99-play-shell');if(shell)for(const child of [...shell.children])if(child!==modal)setInert(child,true);
  }
  const first=modal.querySelector(focusable);setTimeout(()=>first?.focus(),0);
}
function syncModal(){const open=modalCandidates().at(-1)||null;if(open)activateModal(open);else if(activeModal)releaseModal();}
function closeActive(){if(!activeModal)return;if(activeModal.classList.contains('tt99-share-dialog'))activeModal.querySelector('.tt99-share-close')?.click();else activeModal.hidden=true;setTimeout(syncModal,0);}
function trapKey(e){if(!activeModal)return;if(e.key==='Escape'){e.preventDefault();closeActive();return;}if(e.key!=='Tab')return;const items=[...activeModal.querySelectorAll(focusable)].filter(el=>!el.hidden&&el.getClientRects().length);if(!items.length){e.preventDefault();return;}const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
document.addEventListener('keydown',trapKey,true);
document.addEventListener('focusin',e=>{if(activeModal&&!activeModal.contains(e.target)){e.stopPropagation();activeModal.querySelector(focusable)?.focus();}},true);
new MutationObserver(syncModal).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncModal,{once:true});else syncModal();
})();
