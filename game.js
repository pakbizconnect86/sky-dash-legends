/* ================================================================
   SKY DASH: LEGENDS — game.js
   The core simulation: player physics, obstacle/collectible
   spawning, collisions, power-ups, boss battles, and the four
   game modes (Endless, Time Trial, Survival, Story).
   UI screens live in ui.js; this file only knows about the run
   itself and exposes state that ui.js reads to draw the HUD.
   ================================================================ */

const GRAVITY = 1900;
const JUMP_VELOCITY = -720;
const SLIDE_DURATION = 0.5;
const BASE_HEARTS = 3;

let Game = {
  state: 'idle',        // idle | playing | paused | boss | dead | victory
  mode: null,            // 'endless' | 'timeTrial' | 'survival' | 'story'
  worldId: 'forest',
  worldRuntime: null,
  stage: null,           // active STORY_STAGES entry, if mode === 'story'

  player: null,
  obstacles: [], collectibles: [], projectiles: [],
  particles: null,
  boss: null,

  speed: 320, distance: 0, score: 0,
  coinsThisRun: 0, gemsThisRun: 0, powerupsUsedThisRun: 0,
  hitThisRun: false, distanceSinceHit: 0,
  timeLeft: 60,          // used by Time Trial
  spawnTimer: 0, difficultyTimer: 0,
  activePowerups: {},
  screenShake: 0, camZoom: 1, camZoomTarget: 1,
  bgOffset: 0
};

/* ---------------- HERO ABILITY HELPERS ---------------- */
function heroHasAbility(id){ return Game.player && Game.player.charDef.ability === id; }

function maxJumpsForHero(){ return heroHasAbility('triple_jump') ? 3 : 2; }
function powerupDurationMult(kind){
  if (kind==='shield' && heroHasAbility('shield_plus')) return 1.5;
  if (kind==='magnet' && heroHasAbility('magnet_plus')) return 1; // magnet uses radius bonus instead
  if (kind==='freezeTime' && heroHasAbility('freeze_plus')) return 1.5;
  return 1;
}
function magnetRadius(){ return heroHasAbility('magnet_plus') ? 260 : 170; }

/* ---------------- RUN SETUP ---------------- */
function startRun(mode, worldId, stage){
  Game.mode = mode;
  Game.worldId = worldId;
  Game.stage = stage || null;
  const worldDef = WORLDS.find(w=>w.id===worldId) || WORLDS[0];
  Game.worldRuntime = createWorldRuntime(worldDef, VIEW.W, VIEW.H);
  Game.particles = makeParticlePool();

  const heroId = SAVE.selectedHero;
  const charDef = getEffectiveHeroDef(heroId);
  const upSpeed = upgradeTier(heroId,'speed');
  const upMagnet = upgradeTier(heroId,'magnet');
  const upCoin = upgradeTier(heroId,'coin');

  const hearts = mode==='survival' ? 1 : BASE_HEARTS;
  Game.player = {
    x: 110, y: VIEW.GROUND_Y, vy: 0,
    grounded: true, jumps: 0,
    sliding: false, slideT: 0,
    legPhase: 0, charDef,
    hitInvuln: 0,
    hearts, maxHearts: hearts,
    upSpeed, upMagnet, upCoin
  };

  Game.obstacles = []; Game.collectibles = []; Game.projectiles = [];
  Game.boss = null;
  Game.speed = 320 + upSpeed*8;
  Game.distance = 0; Game.score = 0;
  Game.coinsThisRun = 0; Game.gemsThisRun = 0; Game.powerupsUsedThisRun = 0;
  Game.hitThisRun = false; Game.distanceSinceHit = 0;
  Game.timeLeft = 60;
  Game.spawnTimer = 0.8; Game.difficultyTimer = 0;
  Game.activePowerups = { shield:0, magnet:0, doubleCoins:0, speedBoost:0, freezeTime:0, invincible:0, rocket:0 };
  Game.screenShake = 0; Game.camZoom = 1; Game.camZoomTarget = 1;
  Game.bgOffset = 0;

  if (heroHasAbility('ember_start')) Game.activePowerups.speedBoost = 3;

  Game.state = (stage && stage.type==='boss') ? 'bossIntro' : 'playing';
  if (Game.state === 'bossIntro'){
    Game.bossIntroT = 2.2;
  }

  AudioSys.startMusic(worldDef.musicScale, false);
}

