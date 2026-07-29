/* ================================================================
   SKY DASH: LEGENDS — main.js
   Boots the game: canvas sizing, cinematic intro, input handling
   (keyboard, touch, gamepad), energy regen ticking, and the single
   requestAnimationFrame loop that drives both simulation & render.
   ================================================================ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const VIEW = { W:0, H:0, GROUND_Y:0, DPR:1 };

function resize(){
  VIEW.DPR = Math.min(window.devicePixelRatio||1, SAVE.settings.quality==='low' ? 1 : 2);
  VIEW.W = window.innerWidth; VIEW.H = window.innerHeight;
  canvas.width = VIEW.W*VIEW.DPR; canvas.height = VIEW.H*VIEW.DPR;
  canvas.style.width = VIEW.W+'px'; canvas.style.height = VIEW.H+'px';
  ctx.setTransform(VIEW.DPR,0,0,VIEW.DPR,0,0);
  VIEW.GROUND_Y = VIEW.H*0.78;
}
window.addEventListener('resize', resize);
resize();

/* ---------------- INPUT: KEYBOARD ---------------- */
window.addEventListener('keydown', e=>{
  if (e.code==='Space' || e.key==='ArrowUp' || e.key==='w'){ e.preventDefault(); doJump(); }
  if (e.key==='ArrowDown' || e.key==='s'){ doSlide(); }
  if (e.key==='Shift' || e.key==='e'){ doDash(); }
  if (e.key==='Escape' || e.key==='p'){ togglePause(); }
});

/* ---------------- INPUT: TOUCH ---------------- */
function bindSwipeZone(el, onTap){
  let sy=null, sx=null, st=0;
  el.addEventListener('touchstart', e=>{ const tt=e.changedTouches[0]; sy=tt.clientY; sx=tt.clientX; st=Date.now(); }, {passive:true});
  el.addEventListener('touchend', e=>{
    if (sy===null) return;
    const tt=e.changedTouches[0];
    const dy = tt.clientY - sy, dt = Date.now()-st;
    if (dy > 40 && dt < 500) doSlide();
    else onTap();
    sy = null;
  }, {passive:true});
}
bindSwipeZone(document.getElementById('leftTouchZone'), doJump);
bindSwipeZone(document.getElementById('rightTouchZone'), doJump);
canvas.addEventListener('mousedown', ()=>{ if (Game.state==='playing'||Game.state==='boss') doJump(); });
const dashBtnEl = document.getElementById('dashBtn');
if (dashBtnEl) dashBtnEl.addEventListener('touchstart', e=>{ e.preventDefault(); doDash(); }, {passive:false});

/* ---------------- HAPTICS ----------------
   A thin wrapper so game.js can request a vibration without caring
   whether the device/browser supports it or whether the setting is off. */
function hapticPulse(ms){
  if (SAVE.settings.vibration && navigator.vibrate){ navigator.vibrate(ms); }
}

/* ---------------- INPUT: GAMEPAD ---------------- */
let gamepadIndex = null;
let gpJumpLatch = false, gpSlideLatch = false;
window.addEventListener('gamepadconnected', e=>{
  gamepadIndex = e.gamepad.index;
  const hint = document.getElementById('controllerHint');
  if (hint) hint.textContent = '🎮 Controller: ' + e.gamepad.id.slice(0,28);
});
window.addEventListener('gamepaddisconnected', ()=>{
  gamepadIndex = null;
  const hint = document.getElementById('controllerHint');
  if (hint) hint.textContent = '🎮 Controller: not detected';
});
function pollGamepad(){
  if (gamepadIndex===null) return;
  const gp = navigator.getGamepads()[gamepadIndex];
  if (!gp) return;
  const jumpBtn = gp.buttons[0] && gp.buttons[0].pressed; // A / Cross
  const slideBtn = (gp.buttons[1] && gp.buttons[1].pressed) || (gp.axes[1] > 0.6); // B/Circle or stick down
  const dashBtn = gp.buttons[2] && gp.buttons[2].pressed; // X / Square
  const pauseBtn = gp.buttons[9] && gp.buttons[9].pressed; // Start
  if (jumpBtn && !gpJumpLatch) doJump();
  if (slideBtn && !gpSlideLatch) doSlide();
  if (dashBtn && !gpDashLatch) doDash();
  if (pauseBtn && !gpPauseLatch) togglePause();
  gpJumpLatch = jumpBtn; gpSlideLatch = slideBtn; gpDashLatch = dashBtn; gpPauseLatch = pauseBtn;
}
let gpPauseLatch = false, gpDashLatch = false;

/* ---------------- CINEMATIC INTRO ---------------- */
function playIntro(){
  const intro = document.getElementById('introScreen');
  const skipBtn = document.getElementById('introSkipBtn');
  setTimeout(()=> skipBtn.classList.remove('hidden'), 1400);
  function finish(){
    intro.style.transition = 'opacity .5s ease';
    intro.style.opacity = '0';
    setTimeout(()=>{ intro.classList.add('hidden'); enterMenu(); }, 500);
  }
  skipBtn.addEventListener('click', finish);
  setTimeout(finish, 3200);
}
function enterMenu(){
  showScreen('menuScreen');
  refreshCurrencyLabels();
  checkDailyReward();
}

/* ---------------- MAIN LOOP ---------------- */
let lastT = 0;
let fpsAccum = 0, fpsFrames = 0, fpsTimer = 0;
function loop(t){
  if (!lastT) lastT = t;
  let dt = (t-lastT)/1000;
  dt = Math.min(dt, 0.033);
  lastT = t;

  if (SAVE.settings.showFps){
    fpsFrames++; fpsTimer += dt;
    if (fpsTimer >= 0.5){
      const fps = Math.round(fpsFrames/fpsTimer);
      const el = document.getElementById('fpsCounter');
      if (el){ el.textContent = fps + ' FPS'; el.classList.remove('hidden'); }
      fpsFrames = 0; fpsTimer = 0;
    }
  } else {
    const el = document.getElementById('fpsCounter');
    if (el && !el.classList.contains('hidden')) el.classList.add('hidden');
  }

  pollGamepad();
  updateCountdownUI();

  if (Game.state==='playing' || Game.state==='boss' || Game.state==='bossIntro' || Game.state==='countdown'){
    updateGame(dt);
    updateHud();
  }
  ctx.clearRect(0,0,VIEW.W,VIEW.H);
  renderGame(ctx);

  requestAnimationFrame(loop);
}

/* ---------------- ENERGY TICK ---------------- */
setInterval(()=>{ regenEnergy(); if (!document.getElementById('menuScreen').classList.contains('hidden')) refreshCurrencyLabels(); }, 15000);

/* ---------------- BOOT ---------------- */
regenEnergy();
ensureWeekFresh();
persist();
playIntro();
requestAnimationFrame(loop);
