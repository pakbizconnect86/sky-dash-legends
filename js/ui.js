/* ================================================================
   SKY DASH: LEGENDS — ui.js
   Everything that is NOT the gameplay simulation: screen
   navigation, menu rendering, shop/missions/story lists, daily
   reward, spin wheel, chest opening, settings, profile/stats,
   and wiring all DOM buttons to game.js actions.
   ================================================================ */

const SCREENS = ['menuScreen','modeScreen','worldScreen','storyScreen','shopScreen',
  'missionsScreen','leaderboardScreen','settingsScreen','profileScreen','gameOverScreen'];

function showScreen(id){
  SCREENS.forEach(s => document.getElementById(s).classList.toggle('hidden', s !== id));
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('bossHpWrap').classList.add('hidden');
  document.getElementById('powerupRow').innerHTML = '';
}

/* ---------------- CURRENCY / TOP BAR ---------------- */
function refreshCurrencyLabels(){
  regenEnergy();
  ['menu','shop','missions'].forEach(prefix=>{
    const coinsEl = document.getElementById(prefix+'Coins');
    const gemsEl = document.getElementById(prefix+'Gems');
    if (coinsEl) coinsEl.textContent = SAVE.coins;
    if (gemsEl) gemsEl.textContent = SAVE.gems;
  });
  const energyEl = document.getElementById('menuEnergy');
  if (energyEl) energyEl.textContent = SAVE.energy;
  const chestEl = document.getElementById('chestCount');
  if (chestEl) chestEl.textContent = SAVE.chests;
  const nameEl = document.getElementById('menuHeroName');
  if (nameEl) nameEl.textContent = getEffectiveHeroDef(SAVE.selectedHero).name;
  applyI18nLabels();
}
function applyI18nLabels(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    // preserve any leading icon/emoji already in the button text
    const txt = t(key);
    el.textContent = el.textContent.match(/^\S+\s/) && /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(el.textContent[0])
      ? el.textContent.match(/^\S+\s/)[0] + txt
      : txt;
  });
}

/* ---------------- MENU HERO PREVIEW ---------------- */
const menuCharCanvas = document.getElementById('menuCharCanvas');
const menuCharCtx = menuCharCanvas.getContext('2d');
const profileCharCanvas = document.getElementById('profileCharCanvas');
const profileCharCtx = profileCharCanvas.getContext('2d');
let previewAnimT = 0;
function renderPreviewLoop(){
  previewAnimT += 0.05;
  const bounce = Math.sin(previewAnimT)*4;
  const def = getEffectiveHeroDef(SAVE.selectedHero);
  menuCharCtx.clearRect(0,0,120,120);
  drawHero(menuCharCtx, 60, 78+bounce, 60, def, previewAnimT*3, false, true, def.skinGlow);
  if (!document.getElementById('profileScreen').classList.contains('hidden')){
    profileCharCtx.clearRect(0,0,110,110);
    drawHero(profileCharCtx, 55, 72+bounce, 55, def, previewAnimT*3, false, true, def.skinGlow);
  }
  requestAnimationFrame(renderPreviewLoop);
}
renderPreviewLoop();

/* ---------------- MODE SELECT ---------------- */
function renderModeList(){
  const list = document.getElementById('modeList');
  list.innerHTML = GAME_MODES.map(m=>`
    <div class="char-card">
      <div class="char-info">
        <div class="char-name">${m.name}</div>
        <div class="char-desc">${m.desc}</div>
      </div>
      <div class="char-action">
        <button class="btn btn-primary btn-small display-font" data-mode="${m.id}">⚡${m.energyCost}</button>
      </div>
    </div>`).join('');
  list.querySelectorAll('[data-mode]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      AudioSys.click();
      const modeId = btn.getAttribute('data-mode');
      regenEnergy();
      if (SAVE.energy < 1){
        alert(t('energyEmpty') + ' — regenerates over time, or comes back with a Lucky Spin / chest.');
        return;
      }
      if (modeId === 'story'){
        renderStoryList();
        showScreen('storyScreen');
      } else {
        pendingMode = modeId;
        renderWorldList();
        showScreen('worldScreen');
      }
    });
  });
}