/* ---------------- SPAWNING ---------------- */
function spawnPattern(){
  const x = VIEW.W + 60;
  const roll = Math.random();

  if (roll < 0.3){
    Game.obstacles.push({ type:'spike', x, y:VIEW.GROUND_Y, w:34, h:34 });
  } else if (roll < 0.55){
    Game.obstacles.push({ type:'ground', kind:'ground', x, y:VIEW.GROUND_Y-18, w:36, h:36, t:0 });
  } else if (roll < 0.8){
    Game.obstacles.push({ type:'flyer', kind:'flyer', x, y:VIEW.GROUND_Y-64, w:40, h:26, t:Math.random()*10 });
  } else {
    Game.obstacles.push({ type:'mover', x, y:VIEW.GROUND_Y-40, w:30, h:60, t:0, baseY:VIEW.GROUND_Y-40 });
  }

  const cRoll = Math.random();
  if (cRoll < 0.5){
    const n = 3 + Math.floor(Math.random()*4);
    for (let i=0;i<n;i++){
      Game.collectibles.push({ type:'coin', x:x+120+i*34, y:VIEW.GROUND_Y-70-Math.sin(i/n*Math.PI)*40, r:9 });
    }
  } else if (cRoll < 0.66){
    Game.collectibles.push({ type:'gem', x:x+140, y:VIEW.GROUND_Y-100, r:10 });
  } else if (cRoll < 0.8){
    const kind = POWERUP_KEYS[Math.floor(Math.random()*POWERUP_KEYS.length)];
    Game.collectibles.push({ type:'power', kind, x:x+140, y:VIEW.GROUND_Y-90, r:13 });
  }
}

/* ---------------- INPUT ACTIONS ---------------- */
function doJump(){
  if (Game.state !== 'playing' && Game.state !== 'boss') return;
  if (Game.player.sliding) return;
  const maxJ = maxJumpsForHero();
  if (Game.player.jumps < maxJ){
    Game.player.vy = JUMP_VELOCITY * (Game.player.jumps===0?1:0.82);
    Game.player.jumps++;
    Game.player.grounded = false;
    if (Game.player.jumps===1) AudioSys.jump();
    else if (Game.player.jumps===2) AudioSys.doubleJump();
    else AudioSys.tripleJump();
    Game.particles.sparkle(Game.player.x, Game.player.y, '#ffffff');
  }
}
function doSlide(){
  if (Game.state !== 'playing' && Game.state !== 'boss') return;
  if (!Game.player.grounded) return;
  Game.player.sliding = true; Game.player.slideT = SLIDE_DURATION;
  AudioSys.slide();
}

