/* 99 Club Studio · shared banner actions v2.0.0
 * Gives every child 99 Club banner the same Contact and embedded Ko-fi panels
 * as the main Studio page. Bindings live on the modal/form nodes themselves so
 * Custom Worksheets may freely rerender #tt99-root without leaving dead popups.
 */
(function(){
'use strict';

const KOFI_URL='https://ko-fi.com/bogdan2618';
let lastKofiOpener=null,lastContactOpener=null,observer=null;

function modalRoot(){
  let root=document.getElementById('tt99-root');
  if(!root){root=document.createElement('div');root.id='tt99-root';root.className='tt99-shared-actions-root';document.body.appendChild(root);}
  return root;
}

function kofiMarkup(){return `<div id="tt99-kofi-modal" class="tt99-kofi-modal" hidden>
  <button type="button" class="tt99-kofi-backdrop" data-kofi-close aria-label="Close Ko-fi support panel"></button>
  <section class="tt99-kofi-card" role="dialog" aria-modal="true" aria-labelledby="tt99-kofi-title">
    <button type="button" class="tt99-kofi-close" data-kofi-close aria-label="Close Ko-fi support panel">×</button>
    <div class="tt99-kofi-heading"><img src="/assets/99club/images/kofi-cup.png?v=19.4" alt="" aria-hidden="true"><div><span>Support 99 Club Studio</span><h2 id="tt99-kofi-title">Buy me a coffee</h2></div></div>
    <p>Support the free classroom tools without leaving this page. The payment panel below is provided securely by Ko-fi.</p>
    <div id="tt99-kofi-panel" class="tt99-kofi-panel"><div class="tt99-kofi-loading">Loading Ko-fi…</div></div>
    <div class="tt99-kofi-fallback">If the panel does not load, <a href="${KOFI_URL}" target="_blank" rel="noopener">open Ko-fi in a new tab</a>.</div>
  </section>
</div>`;}

function contactMarkup(){return `<div id="tt99-contact-modal" class="tt99-contact-modal" hidden>
  <button type="button" class="tt99-contact-backdrop" data-contact-close aria-label="Close contact form"></button>
  <section class="tt99-contact-card" role="dialog" aria-modal="true" aria-labelledby="tt99-contact-title">
    <button type="button" class="tt99-contact-close" data-contact-close aria-label="Close contact form">×</button>
    <span class="tt99-contact-kicker">99 Club Studio</span><h2 id="tt99-contact-title">Contact</h2>
    <p>Questions, feedback or something not working? Send me a message about 99 Club Studio.</p>
    <form id="tt99-contact-form">
      <label><span>Name <small>(optional)</small></span><input id="tt99-contact-name" name="name" type="text" maxlength="80" autocomplete="name"></label>
      <label><span>Your email</span><input id="tt99-contact-email" name="email" type="email" maxlength="160" autocomplete="email" required placeholder="So I can reply"></label>
      <label><span>Message</span><textarea id="tt99-contact-message" name="message" rows="6" maxlength="2000" required placeholder="What would you like to tell me?"></textarea></label>
      <label class="tt99-contact-honey" aria-hidden="true"><span>Leave this empty</span><input id="tt99-contact-honey" name="_honey" type="text" tabindex="-1" autocomplete="off"></label>
      <div class="tt99-contact-actions"><button type="submit" class="tt99-contact-send">Send message</button></div>
      <div id="tt99-contact-status" class="tt99-contact-status" role="status" aria-live="polite"></div>
      <small class="tt99-contact-note">Only the details you enter in this contact form are sent through FormSubmit to 99 Club Studio. Worksheet, school and logo data stay on your device. Please do not include pupil personal information.</small>
    </form>
  </section>
</div>`;}

function appendMarkup(root,html){const holder=document.createElement('div');holder.innerHTML=html;const node=holder.firstElementChild;if(node)root.appendChild(node);return node;}

function closeKofi(){const modal=document.querySelector('#tt99-root #tt99-kofi-modal');if(!modal)return;modal.hidden=true;document.body.classList.remove('tt99-kofi-open');lastKofiOpener?.focus?.();}
function closeContact(){const modal=document.querySelector('#tt99-root #tt99-contact-modal');if(!modal)return;modal.hidden=true;document.body.classList.remove('tt99-contact-open');lastContactOpener?.focus?.();}

function bindKofi(modal){
  if(!modal||modal.dataset.tt99SharedBound==='1')return;
  modal.dataset.tt99SharedBound='1';
  modal.querySelectorAll('[data-kofi-close]').forEach(btn=>btn.addEventListener('click',closeKofi));
  modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeKofi();}});
}