/* ---------------- WORLD SELECT ---------------- */
let pendingMode = 'endless';
function isWorldUnlocked(worldDef, index){
  if (index === 0) return true;
  const prev = WORLDS[index-1];
  // unlocked once the previous world's distance-based story stages are cleared
  const s1 = SAVE.storyProgress[prev.id+'_1'] || 0;
  const s2 = SAVE.storyProgress[prev.id+'_2'] || 0;
  return (s1>0 && s2>0) || (SAVE.bestWorldDistance[prev.id]||0) >= prev.unlockDistance + 1200;
}
function renderWorldList(){
  const list = document.getElementById('worldList');
  list.innerHTML = WORLDS.map((w,i)=>{
    const unlocked = isWorldUnlocked(w,i);
    return `<div class="char-card ${unlocked?'':'locked'}">
      <div class="char-avatar" style="background:linear-gradient(160deg, ${w.sky.day[0]}, ${w.ground});border-radius:14px;"></div>
      <div class="char-info">
        <div class="char-name">${w.name}</div>
        <div class="char-desc">${w.enemyNames.join(', ')}</div>
      </div>
      <div class="char-action">
        <button class="btn ${unlocked?'btn-secondary':'btn-ghost'} btn-small display-font" data-world="${w.id}" ${unlocked?'':'disabled'}>${unlocked?'GO':'🔒'}</button>
      </div>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-world]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      AudioSys.click();
      SAVE.energy -= 1; SAVE.lastEnergyTs = SAVE.energy===MAX_ENERGY-1 ? Date.now() : SAVE.lastEnergyTs; persist();
      launchRun(pendingMode, btn.getAttribute('data-world'), null);
    });
  });
}

/* ---------------- STORY MAP ---------------- */
function renderStoryList(){
  const list = document.getElementById('storyList');
  list.innerHTML = STORY_STAGES.map((s,i)=>{
    const worldIndex = WORLDS.findIndex(w=>w.id===s.world);
    const worldUnlocked = isWorldUnlocked(WORLDS[worldIndex], worldIndex);
    const stageIndexInWorld = i % 3;
    const prevStageId = stageIndexInWorld>0 ? STORY_STAGES[i-1].id : null;
    const unlocked = worldUnlocked && (stageIndexInWorld===0 || (SAVE.storyProgress[prevStageId]||0)>0);
    const stars = SAVE.storyProgress[s.id] || 0;
    return `<div class="stage-card ${unlocked?'':'locked'}">
      <div class="stage-name">${s.name}${s.type==='boss'?' 👑':''}</div>
      <div class="stage-stars">${[1,2,3].map(n=>`<span>${n<=stars?'⭐':'☆'}</span>`).join('')}</div>
      <button class="btn ${unlocked?'btn-primary':'btn-ghost'} btn-small display-font" data-stage="${s.id}" ${unlocked?'':'disabled'}>${unlocked?'GO':'🔒'}</button>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-stage]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      AudioSys.click();
      regenEnergy();
      if (SAVE.energy < 1){ alert(t('energyEmpty')); return; }
      SAVE.energy -= 1; persist();
      const stage = STORY_STAGES.find(x=>x.id===btn.getAttribute('data-stage'));
      launchRun('story', stage.world, stage);
    });
  });
}

/* ---------------- LAUNCH / HUD / RUN LIFECYCLE WIRING ---------------- */
function launchRun(mode, worldId, stage){
  showScreen(null);
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('hudTimerPill').classList.toggle('hidden', mode!=='timeTrial');
  startRun(mode, worldId, stage);
  document.getElementById('touchHint').classList.remove('hidden');
  showStageBanner(stage ? stage.name : GAME_MODES.find(m=>m.id===mode).name);
}
function showStageBanner(text){
  const el = document.getElementById('stageBanner');
  el.textContent = text;
  el.classList.remove('hidden');
  void el.offsetWidth; // restart CSS animation
  el.style.animation = 'none';
  requestAnimationFrame(()=>{ el.style.animation = ''; });
  setTimeout(()=> el.classList.add('hidden'), 1600);
}

function updateHud(){
  document.getElementById('hudScore').textContent = Math.floor(Game.score);
  document.getElementById('hudCoins').textContent = Game.coinsThisRun;
  document.getElementById('hudGems').textContent = Game.gemsThisRun;
  document.getElementById('hudTimer').textContent = Math.ceil(Game.timeLeft);

  const comboPill = document.getElementById('comboPill');
  if (Game.combo >= 3){
    comboPill.classList.remove('hidden');
    document.getElementById('comboVal').textContent = Math.floor(Game.combo);
  } else {
    comboPill.classList.add('hidden');
  }

  const heartsRow = document.getElementById('heartsRow');
  if (Game.player){
    heartsRow.innerHTML = Array.from({length:Game.player.maxHearts}, (_,i)=>
      `<span class="heart">${i<Game.player.hearts?'❤️':'🖤'}</span>`).join('');
  }

  const row = document.getElementById('powerupRow');
  const chips = [];
  POWERUP_KEYS.forEach(k=>{
    if (Game.activePowerups[k] > 0){
      chips.push(`<div class="powerup-chip">${POWERUP_DEFS[k].icon} ${Math.ceil(Game.activePowerups[k])}s</div>`);
    }
  });
  row.innerHTML = chips.join('');

  const bossWrap = document.getElementById('bossHpWrap');
  if (Game.boss){
    bossWrap.classList.remove('hidden');
    document.getElementById('bossName').textContent = Game.boss.def.name;
    document.getElementById('bossHpFill').style.width = Math.max(0,(Game.boss.hp/Game.boss.maxHp*100))+'%';
  } else {
    bossWrap.classList.add('hidden');
  }
}
updateHudCallback = updateHud;
onBossEncounter = function(name){ showStageBanner(name.toUpperCase()); };
showBanner_i18n = function(key){ showStageBanner(t(key)); };

/* ---------------- REVIVE / CONTINUE MODAL ---------------- */
onReviveOffered = function(cost){
  document.getElementById('reviveCostLabel').textContent = cost + ' 🪙';
  document.getElementById('acceptReviveBtn').disabled = SAVE.coins < cost;
  document.getElementById('reviveOverlay').classList.remove('hidden');
};
document.getElementById('acceptReviveBtn').addEventListener('click', ()=>{
  if (acceptRevive()){
    document.getElementById('reviveOverlay').classList.add('hidden');
    refreshCurrencyLabels();
  }
});
document.getElementById('declineReviveBtn').addEventListener('click', ()=>{
  document.getElementById('reviveOverlay').classList.add('hidden');
  declineRevive();
});

/* ---------------- COUNTDOWN OVERLAY ----------------
   Polled once per frame from main.js's loop (cheap: just a DOM text
   update + a couple of one-shot sounds keyed off the integer second). */
