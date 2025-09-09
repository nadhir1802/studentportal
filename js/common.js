/* common helpers - loaded on every page */
(function(){
  function loadData(key, fallback){
    try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : (fallback === undefined ? [] : fallback); }
    catch(e){ return fallback === undefined ? [] : fallback; }
  }
  function saveData(key, data){ localStorage.setItem(key, JSON.stringify(data)); }

  function uid(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function getProfile(){
    const p = JSON.parse(localStorage.getItem('profile') || 'null');
    return p;
  }

  function ensureProfileId(){
    const p = getProfile();
    if(!p) return null;
    if(!p.id){ p.id = uid(); saveData('profile', p); }
    return p;
  }

  function initials(str){
    if(!str) return '?';
    return str.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
  }

  function avatarColor(seed){
    // deterministic-ish color from string
    let h = 0;
    for(let i=0;i<seed.length;i++){ h = (h<<5) - h + seed.charCodeAt(i); h = h & h; }
    const hue = Math.abs(h) % 360;
    return `linear-gradient(135deg,hsl(${hue} 70% 45%), hsl(${(hue+40)%360} 60% 60%))`;
  }

  function renderUserBadge(){
    const containerList = document.querySelectorAll('#userBadge');
    const profile = getProfile();
    containerList.forEach(c=>{
      if(!profile || !profile.name){
        c.innerHTML = `<a class="btn" href="profile.html">Set up profile</a>`;
      } else {
        const av = `<div class="user-av" style="background:${avatarColor(profile.name)}">${initials(profile.name)}</div>`;
        c.innerHTML = `${av}<div class="user-name">${profile.name} <div class="small-note">${profile.course || ''}</div></div>`;
      }
    });
  }

  /* small confetti implementation */
  function confettiBurst(count = 18){
    const wrapper = document.getElementById('confetti-wrapper');
    if(!wrapper) return;
    for(let i=0;i<count;i++){
      const el = document.createElement('div');
      el.className = 'confetti';
      const size = Math.random()*10+6;
      el.style.width = `${size}px`; el.style.height = `${size}px`;
      el.style.left = `${Math.random()*100}vw`;
      el.style.background = `hsl(${Math.random()*360} 80% 60%)`;
      el.style.transform = `translateY(-20vh) rotate(${Math.random()*360}deg)`;
      el.style.opacity = 1;
      el.style.animationDuration = 1000 + Math.random()*700 + 'ms';
      wrapper.appendChild(el);
      setTimeout(()=> el.remove(), 2000);
    }
  }

  /* expose to global */
  window.CC = {
    loadData, saveData, uid, getProfile, ensureProfileId, initials, avatarColor,
    renderUserBadge, confettiBurst
  };

  // auto-render badge at load
  document.addEventListener('DOMContentLoaded', ()=>{ window.CC.renderUserBadge(); });

})();