function bindContact(modal){
  if(!modal||modal.dataset.tt99SharedBound==='1')return;
  modal.dataset.tt99SharedBound='1';
  modal.querySelectorAll('[data-contact-close]').forEach(btn=>btn.addEventListener('click',closeContact));
  modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeContact();}});
  const form=modal.querySelector('#tt99-contact-form');
  form?.addEventListener('submit',async e=>{
    e.preventDefault();if(!form.reportValidity())return;
    const root=modal.closest('#tt99-root')||document;
    const name=(root.querySelector('#tt99-contact-name')?.value||'').trim(),reply=(root.querySelector('#tt99-contact-email')?.value||'').trim(),message=(root.querySelector('#tt99-contact-message')?.value||'').trim(),honey=(root.querySelector('#tt99-contact-honey')?.value||'').trim(),status=root.querySelector('#tt99-contact-status'),send=form.querySelector('.tt99-contact-send');
    if(honey){if(status){status.className='tt99-contact-status is-success';status.textContent='Thanks — your message was submitted.';}form.reset();return;}
    const endpoint=['https://formsubmit.co/ajax/','techtinkerclub','@','gmail.com'].join(''),original=send?.textContent||'Send message';
    if(status){status.className='tt99-contact-status';status.textContent='';}if(send){send.disabled=true;send.textContent='Sending…';}
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({name:name||'Not provided',email:reply,_replyto:reply,message,_subject:`99 Club Studio contact${name?` — ${name}`:''}`,_template:'table',_url:window.location.href})});
      let data=null;try{data=await response.json();}catch(_err){}
      if(!response.ok||(data&&(data.success===false||data.success==='false')))throw new Error((data&&data.message)||`Contact form returned ${response.status}`);
      form.reset();if(status){status.className='tt99-contact-status is-success';status.textContent='Thanks — your message was submitted.';}
    }catch(err){console.error('99 Club contact form:',err);if(status){status.className='tt99-contact-status is-error';status.innerHTML='Sorry, the message could not be sent just now. Please try again, or email <a href="mailto:techtinkerclub@gmail.com">techtinkerclub@gmail.com</a>.';}}
    finally{if(send){send.disabled=false;send.textContent=original;}}
  });
}

function ensureModals(){
  const root=modalRoot();
  let kofi=root.querySelector('#tt99-kofi-modal'),contact=root.querySelector('#tt99-contact-modal');
  if(!kofi)kofi=appendMarkup(root,kofiMarkup());if(!contact)contact=appendMarkup(root,contactMarkup());
  bindKofi(kofi);bindContact(contact);return root;
}

function ensureKofiPanel(root){const panel=root.querySelector('#tt99-kofi-panel');if(!panel||panel.querySelector('iframe'))return;const iframe=document.createElement('iframe');iframe.id='tt99-kofi-iframe';iframe.className='tt99-kofi-iframe';iframe.src='https://ko-fi.com/bogdan2618/?hidefeed=true&widget=true&embed=true&preview=true';iframe.title='Support 99 Club Studio on Ko-fi';iframe.loading='eager';iframe.setAttribute('allow','payment');iframe.addEventListener('load',()=>panel.querySelector('.tt99-kofi-loading')?.remove(),{once:true});panel.appendChild(iframe);}
function openKofi(opener){const root=ensureModals(),modal=root.querySelector('#tt99-kofi-modal');if(!modal)return;lastKofiOpener=opener||document.activeElement;modal.hidden=false;document.body.classList.add('tt99-kofi-open');ensureKofiPanel(root);setTimeout(()=>modal.querySelector('.tt99-kofi-close')?.focus(),0);}
function openContact(opener){const root=ensureModals(),modal=root.querySelector('#tt99-contact-modal');if(!modal)return;lastContactOpener=opener||document.activeElement;modal.hidden=false;document.body.classList.add('tt99-contact-open');setTimeout(()=>modal.querySelector('#tt99-contact-name')?.focus(),0);}