let lastCountdownWhole = -1;
function updateCountdownUI(){
  const el = document.getElementById('countdownOverlay');
  if (Game.state !== 'countdown'){
    if (!el.classList.contains('hidden')) el.classList.add('hidden');
    lastCountdownWhole = -1;
    return;
  }
  el.classList.remove('hidden');
  const whole = Math.ceil(Game.countdownT);
  const label = whole > 0 ? String(whole) : t('getReady').split(' ')[0] || 'GO';
  document.getElementById('countdownNum').textContent = whole > 0 ? whole : 'GO!';
  if (whole !== lastCountdownWhole){
    lastCountdownWhole = whole;
    if (whole > 0) AudioSys.countdownTick(); else AudioSys.countdownGo();
  }
}

onRunFinished = function(won){
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('bossHpWrap').classList.add('hidden');
  document.getElementById('touchHint').classList.add('hidden');
  document.getElementById('reviveOverlay').classList.add('hidden');
  document.getElementById('countdownOverlay').classList.add('hidden');

  const isStoryContinue = Game.mode==='story' && won;
  const wasHighScore = Game.mode!=='story' && Game.score >= (SAVE.highScores[Game.mode]||0) && Game.score>0;

  document.getElementById('goTitle').textContent = won ? ((Game.stage && Game.stage.type==='boss') ? t('victory') : 'STAGE CLEAR') : t('gameOver');
  document.getElementById('goScore').textContent = Math.floor(Game.score);
  document.getElementById('goCoins').textContent = Game.coinsThisRun;
  document.getElementById('goGems').textContent = Game.gemsThisRun;
  document.getElementById('newBestBadge').classList.toggle('hidden', !wasHighScore);

  refreshCurrencyLabels();
  showScreen('gameOverScreen');

  // remember whether "retry" should replay the same story stage or config
  lastRunConfig = { mode:Game.mode, worldId:Game.worldId, stage:Game.stage };
};
let lastRunConfig = null;

document.getElementById('retryBtn').addEventListener('click', ()=>{
  AudioSys.click();
  if (!lastRunConfig) return;
  regenEnergy();
  if (SAVE.energy < 1){ alert(t('energyEmpty')); showScreen('menuScreen'); refreshCurrencyLabels(); return; }
  SAVE.energy -= 1; persist();
  launchRun(lastRunConfig.mode, lastRunConfig.worldId, lastRunConfig.stage);
});
document.getElementById('goMenuBtn').addEventListener('click', ()=>{
  AudioSys.click();
  showScreen('menuScreen');
  refreshCurrencyLabels();
});

/* ---------------- PAUSE ---------------- */
function togglePause(){
  if (Game.state==='playing' || Game.state==='boss'){
    Game.pausedFrom = Game.state;
    Game.state='paused';
    document.getElementById('pauseOverlay').classList.remove('hidden');
    AudioSys.stopMusic();
  } else if (Game.state==='paused'){
    Game.state = Game.pausedFrom || 'playing';
    document.getElementById('pauseOverlay').classList.add('hidden');
    AudioSys.startMusic(WORLDS.find(w=>w.id===Game.worldId).musicScale, Game.state==='boss');
  }
}
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resumeBtn').addEventListener('click', togglePause);
document.getElementById('restartFromPauseBtn').addEventListener('click', ()=>{
  document.getElementById('pauseOverlay').classList.add('hidden');
  if (lastRunConfig) launchRun(Game.mode, Game.worldId, Game.stage);
});
document.getElementById('menuFromPauseBtn').addEventListener('click', ()=>{
  document.getElementById('pauseOverlay').classList.add('hidden');
  Game.state = 'idle';
  AudioSys.stopMusic();
  showScreen('menuScreen');
  refreshCurrencyLabels();
});