/* ---------------- PHYSICS / COLLISION HELPERS ---------------- */
function playerHitbox(){
  const p = Game.player;
  if (p.sliding) return { x:p.x-20, y:p.y-24, w:40, h:24 };
  return { x:p.x-16, y:p.y-64, w:32, h:64 };
}
function obstacleHitbox(o){
  if (o.type==='spike') return { x:o.x-o.w/2, y:o.y-o.h, w:o.w, h:o.h };
  if (o.type==='ground') return { x:o.x-o.w/2, y:o.y-o.h, w:o.w, h:o.h };
  return { x:o.x-o.w/2, y:o.y-o.h/2, w:o.w, h:o.h };
}
function rectsOverlap(a,b){
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function damagePlayer(amount){
  const p = Game.player;
  if (Game.activePowerups.invincible > 0 || Game.activePowerups.rocket > 0) return;
  if (p.hitInvuln > 0) return;

  if (Game.activePowerups.shield > 0){
    Game.activePowerups.shield = 0;
    Game.particles.explosion(p.x, p.y-30, '#6be3ff');
    p.hitInvuln = 0.6;
    return;
  }
  p.hearts -= amount;
  p.hitInvuln = 0.9;
  Game.hitThisRun = true;
  Game.distanceSinceHit = 0;
  Game.screenShake = 8;
  Game.particles.explosion(p.x, p.y-30, '#ff5470');
  AudioSys.hit();
  if (p.hearts <= 0){ endRun(false); }
}

/* ---------------- MAIN UPDATE ---------------- */
function updateGame(dt){
  if (Game.state === 'bossIntro'){
    Game.bossIntroT -= dt;
    Game.camZoomTarget = 1.15;
    Game.camZoom += (Game.camZoomTarget-Game.camZoom)*dt*3;
    if (Game.bossIntroT <= 0){
      Game.state = 'boss';
      Game.camZoomTarget = 1;
      spawnBoss();
      AudioSys.bossRoar();
      AudioSys.startMusic(WORLDS.find(w=>w.id===Game.worldId).musicScale, true);
    }
    return;
  }

  const p = Game.player;

  // player physics
  p.vy += GRAVITY*dt;
  p.y += p.vy*dt;
  if (p.y >= VIEW.GROUND_Y){ p.y = VIEW.GROUND_Y; p.vy = 0; p.grounded = true; p.jumps = 0; }
  else { p.grounded = false; }

  if (Game.activePowerups.rocket > 0){
    p.y = Math.min(p.y, VIEW.GROUND_Y - 140);
    p.vy = Math.sin(performance.now()/200)*40;
  }

  if (p.sliding){ p.slideT -= dt; if (p.slideT<=0) p.sliding = false; }
  p.legPhase += dt * (p.grounded ? 14 : 6);
  if (p.hitInvuln > 0) p.hitInvuln -= dt;

  // powerup timers
  Object.keys(Game.activePowerups).forEach(k=>{
    if (Game.activePowerups[k] > 0){ Game.activePowerups[k] -= dt; if (Game.activePowerups[k] < 0) Game.activePowerups[k]=0; }
  });

  const freeze = Game.activePowerups.freezeTime > 0;
  const curSpeed = (Game.speed * (Game.activePowerups.speedBoost>0 ? 1.4 : 1)) * (freeze ? 0.15 : 1);

  Game.distance += curSpeed*dt;
  Game.distanceSinceHit += curSpeed*dt;
  const scoreMult = Game.activePowerups.speedBoost>0 ? 1.5 : 1;
  Game.score += dt * (10 + Game.speed*0.02) * scoreMult;

  if (Game.mode==='timeTrial'){
    Game.timeLeft -= dt;
    if (Game.timeLeft <= 0){ Game.timeLeft = 0; endRun(true); return; }
  }

  Game.difficultyTimer += dt;
  if (Game.difficultyTimer > 4){ Game.difficultyTimer = 0; Game.speed = Math.min(Game.speed+18, 800); }

  // camera zoom relax
  Game.camZoom += (Game.camZoomTarget-Game.camZoom)*dt*4;
  if (Game.screenShake > 0) Game.screenShake = Math.max(0, Game.screenShake - dt*22);

  if (Game.state === 'boss'){ updateBoss(dt); }
  else { updateEndlessSpawn(dt); }

  updateObstacles(dt, curSpeed);
  updateCollectibles(dt, curSpeed);
  updateProjectiles(dt);
  Game.particles.update(dt);

  // ambient world particles (fire embers in volcano-esque, dust in desert) — light touch, cheap
  if (Math.random() < 0.02) Game.particles.smoke(Math.random()*VIEW.W, VIEW.GROUND_Y+10);

  updateWorld(Game.worldRuntime, dt, VIEW.W, VIEW.H, true);

  // story distance-stage completion check
  if (Game.mode==='story' && Game.stage.type==='distance' && Game.distance >= Game.stage.target){
    finishStoryDistanceStage();
  }
}

function updateEndlessSpawn(dt){
  Game.spawnTimer -= dt;
  if (Game.spawnTimer <= 0){
    spawnPattern();
    Game.spawnTimer = Math.max(0.5, 1.4 - Game.distance/9000);
  }
}

function updateObstacles(dt, curSpeed){
  const pHitbox = playerHitbox();
  const worldSkin = WORLDS.find(w=>w.id===Game.worldId).obstacleSkin;
  for (let i=Game.obstacles.length-1;i>=0;i--){
    const o = Game.obstacles[i];
    o.x -= curSpeed*dt;
    if (o.type==='ground'){ o.t+=dt; o.y = (VIEW.GROUND_Y-18) + Math.sin(o.t*4)*6; }
    if (o.type==='flyer'){ o.t+=dt; o.y = (VIEW.GROUND_Y-64) + Math.sin(o.t*2)*10; }
    if (o.type==='mover'){ o.t+=dt; o.y = o.baseY + Math.sin(o.t*2.4)*50; }
    if (o.x < -80){ Game.obstacles.splice(i,1); continue; }

    if (rectsOverlap(pHitbox, obstacleHitbox(o))){
      damagePlayer(1);
      Game.obstacles.splice(i,1);
    }
  }
}

function updateCollectibles(dt, curSpeed){
  const p = Game.player;
  for (let i=Game.collectibles.length-1;i>=0;i--){
    const c = Game.collectibles[i];
    c.x -= curSpeed*dt;
    if (c.x < -60){ Game.collectibles.splice(i,1); continue; }

    if (Game.activePowerups.magnet > 0 && (c.type==='coin'||c.type==='gem')){
      const d = Math.hypot(p.x-c.x, (p.y-20)-c.y);
      if (d < magnetRadius()){
        c.x += (p.x-c.x)*Math.min(1,dt*6);
        c.y += (p.y-20-c.y)*Math.min(1,dt*6);
      }
    }

    const d = Math.hypot(p.x-c.x, (p.y-20)-c.y);
    const hitR = (p.sliding?26:30) + (Game.activePowerups.rocket>0?20:0);
    if (d < hitR){
      collectPickup(c);
      Game.collectibles.splice(i,1);
    }
  }
}

function collectPickup(c){
  const mult = Game.activePowerups.doubleCoins>0 ? 2 : 1;
  const coinBonus = 1 + (Game.player.upCoin*0.1);
  if (c.type==='coin'){
    const amt = Math.round(1*mult*coinBonus);
    SAVE.coins += amt; Game.coinsThisRun += amt; SAVE.totalCoinsCollected += amt;
    AudioSys.coin(); Game.particles.sparkle(c.x,c.y,'#ffd23f');
  } else if (c.type==='gem'){
    const amt = Math.round(1*mult);
    SAVE.gems += amt; Game.gemsThisRun += amt; SAVE.totalGemsCollected += amt;
    AudioSys.gem(); Game.particles.sparkle(c.x,c.y,'#6be3ff');
  } else if (c.type==='power'){
    activatePowerup(c.kind);
  }
  updateHudCallback && updateHudCallback();
}

function activatePowerup(kind){
  if (kind === 'healthPack'){
    Game.player.hearts = Math.min(Game.player.maxHearts, Game.player.hearts+1);
    AudioSys.heal();
  } else {
    const def = POWERUP_DEFS[kind];
    Game.activePowerups[kind] = def.duration * powerupDurationMult(kind);
    AudioSys.powerup();
  }
  Game.powerupsUsedThisRun++;
  Game.particles.explosion(Game.player.x, Game.player.y-30, POWERUP_DEFS[kind].color);
  Game.camZoomTarget = 1.06;
  setTimeout(()=>{ Game.camZoomTarget = 1; }, 220);
}

/* ---------------- BOSS BATTLE ---------------- */
function spawnBoss(){
  const worldDef = WORLDS.find(w=>w.id===Game.worldId);
  Game.obstacles = []; Game.collectibles = [];
  Game.boss = {
    def: worldDef.boss, x: VIEW.W - 140, y: VIEW.GROUND_Y - 120, r: 60,
    hp: worldDef.boss.hp, maxHp: worldDef.boss.hp,
    t: 0, attackTimer: 1.5, hitFlash: 0, phase: 1
  };
}
function updateBoss(dt){
  const b = Game.boss;
  if (!b) return;
  b.t += dt;
  if (b.hitFlash>0) b.hitFlash -= dt;

  // Boss HP drains over time (hero auto-attacks); drains faster once
  // the player proves skill by staying un-hit for a while.
  const skillMult = Game.distanceSinceHit > 400 ? 1.6 : 1;
  const baseDrainRate = 7; // hp/sec — hero's automatic attack while dodging
  b.hp -= baseDrainRate * dt * skillMult;
  if (b.hp < b.maxHp*0.5 && b.phase===1){ b.phase=2; b.attackTimer = 0.6; }

  b.attackTimer -= dt;
  if (b.attackTimer <= 0){
    fireBossAttack(b);
    b.attackTimer = b.phase===2 ? (0.7+Math.random()*0.5) : (1.1+Math.random()*0.6);
  }

  if (b.hp <= 0){
    Game.boss = null;
    winBossFight();
  }
}
function fireBossAttack(b){
  const pattern = Math.random();
  if (pattern < 0.5){
    Game.projectiles.push({ x:b.x, y:VIEW.GROUND_Y-16, w:26, h:26, vx:-380, kind:'ground' });
  } else {
    Game.projectiles.push({ x:b.x, y:VIEW.GROUND_Y-80, w:30, h:30, vx:-340, kind:'air' });
  }
  Game.particles.fire(b.x, b.y);
}
function updateProjectiles(dt){
  const pHitbox = playerHitbox();
  for (let i=Game.projectiles.length-1;i>=0;i--){
    const pr = Game.projectiles[i];
    pr.x += pr.vx*dt;
    if (pr.x < -60){ Game.projectiles.splice(i,1); continue; }
    const box = { x:pr.x-pr.w/2, y:pr.y-pr.h/2, w:pr.w, h:pr.h };
    if (rectsOverlap(pHitbox, box)){
      damagePlayer(1);
      Game.projectiles.splice(i,1);
    }
  }
}
function winBossFight(){
  Game.state = 'victory';
  Game.camZoomTarget = 1.2;
  Game.particles.explosion(VIEW.W-140, VIEW.GROUND_Y-120, '#ffd23f');
  AudioSys.reward();
  SAVE.bossesBeaten++;
  SAVE.coins += 300; SAVE.gems += 15;
  Game.coinsThisRun += 300; Game.gemsThisRun += 15;
  grantAccountXp(150);
  if (Game.mode === 'story' && Game.stage){
    SAVE.storyProgress[Game.stage.id] = 3;
  }
  updateMissionAchievementProgress();
  persist();
  setTimeout(()=> onRunFinished(true), 1400);
}

/* ---------------- STORY STAGE COMPLETION ---------------- */
function finishStoryDistanceStage(){
  Game.state = 'victory';
  AudioSys.reward();
  const noHit = !Game.hitThisRun;
  const stars = noHit ? 3 : (Game.coinsThisRun > 40 ? 2 : 1);
  const prevStars = SAVE.storyProgress[Game.stage.id] || 0;
  SAVE.storyProgress[Game.stage.id] = Math.max(prevStars, stars);
  SAVE.bestWorldDistance[Game.worldId] = Math.max(SAVE.bestWorldDistance[Game.worldId]||0, Game.distance);
  grantAccountXp(80);
  updateMissionAchievementProgress();
  persist();
  setTimeout(()=> onRunFinished(true), 900);
}

/* ---------------- RUN END (death / time up) ---------------- */
function endRun(completed){
  if (Game.state === 'dead') return;
  Game.state = 'dead';
  AudioSys.stopMusic();
  SAVE.totalRuns++;

  const scoreKey = Game.mode;
  if (SAVE.highScores[scoreKey] !== undefined){
    SAVE.highScores[scoreKey] = Math.max(SAVE.highScores[scoreKey], Math.floor(Game.score));
  }
  SAVE.leaderboard.push({ mode:Game.mode, score:Math.floor(Game.score), date:new Date().toLocaleDateString() });
  SAVE.leaderboard.sort((a,b)=>b.score-a.score);
  SAVE.leaderboard = SAVE.leaderboard.slice(0,15);

  const xpGain = Math.floor(Game.distance/10 + Game.score/5);
  const leveledUp = grantAccountXp(xpGain);
  grantHeroXp(SAVE.selectedHero, xpGain);
  if (leveledUp) AudioSys.levelUp();

  updateMissionAchievementProgress();
  persist();

  setTimeout(()=> onRunFinished(false), 500);
}

/* ---------------- MISSION / ACHIEVEMENT TRACKING ---------------- */
function missionValueFor(type){
  switch(type){
    case 'run_coins': return Game.coinsThisRun;
    case 'run_score': return Math.floor(Game.score);
    case 'run_powerups': return Game.powerupsUsedThisRun;
    case 'run_gems': return Game.gemsThisRun;
    case 'run_nohit': return Game.hitThisRun ? 0 : Math.floor(Game.distance);
    default: return 0;
  }
}
function achievementValueFor(type){
  switch(type){
    case 'total_runs': return SAVE.totalRuns;
    case 'total_coins': return SAVE.totalCoinsCollected;
    case 'high_score': return Math.max(0,...Object.values(SAVE.highScores));
    case 'heroes_unlocked': return SAVE.unlockedHeroes.length;
    case 'bosses_beaten': return SAVE.bossesBeaten;
    case 'account_level': return SAVE.accountLevel;
    default: return 0;
  }
}
function weekKey(){
  const d = new Date();
  const onejan = new Date(d.getFullYear(),0,1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay()+1)/7);
  return d.getFullYear()+'-W'+week;
}
function ensureWeekFresh(){
  const wk = weekKey();
  if (SAVE.weekStamp !== wk){
    SAVE.weekStamp = wk;
    SAVE.weeklyProgress = {};
    SAVE.weeklyClaimed = {};
  }
}
function updateMissionAchievementProgress(){
  MISSIONS_TEMPLATE.forEach(m=>{
    const val = missionValueFor(m.type);
    SAVE.missionProgress[m.id] = Math.max(SAVE.missionProgress[m.id]||0, val);
  });
  ACHIEVEMENTS_TEMPLATE.forEach(a=>{
    SAVE.achievementProgress[a.id] = achievementValueFor(a.type);
  });
  ensureWeekFresh();
  WEEKLY_TEMPLATE.forEach(w=>{
    let inc = 0;
    if (w.type==='week_runs') inc = 1;
    if (w.type==='week_coins') inc = Game.coinsThisRun;
    if (w.type==='week_boss' && Game.boss===null && Game.stage && Game.stage.type==='boss' && Game.state==='victory') inc = 1;
    SAVE.weeklyProgress[w.id] = (SAVE.weeklyProgress[w.id]||0) + inc;
  });
}