function actionButton(kind,classes){const b=document.createElement('button');b.type='button';b.className=classes;b.setAttribute(kind==='contact'?'data-tt99-contact-open':'data-tt99-kofi-open','');b.setAttribute('aria-haspopup','dialog');b.innerHTML=kind==='contact'?'<span aria-hidden="true">✉</span>Contact':'<img class="tt99-shared-kofi-cup" src="/assets/99club/images/kofi-cup.png?v=19.4" alt="" aria-hidden="true">Buy me a coffee';return b;}

function ensureStyles(){if(document.getElementById('tt99-shared-banner-action-styles'))return;const s=document.createElement('style');s.id='tt99-shared-banner-action-styles';s.textContent='.tt99-shared-kofi-cup{display:block;width:24px;height:20px;object-fit:contain;flex:0 0 24px}.tt99-guide-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:8px}.tt99-guide-actions .tt99-guide-action{margin:0!important}.tt99-guide-actions button.tt99-guide-action,.tt99-custom-hero-actions button.tt99-custom-back{cursor:pointer}@media(max-width:720px){.tt99-guide-actions{justify-content:flex-start}}';document.head.appendChild(s);}

function enhanceBrandTools(){document.querySelectorAll('.tt99-brand-tools').forEach(tools=>{const support=tools.querySelector('.tt99-brand-tool--support');if(support){support.setAttribute('data-tt99-kofi-open','');support.setAttribute('aria-haspopup','dialog');}if(!tools.querySelector('.tt99-brand-tool--contact')){const contact=actionButton('contact','tt99-brand-tool tt99-brand-tool--contact');if(support)tools.insertBefore(contact,support);else tools.appendChild(contact);}});}
function enhanceCustomHero(){document.querySelectorAll('.tt99-custom-hero-actions').forEach(actions=>{if(!actions.querySelector('[data-tt99-contact-open]'))actions.appendChild(actionButton('contact','tt99-secondary tt99-custom-back'));if(!actions.querySelector('[data-tt99-kofi-open]'))actions.appendChild(actionButton('kofi','tt99-secondary tt99-custom-back'));});}
function enhanceGuideHero(){document.querySelectorAll('.tt99-guide-hero').forEach(hero=>{let actions=hero.querySelector(':scope > .tt99-guide-actions');if(!actions){const existing=hero.querySelector(':scope > .tt99-guide-action');if(!existing)return;actions=document.createElement('div');actions.className='tt99-guide-actions';hero.insertBefore(actions,existing);actions.appendChild(existing);}if(!actions.querySelector('[data-tt99-contact-open]'))actions.appendChild(actionButton('contact','tt99-secondary tt99-guide-action'));if(!actions.querySelector('[data-tt99-kofi-open]'))actions.appendChild(actionButton('kofi','tt99-secondary tt99-guide-action'));});}
function enhance(){ensureStyles();enhanceBrandTools();enhanceCustomHero();enhanceGuideHero();}

function delegatedClick(e){const kofi=e.target.closest('[data-tt99-kofi-open]');if(kofi&&!kofi.closest('.tt99-kofi-fallback')){e.preventDefault();openKofi(kofi);return;}const contact=e.target.closest('[data-tt99-contact-open]');if(contact){e.preventDefault();openContact(contact);}}
function boot(){enhance();document.addEventListener('click',delegatedClick);if(document.body&&window.MutationObserver){observer=new MutationObserver(enhance);observer.observe(document.body,{childList:true,subtree:true});}}

window.TT99BannerActions={openKofi,closeKofi,openContact,closeContact,enhance};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