/* ---------------- SHOP ---------------- */
let shopTab = 'heroes';
function renderShop(){
  const list = document.getElementById('shopList');
  if (shopTab === 'heroes') renderShopHeroes(list);
  else if (shopTab === 'skins') renderShopSkins(list);
  else if (shopTab === 'pets') renderShopPets(list);
  else renderShopUpgrades(list);
}
function renderShopPets(list){
  list.innerHTML = PET_DEFS.map(pet=>{
    const owned = SAVE.unlockedPets.includes(pet.id);
    const selected = SAVE.selectedPet === pet.id;
    let action;
    if (selected) action = `<button class="btn btn-ghost btn-small display-font" disabled>${t('selected')}</button>`;
    else if (owned) action = `<button class="btn btn-secondary btn-small display-font" data-selpet="${pet.id}">${t('select')}</button>`;
    else action = `<button class="btn btn-primary btn-small display-font" data-buypet="${pet.id}" ${SAVE.gems<pet.cost?'disabled':''}>${pet.cost}💎</button>`;
    return `<div class="char-card ${selected?'selected':''}">
      <div class="char-avatar" style="background:radial-gradient(circle at 35% 30%, #fff, ${pet.color});border-radius:50%;"></div>
      <div class="char-info"><div class="char-name">${pet.name}</div><div class="char-desc">${pet.desc}</div></div>
      <div class="char-action">${action}</div>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-buypet]').forEach(btn=>btn.addEventListener('click', ()=>{
    const id = btn.getAttribute('data-buypet'); const pet = PET_DEFS.find(p=>p.id===id);
    if (SAVE.gems >= pet.cost){ SAVE.gems -= pet.cost; SAVE.unlockedPets.push(id); SAVE.selectedPet = id; AudioSys.reward(); persist(); renderShop(); refreshCurrencyLabels(); }
  }));
  list.querySelectorAll('[data-selpet]').forEach(btn=>btn.addEventListener('click', ()=>{
    SAVE.selectedPet = btn.getAttribute('data-selpet'); AudioSys.click(); persist(); renderShop();
  }));
}
function renderShopHeroes(list){
  list.innerHTML = CHARACTERS.map(c=>{
    const owned = SAVE.unlockedHeroes.includes(c.id);
    const selected = SAVE.selectedHero === c.id;
    let action;
    if (selected) action = `<button class="btn btn-ghost btn-small display-font" disabled>${t('selected')}</button>`;
    else if (owned) action = `<button class="btn btn-secondary btn-small display-font" data-select="${c.id}">${t('select')}</button>`;
    else action = `<button class="btn btn-primary btn-small display-font" data-buy="${c.id}" ${SAVE.gems<c.cost?'disabled':''}>${c.cost}💎</button>`;
    return `<div class="char-card ${selected?'selected':''}">
      <div class="char-avatar" style="background:linear-gradient(160deg, ${c.body}, ${c.accent});border-radius:14px;"></div>
      <div class="char-info"><div class="char-name">${c.name}</div><div class="char-desc">${c.abilityDesc}</div></div>
      <div class="char-action">${action}</div>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-buy]').forEach(btn=>btn.addEventListener('click', ()=>{
    const id = btn.getAttribute('data-buy'); const c = CHARACTERS.find(x=>x.id===id);
    if (SAVE.gems >= c.cost){ SAVE.gems -= c.cost; SAVE.unlockedHeroes.push(id); SAVE.selectedHero = id; AudioSys.reward(); persist(); renderShop(); refreshCurrencyLabels(); }
  }));
  list.querySelectorAll('[data-select]').forEach(btn=>btn.addEventListener('click', ()=>{
    SAVE.selectedHero = btn.getAttribute('data-select'); AudioSys.click(); persist(); renderShop(); refreshCurrencyLabels();
  }));
}
function renderShopSkins(list){
  const rows = [];
  SAVE.unlockedHeroes.forEach(heroId=>{
    const hero = CHARACTERS.find(c=>c.id===heroId);
    SKIN_DEFS.forEach(skin=>{
      const owned = (SAVE.unlockedSkins[heroId]||[]).includes(skin.id);
      const selected = SAVE.selectedSkin[heroId] === skin.id;
      let action;
      if (selected) action = `<button class="btn btn-ghost btn-small display-font" disabled>${t('selected')}</button>`;
      else if (owned) action = `<button class="btn btn-secondary btn-small display-font" data-selskin="${heroId}|${skin.id}">${t('select')}</button>`;
      else action = `<button class="btn btn-primary btn-small display-font" data-buyskin="${heroId}|${skin.id}" ${SAVE.coins<skin.cost?'disabled':''}>${skin.cost}🪙</button>`;
      rows.push(`<div class="char-card ${selected?'selected':''}">
        <div class="char-avatar" style="background:linear-gradient(160deg, ${skin.body}, ${skin.accent});border-radius:14px;"></div>
        <div class="char-info"><div class="char-name">${hero.name} — ${skin.name}</div><div class="char-desc">Premium animated skin</div></div>
        <div class="char-action">${action}</div>
      </div>`);
    });
  });
  list.innerHTML = rows.join('');
  list.querySelectorAll('[data-buyskin]').forEach(btn=>btn.addEventListener('click', ()=>{
    const [heroId,skinId] = btn.getAttribute('data-buyskin').split('|');
    const skin = SKIN_DEFS.find(s=>s.id===skinId);
    if (SAVE.coins >= skin.cost){
      SAVE.coins -= skin.cost;
      if (!SAVE.unlockedSkins[heroId]) SAVE.unlockedSkins[heroId] = [];
      SAVE.unlockedSkins[heroId].push(skinId);
      SAVE.selectedSkin[heroId] = skinId;
      AudioSys.reward(); persist(); renderShop(); refreshCurrencyLabels();
    }
  }));
  list.querySelectorAll('[data-selskin]').forEach(btn=>btn.addEventListener('click', ()=>{
    const [heroId,skinId] = btn.getAttribute('data-selskin').split('|');
    SAVE.selectedSkin[heroId] = skinId; AudioSys.click(); persist(); renderShop();
  }));
}
function renderShopUpgrades(list){
  const heroId = SAVE.selectedHero;
  const hero = CHARACTERS.find(c=>c.id===heroId);
  list.innerHTML = `<div style="text-align:center;font-weight:800;color:var(--ink);font-family:'Baloo 2';">Upgrading: ${hero.name}</div>` +
    UPGRADE_TRACKS.map(({key,label})=>{
      const tier = upgradeTier(heroId,key);
      const maxed = tier>=5;
      const cost = upgradeCost(tier);
      return `<div class="mission-card">
        <div class="mission-top"><div class="mission-name">${label}</div><div class="mission-reward">Tier ${tier}/5</div></div>
        <div class="bar-track"><div class="bar-fill" style="width:${tier/5*100}%; background:linear-gradient(90deg,#8c6bff,#4dd4a8);"></div></div>
        <button class="btn ${maxed?'btn-ghost':'btn-purple'} btn-small display-font mission-claim" data-upgrade="${key}" ${maxed||SAVE.coins<cost?'disabled':''}>
          ${maxed?t('maxed'):t('upgrade')+' · '+cost+'🪙'}
        </button>
      </div>`;
    }).join('');
  list.querySelectorAll('[data-upgrade]').forEach(btn=>btn.addEventListener('click', ()=>{
    if (buyUpgrade(heroId, btn.getAttribute('data-upgrade'))){ AudioSys.reward(); renderShop(); refreshCurrencyLabels(); }
  }));
}
document.querySelectorAll('#shopScreen .tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#shopScreen .tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); shopTab = btn.getAttribute('data-tab'); AudioSys.click(); renderShop();
  });
});