/* Hook the UI layer sets so game.js can trigger a HUD refresh
   without importing ui.js directly (keeps modules decoupled). */
let updateHudCallback = null;
let onRunFinished = function(){}; // ui.js overrides this

/* ---------------- RENDERING ----------------
   Draws the entire gameplay frame: world backdrop, obstacles,
   collectibles, boss/projectiles, hero, particles, plus camera
   shake and a light zoom-punch for big moments.               */
function renderGame(g){
  if (Game.state === 'idle') return;
  const W = VIEW.W, H = VIEW.H, GROUND_Y = VIEW.GROUND_Y;

  let shakeX=0, shakeY=0;
  if (Game.screenShake > 0 && SAVE.settings.screenShake){
    shakeX = (Math.random()-0.5)*Game.screenShake;
    shakeY = (Math.random()-0.5)*Game.screenShake;
  }

  g.save();
  g.translate(W/2, H/2);
  g.scale(Game.camZoom, Game.camZoom);
  g.translate(-W/2 + shakeX, -H/2 + shakeY);

  renderWorld(g, Game.worldRuntime, W, H, GROUND_Y, Game.speed, 1/60);

  const worldSkin = WORLDS.find(w=>w.id===Game.worldId).obstacleSkin;

  Game.collectibles.forEach(c=>{
    g.save(); g.translate(c.x,c.y);
    if (c.type==='coin'){
      const grad = g.createRadialGradient(-3,-3,1,0,0,c.r);
      grad.addColorStop(0,'#fff3b0'); grad.addColorStop(1,'#d99a00');
      g.fillStyle = grad; g.beginPath(); g.arc(0,0,c.r,0,Math.PI*2); g.fill();
    } else if (c.type==='gem'){
      g.fillStyle = '#6be3ff'; g.rotate(Math.PI/4);
      roundRect(g,-c.r,-c.r,c.r*2,c.r*2,3); g.fill();
    } else if (c.type==='power'){
      const def = POWERUP_DEFS[c.kind];
      g.shadowColor = def.color; g.shadowBlur = 12;
      g.fillStyle = def.color; g.beginPath(); g.arc(0,0,c.r,0,Math.PI*2); g.fill();
      g.shadowBlur = 0;
      g.fillStyle='#233047'; g.font='bold 12px sans-serif'; g.textAlign='center'; g.textBaseline='middle';
      g.fillText(def.icon, 0, 1);
    }
    g.restore();
  });

  Game.obstacles.forEach(o=>{
    if (o.kind) drawEnemy(g, o, worldSkin); else drawObstacle(g, o, worldSkin);
  });

  Game.projectiles.forEach(pr=>{
    g.save(); g.translate(pr.x,pr.y);
    g.shadowColor='#ff5470'; g.shadowBlur=14;
    g.fillStyle='#ff5470';
    g.beginPath(); g.arc(0,0,pr.w/2,0,Math.PI*2); g.fill();
    g.shadowBlur=0;
    g.restore();
  });

  if (Game.boss) drawBoss(g, Game.boss);

  Game.particles.render(g);

  const p = Game.player;
  if (p){
    const showHero = p.hitInvuln<=0 || Math.floor(p.hitInvuln*20)%2===0;
    if (Game.activePowerups.shield>0){
      g.beginPath(); g.arc(p.x, p.y-30, 34, 0, Math.PI*2);
      g.strokeStyle='rgba(107,227,255,.8)'; g.lineWidth=3; g.stroke();
    }
    if (Game.activePowerups.rocket>0){
      g.save(); g.globalAlpha=0.5;
      Game.particles.fire(p.x-14, p.y-10);
      g.restore();
    }
    const glow = Game.activePowerups.invincible>0 || Game.activePowerups.rocket>0;
    if (showHero) drawHero(g, p.x, p.y, 60, p.charDef, p.legPhase, p.sliding, true, glow);
  }

  if (Game.state === 'bossIntro'){
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(0,0,W,H);
  }

  g.restore();
}