/* ---------------- MISSIONS / WEEKLY / ACHIEVEMENTS ---------------- */
let missionTab = 'daily';
function renderMissionsPanel(){
  updateMissionAchievementProgress();
  const list = document.getElementById('missionsList');
  if (missionTab === 'daily') renderMissionCards(list, MISSIONS_TEMPLATE, SAVE.missionProgress, SAVE.missionClaimed, claimMission);
  else if (missionTab === 'weekly') renderMissionCards(list, WEEKLY_TEMPLATE, SAVE.weeklyProgress, SAVE.weeklyClaimed, claimWeekly);
  else if (missionTab === 'battlepass') renderBattlePass(list);
  else renderAchievementCards(list);
}
function renderBattlePass(list){
  const rows = [`<div class="panel-card" style="margin-bottom:4px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div><div class="mission-name">Season Pass</div><div class="char-desc">Free tier for everyone. Premium tier doubles every reward.</div></div>
      ${SAVE.battlePass.premiumUnlocked
        ? `<span style="font-family:'Baloo 2';font-weight:800;color:#7748d6;">★ PREMIUM</span>`
        : `<button class="btn btn-purple btn-small display-font" id="unlockPremiumPassBtn">${BATTLE_PASS_PREMIUM_COST}💎</button>`}
    </div>
  </div>`];
  BATTLE_PASS_TIERS.forEach(tier=>{
    const unlocked = SAVE.accountLevel >= tier.levelRequired;
    const freeClaimed = !!SAVE.battlePass.claimedFree[tier.tier];
    const premClaimed = !!SAVE.battlePass.claimedPremium[tier.tier];
    rows.push(`<div class="mission-card">
      <div class="mission-top"><div class="mission-name">Tier ${tier.tier} — Lv.${tier.levelRequired}</div>
        <div class="mission-reward">Free +${rewardLabel(tier.free)}</div></div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        ${unlocked && !freeClaimed ? `<button class="btn btn-secondary btn-small display-font" data-bp-free="${tier.tier}">${t('claim')}</button>` : (freeClaimed ? `<span style="font-size:11px;color:#3fbf8f;font-weight:800;">✓ Free</span>` : `<span style="font-size:11px;color:#aab2c8;">🔒 Free</span>`)}
        ${SAVE.battlePass.premiumUnlocked && unlocked && !premClaimed ? `<button class="btn btn-purple btn-small display-font" data-bp-prem="${tier.tier}">${t('claim')} +${rewardLabel(tier.premium)}</button>` : (premClaimed ? `<span style="font-size:11px;color:#7748d6;font-weight:800;">✓ Premium</span>` : `<span style="font-size:11px;color:#aab2c8;">🔒 +${rewardLabel(tier.premium)}</span>`)}
      </div>
    </div>`);
  });
  list.innerHTML = rows.join('');
  const unlockBtn = document.getElementById('unlockPremiumPassBtn');
  if (unlockBtn) unlockBtn.addEventListener('click', ()=>{
    if (SAVE.gems >= BATTLE_PASS_PREMIUM_COST){
      SAVE.gems -= BATTLE_PASS_PREMIUM_COST; SAVE.battlePass.premiumUnlocked = true;
      AudioSys.reward(); persist(); renderMissionsPanel(); refreshCurrencyLabels();
    }
  });
  list.querySelectorAll('[data-bp-free]').forEach(btn=>btn.addEventListener('click', ()=>{
    const tierN = btn.getAttribute('data-bp-free');
    const tier = BATTLE_PASS_TIERS.find(x=>x.tier==tierN);
    grantReward(tier.free); SAVE.battlePass.claimedFree[tierN] = true;
    AudioSys.reward(); persist(); renderMissionsPanel(); refreshCurrencyLabels();
  }));
  list.querySelectorAll('[data-bp-prem]').forEach(btn=>btn.addEventListener('click', ()=>{
    const tierN = btn.getAttribute('data-bp-prem');
    const tier = BATTLE_PASS_TIERS.find(x=>x.tier==tierN);
    grantReward(tier.premium); SAVE.battlePass.claimedPremium[tierN] = true;
    AudioSys.reward(); persist(); renderMissionsPanel(); refreshCurrencyLabels();
  }));
}
function rewardLabel(reward){
  const parts = [];
  if (reward.coins) parts.push(reward.coins+'🪙');
  if (reward.gems) parts.push(reward.gems+'💎');
  return parts.join(' ');
}
function grantReward(reward){
  if (reward.coins) SAVE.coins += reward.coins;
  if (reward.gems) SAVE.gems += reward.gems;
}
function renderMissionCards(list, templates, progressObj, claimedObj, onClaim){
  list.innerHTML = templates.map(m=>{
    const val = Math.min(m.target, progressObj[m.id]||0);
    const pct = Math.floor(val/m.target*100);
    const complete = val >= m.target;
    const claimed = !!claimedObj[m.id];
    return `<div class="mission-card">
      <div class="mission-top"><div class="mission-name">${m.name}</div><div class="mission-reward">+${rewardLabel(m.reward)}</div></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div style="font-size:11px;color:#8a94a8;margin-top:4px;">${val}/${m.target}</div>
      ${complete && !claimed ? `<button class="btn btn-green btn-small display-font mission-claim" data-claim="${m.id}">${t('claim')}</button>` : ''}
      ${claimed ? `<div style="font-size:11px;color:#3fbf8f;font-weight:800;margin-top:6px;">✓ ${t('claim')}ED</div>` : ''}
    </div>`;
  }).join('');
  list.querySelectorAll('[data-claim]').forEach(btn=>btn.addEventListener('click', ()=> onClaim(btn.getAttribute('data-claim'))));
}
function claimMission(id){
  const m = MISSIONS_TEMPLATE.find(x=>x.id===id);
  grantReward(m.reward); SAVE.missionClaimed[id]=true; AudioSys.reward(); persist(); renderMissionsPanel(); refreshCurrencyLabels();
}
function claimWeekly(id){
  const w = WEEKLY_TEMPLATE.find(x=>x.id===id);
  grantReward(w.reward); SAVE.weeklyClaimed[id]=true; AudioSys.reward(); persist(); renderMissionsPanel(); refreshCurrencyLabels();
}
function renderAchievementCards(list){
  list.innerHTML = ACHIEVEMENTS_TEMPLATE.map(a=>{
    const val = Math.min(a.target, SAVE.achievementProgress[a.id]||0);
    const pct = Math.floor(val/a.target*100);
    const complete = val >= a.target;
    const claimed = !!SAVE.achievementClaimed[a.id];
    return `<div class="mission-card">
      <div class="mission-top"><div class="mission-name">${a.name}</div><div class="mission-reward">+${rewardLabel(a.reward)}</div></div>
      <div style="font-size:11px;color:#7a869c;">${a.desc}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:linear-gradient(90deg,#a678ff,#7748d6);"></div></div>
      <div style="font-size:11px;color:#8a94a8;margin-top:4px;">${val}/${a.target}</div>
      ${complete && !claimed ? `<button class="btn btn-purple btn-small display-font mission-claim" data-ach="${a.id}">${t('claim')}</button>` : ''}
      ${claimed ? `<div style="font-size:11px;color:#7748d6;font-weight:800;margin-top:6px;">✓ ${t('claim')}ED</div>` : ''}
    </div>`;
  }).join('');
  list.querySelectorAll('[data-ach]').forEach(btn=>btn.addEventListener('click', ()=>{
    const id = btn.getAttribute('data-ach'); const a = ACHIEVEMENTS_TEMPLATE.find(x=>x.id===id);
    grantReward(a.reward); SAVE.achievementClaimed[id]=true; AudioSys.reward(); persist(); renderMissionsPanel(); refreshCurrencyLabels();
  }));
}
document.querySelectorAll('#missionsScreen .tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#missionsScreen .tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); missionTab = btn.getAttribute('data-mtab'); AudioSys.click(); renderMissionsPanel();
  });
});

/* ---------------- LEADERBOARD ---------------- */
let lbTab = 'endless';
function renderLeaderboard(){
  const list = document.getElementById('leaderboardList');
  const rows = SAVE.leaderboard.filter(r=>r.mode===lbTab).sort((a,b)=>b.score-a.score).slice(0,10);
  if (rows.length===0){ list.innerHTML = `<div style="text-align:center;color:#8a94a8;padding:20px;">No runs yet in this mode.</div>`; return; }
  list.innerHTML = rows.map((r,i)=>`<div class="lb-row"><div class="lb-rank">#${i+1}</div><div class="lb-date">${r.date}</div><div class="lb-score">${r.score}</div></div>`).join('');
}
document.querySelectorAll('#leaderboardScreen .tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#leaderboardScreen .tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); lbTab = btn.getAttribute('data-lbtab'); AudioSys.click(); renderLeaderboard();
  });
});

/* ---------------- PROFILE / STATS ---------------- */
function renderProfile(){
  document.getElementById('profileLevel').textContent = 'Lv. ' + SAVE.accountLevel;
  const need = xpForLevel(SAVE.accountLevel);
  document.getElementById('profileXpFill').style.width = Math.min(100, SAVE.accountXp/need*100)+'%';
  const heroId = SAVE.selectedHero;
  const grid = document.getElementById('statsGrid');
  const stats = [
    ['Total Runs', SAVE.totalRuns],
    ['Bosses Beaten', SAVE.bossesBeaten],
    ['Hero Level', heroLevel(heroId)],
    ['Heroes Unlocked', SAVE.unlockedHeroes.length + '/' + CHARACTERS.length],
    ['Best Endless', SAVE.highScores.endless],
    ['Best Time Trial', SAVE.highScores.timeTrial],
    ['Best Survival', SAVE.highScores.survival],
    ['Best Combo', SAVE.bestCombo||0],
    ['Total Coins Earned', SAVE.totalCoinsCollected],
    ['Companion', (PET_DEFS.find(p=>p.id===SAVE.selectedPet)||{name:'None'}).name]
  ];
  grid.innerHTML = stats.map(([l,v])=>`<div class="stat-box"><div class="v">${v}</div><div class="l">${l.toUpperCase()}</div></div>`).join('');
}

/* ---------------- DAILY REWARD ---------------- */
function checkDailyReward(){
  const today = new Date().toDateString();
  if (SAVE.lastDailyClaim === today) return;
  document.getElementById('dailyOverlay').classList.remove('hidden');
  renderDailyGrid();
}
function renderDailyGrid(){
  const grid = document.getElementById('dailyGrid');
  const streakDay = SAVE.dailyStreak % 7;
  let html = '';
  for (let i=0;i<7;i++){
    const reward = 20 + i*10;
    let cls = i<streakDay ? 'done' : (i===streakDay ? 'today' : '');
    html += `<div class="daily-day ${cls}"><div>D${i+1}</div><div>${reward}</div></div>`;
  }
  grid.innerHTML = html;
}
document.getElementById('claimDailyBtn').addEventListener('click', ()=>{
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now()-86400000).toDateString();
  if (SAVE.lastDailyClaim === yesterday) SAVE.dailyStreak++; else SAVE.dailyStreak = 0;
  const dayIdx = SAVE.dailyStreak % 7;
  const reward = 20 + dayIdx*10;
  SAVE.coins += reward;
  if (dayIdx === 6) SAVE.chests++; // full week streak bonus chest
  SAVE.lastDailyClaim = today;
  AudioSys.reward(); persist();
  document.getElementById('dailyOverlay').classList.add('hidden');
  refreshCurrencyLabels();
});

/* ---------------- LUCKY SPIN ---------------- */
const spinCanvas = document.getElementById('spinCanvas');
const spinCtx = spinCanvas.getContext('2d');
let spinAngle = 0, spinning = false;
function drawSpinWheel(){
  const cx=120, cy=120, r=110;
  spinCtx.clearRect(0,0,240,240);
  spinCtx.save();
  spinCtx.translate(cx,cy); spinCtx.rotate(spinAngle);
  const n = SPIN_PRIZES.length;
  for (let i=0;i<n;i++){
    const a0 = (i/n)*Math.PI*2, a1 = ((i+1)/n)*Math.PI*2;
    spinCtx.beginPath(); spinCtx.moveTo(0,0); spinCtx.arc(0,0,r,a0,a1); spinCtx.closePath();
    spinCtx.fillStyle = i%2===0 ? '#8c6bff' : '#6be3ff';
    spinCtx.fill();
    spinCtx.save();
    spinCtx.rotate((a0+a1)/2);
    spinCtx.fillStyle = '#fff'; spinCtx.font = 'bold 11px Baloo 2, sans-serif'; spinCtx.textAlign='center';
    spinCtx.fillText(SPIN_PRIZES[i].label, r*0.62, 4);
    spinCtx.restore();
  }
  spinCtx.restore();
  spinCtx.fillStyle = '#ff5470';
  spinCtx.beginPath(); spinCtx.moveTo(cx-10,10); spinCtx.lineTo(cx+10,10); spinCtx.lineTo(cx,32); spinCtx.closePath(); spinCtx.fill();
}
function canSpinToday(){ return SAVE.lastSpinDate !== new Date().toDateString(); }
document.getElementById('spinBtn').addEventListener('click', ()=>{
  AudioSys.click();
  document.getElementById('spinOverlay').classList.remove('hidden');
  document.getElementById('doSpinBtn').disabled = !canSpinToday() && SAVE.gems<10;
  document.getElementById('doSpinBtn').textContent = canSpinToday() ? 'SPIN (FREE)' : 'SPIN (10💎)';
  drawSpinWheel();
});
document.getElementById('closeSpinBtn').addEventListener('click', ()=> document.getElementById('spinOverlay').classList.add('hidden'));
document.getElementById('doSpinBtn').addEventListener('click', ()=>{
  if (spinning) return;
  const free = canSpinToday();
  if (!free){ if (SAVE.gems<10) return; SAVE.gems -= 10; }
  spinning = true;
  const n = SPIN_PRIZES.length;
  const targetIndex = Math.floor(Math.random()*n);
  const targetAngle = Math.PI*2*6 + (Math.PI*2 - (targetIndex/n)*Math.PI*2) - Math.PI/n;
  const startAngle = spinAngle;
  const dur = 2600; const t0 = performance.now();
  function anim(now){
    const p = Math.min(1, (now-t0)/dur);
    const ease = 1 - Math.pow(1-p, 3);
    spinAngle = startAngle + (targetAngle-startAngle)*ease;
    drawSpinWheel();
    if (Math.floor(p*40) !== Math.floor(((now-t0-16)/dur)*40)) AudioSys.spinTick();
    if (p<1) requestAnimationFrame(anim);
    else{
      spinning = false;
      if (free) SAVE.lastSpinDate = new Date().toDateString();
      const prize = SPIN_PRIZES[targetIndex];
      if (prize.type==='coins') SAVE.coins += prize.amount;
      if (prize.type==='gems') SAVE.gems += prize.amount;
      if (prize.type==='energy') SAVE.energy = Math.min(MAX_ENERGY, SAVE.energy+prize.amount);
      AudioSys.reward(); persist(); refreshCurrencyLabels();
      document.getElementById('doSpinBtn').textContent = canSpinToday() ? 'SPIN (FREE)' : 'SPIN (10💎)';
    }
  }
  requestAnimationFrame(anim);
});

/* ---------------- TREASURE CHESTS ---------------- */
document.getElementById('chestBtn').addEventListener('click', ()=>{
  AudioSys.click();
  document.getElementById('chestOverlay').classList.remove('hidden');
  document.getElementById('chestIcon').textContent = '📦';
  document.getElementById('chestReward').classList.add('hidden');
  document.getElementById('openChestBtn').classList.toggle('hidden', SAVE.chests<=0);
  document.getElementById('closeChestBtn').classList.remove('hidden');
  document.getElementById('openChestBtn').textContent = 'OPEN (' + SAVE.chests + ' left)';
});
document.getElementById('closeChestBtn').addEventListener('click', ()=> document.getElementById('chestOverlay').classList.add('hidden'));
document.getElementById('openChestBtn').addEventListener('click', ()=>{
  if (SAVE.chests <= 0) return;
  SAVE.chests--;
  const reward = rollChestReward();
  if (reward.type==='coins') SAVE.coins += reward.amount; else SAVE.gems += reward.amount;
  document.getElementById('chestIcon').textContent = '✨';
  const rEl = document.getElementById('chestReward');
  rEl.textContent = '+' + reward.amount + (reward.type==='coins'?' 🪙':' 💎');
  rEl.classList.remove('hidden');
  AudioSys.reward(); persist(); refreshCurrencyLabels();
  document.getElementById('openChestBtn').textContent = 'OPEN (' + SAVE.chests + ' left)';
  document.getElementById('openChestBtn').classList.toggle('hidden', SAVE.chests<=0);
});

/* ---------------- SETTINGS ---------------- */
function refreshSettingsUI(){
  document.getElementById('sfxSwitch').classList.toggle('on', SAVE.settings.sfxOn);
  document.getElementById('musicSwitch').classList.toggle('on', SAVE.settings.musicOn);
  document.getElementById('shakeSwitch').classList.toggle('on', SAVE.settings.screenShake);
  document.getElementById('sfxSlider').value = Math.round(SAVE.settings.sfxVolume*100);
  document.getElementById('musicSlider').value = Math.round(SAVE.settings.musicVolume*100);
  document.getElementById('qualitySelect').value = SAVE.settings.quality;
  document.getElementById('langSelect').value = SAVE.settings.language;
}
document.getElementById('sfxSwitch').addEventListener('click', ()=>{ SAVE.settings.sfxOn=!SAVE.settings.sfxOn; persist(); refreshSettingsUI(); if(SAVE.settings.sfxOn) AudioSys.click(); });
document.getElementById('musicSwitch').addEventListener('click', ()=>{ SAVE.settings.musicOn=!SAVE.settings.musicOn; persist(); refreshSettingsUI(); AudioSys.refreshVolume(); });
document.getElementById('shakeSwitch').addEventListener('click', ()=>{ SAVE.settings.screenShake=!SAVE.settings.screenShake; persist(); refreshSettingsUI(); });
document.getElementById('sfxSlider').addEventListener('input', e=>{ SAVE.settings.sfxVolume = e.target.value/100; persist(); });
document.getElementById('musicSlider').addEventListener('input', e=>{ SAVE.settings.musicVolume = e.target.value/100; persist(); AudioSys.refreshVolume(); });
document.getElementById('qualitySelect').addEventListener('change', e=>{ SAVE.settings.quality = e.target.value; persist(); });
document.getElementById('langSelect').addEventListener('change', e=>{ SAVE.settings.language = e.target.value; persist(); refreshCurrencyLabels(); });
document.getElementById('resetProgressBtn').addEventListener('click', ()=>{
  if (confirm('Reset all progress? This cannot be undone.')){
    SAVE = defaultSave(); persist(); refreshSettingsUI(); refreshCurrencyLabels();
  }
});

/* ---------------- SCREEN NAVIGATION WIRING ---------------- */
document.getElementById('playBtn').addEventListener('click', ()=>{ AudioSys.click(); renderModeList(); showScreen('modeScreen'); });
document.getElementById('shopBtn').addEventListener('click', ()=>{ AudioSys.click(); renderShop(); showScreen('shopScreen'); refreshCurrencyLabels(); });
document.getElementById('missionsBtn').addEventListener('click', ()=>{ AudioSys.click(); renderMissionsPanel(); showScreen('missionsScreen'); refreshCurrencyLabels(); });
document.getElementById('leaderboardBtn').addEventListener('click', ()=>{ AudioSys.click(); renderLeaderboard(); showScreen('leaderboardScreen'); });
document.getElementById('settingsBtn').addEventListener('click', ()=>{ AudioSys.click(); refreshSettingsUI(); showScreen('settingsScreen'); });
document.getElementById('profileBtn').addEventListener('click', ()=>{ AudioSys.click(); renderProfile(); showScreen('profileScreen'); });

document.getElementById('modeBackBtn').addEventListener('click', ()=>{ AudioSys.click(); showScreen('menuScreen'); refreshCurrencyLabels(); });
document.getElementById('worldBackBtn').addEventListener('click', ()=>{ AudioSys.click(); showScreen('modeScreen'); });
document.getElementById('storyBackBtn').addEventListener('click', ()=>{ AudioSys.click(); showScreen('modeScreen'); });
document.getElementById('shopBackBtn').addEventListener('click', ()=>{ AudioSys.click(); showScreen('menuScreen'); refreshCurrencyLabels(); });
document.getElementById('missionsBackBtn').addEventListener('click', ()=>{ AudioSys.click(); showScreen('menuScreen'); refreshCurrencyLabels(); });
document.getElementById('leaderboardBackBtn').addEventListener('click', ()=>{ AudioSys.click(); showScreen('menuScreen'); });
document.getElementById('settingsBackBtn').addEventListener('click', ()=>{ AudioSys.click(); showScreen('menuScreen'); });
document.getElementById('profileBackBtn').addEventListener('click', ()=>{ AudioSys.click(); showScreen('menuScreen'); });
