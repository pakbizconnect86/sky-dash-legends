/* ================================================================
   SKY DASH: LEGENDS — save.js
   Handles all local persistence (localStorage). This is the
   "offline save" system. There is no server in this build, so
   true cloud save / online leaderboards are out of scope — see
   README for details — but the save format below is versioned
   and JSON-based, which is exactly what a future cloud-sync layer
   would serialize and upload.
   ================================================================ */

const SAVE_KEY = 'skyDashLegends_v1';
const MAX_ENERGY = 5;
const ENERGY_REGEN_MS = 5 * 60 * 1000; // 1 energy every 5 minutes

function defaultSave(){
  return {
    version: 1,
    coins: 100,
    gems: 20,
    energy: MAX_ENERGY,
    lastEnergyTs: Date.now(),

    accountXp: 0,
    accountLevel: 1,

    unlockedHeroes: ['blaze'],
    selectedHero: 'blaze',
    heroUpgrades: {},        // heroId -> { speed:0, magnet:0, coin:0, luck:0 } tier counts
    heroLevels: {},          // heroId -> xp earned while using them (cosmetic level)

    unlockedSkins: {},       // heroId -> [skinIds]
    selectedSkin: {},        // heroId -> skinId | null

    unlockedPets: ['dragon'],
    selectedPet: 'dragon',

    startingPowerupCharges: {}, // kind -> count of purchased one-run starter charges

    battlePass: { premiumUnlocked:false, claimedFree:{}, claimedPremium:{} },
    bestCombo: 0,

    highScores: { endless:0, timeTrial:0, survival:0, story:0 },
    leaderboard: [],         // [{mode, score, date}]

    storyProgress: {},       // stageId -> stars (0-3)
    bestWorldDistance: {},   // worldId -> best distance reached (unlocks next world)

    missionProgress: {}, missionClaimed: {},
    weeklyProgress: {}, weeklyClaimed: {}, weekStamp: null,
    achievementProgress: {}, achievementClaimed: {},

    totalCoinsCollected: 0, totalGemsCollected: 0,
    totalRuns: 0, bossesBeaten: 0,

    lastDailyClaim: null, dailyStreak: 0,
    lastSpinDate: null,
    chests: 0,

    settings: {
      sfxOn: true, musicOn: true,
      sfxVolume: 0.8, musicVolume: 0.5,
      language: 'en',
      screenShake: true,
      vibration: true,
      showFps: false,
      quality: 'high' // 'high' | 'low' — affects particle density for low-end devices
    }
  };
}

let SAVE = load();

function load(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    // Deep-merge with defaults so new fields introduced in later
    // versions don't break old save files.
    const base = defaultSave();
    const merged = Object.assign({}, base, parsed);
    merged.settings = Object.assign({}, base.settings, parsed.settings || {});
    merged.battlePass = Object.assign({}, base.battlePass, parsed.battlePass || {});
    merged.battlePass.claimedFree = Object.assign({}, parsed.battlePass && parsed.battlePass.claimedFree || {});
    merged.battlePass.claimedPremium = Object.assign({}, parsed.battlePass && parsed.battlePass.claimedPremium || {});
    if (!merged.unlockedPets || merged.unlockedPets.length===0) merged.unlockedPets = ['dragon'];
    if (!merged.selectedPet) merged.selectedPet = 'dragon';
    // migrate retired pet ids from the previous roster (sparky/glimmer/ash)
    const petMigration = { sparky:'dragon', glimmer:'robot', ash:'phoenix' };
    merged.unlockedPets = merged.unlockedPets.map(id => petMigration[id] || id);
    if (petMigration[merged.selectedPet]) merged.selectedPet = petMigration[merged.selectedPet];
    if (!merged.startingPowerupCharges) merged.startingPowerupCharges = {};
    return merged;
  }catch(e){
    console.warn('Save file corrupted, starting fresh.', e);
    return defaultSave();
  }
}

function persist(){
  // Basic integrity guard: clamp currencies so a corrupted/manipulated
  // localStorage value can't produce negative or absurd numbers.
  SAVE.coins = Math.max(0, Math.floor(SAVE.coins));
  SAVE.gems = Math.max(0, Math.floor(SAVE.gems));
  SAVE.energy = Math.max(0, Math.min(MAX_ENERGY, Math.floor(SAVE.energy)));
  localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE));
}

/* ---------------- ENERGY ---------------- */
function regenEnergy(){
  if (SAVE.energy >= MAX_ENERGY){ SAVE.lastEnergyTs = Date.now(); return; }
  const elapsed = Date.now() - SAVE.lastEnergyTs;
  const gained = Math.floor(elapsed / ENERGY_REGEN_MS);
  if (gained > 0){
    SAVE.energy = Math.min(MAX_ENERGY, SAVE.energy + gained);
    SAVE.lastEnergyTs += gained * ENERGY_REGEN_MS;
    persist();
  }
}
function energyMsUntilNext(){
  if (SAVE.energy >= MAX_ENERGY) return 0;
  return ENERGY_REGEN_MS - (Date.now() - SAVE.lastEnergyTs);
}

/* ---------------- XP / LEVELING ---------------- */
// XP required to reach level N (simple escalating curve).
function xpForLevel(level){ return Math.floor(100 * Math.pow(level, 1.35)); }

function grantAccountXp(amount){
  SAVE.accountXp += amount;
  let leveledUp = false;
  while (SAVE.accountXp >= xpForLevel(SAVE.accountLevel)){
    SAVE.accountXp -= xpForLevel(SAVE.accountLevel);
    SAVE.accountLevel++;
    leveledUp = true;
  }
  return leveledUp;
}

function grantHeroXp(heroId, amount){
  SAVE.heroLevels[heroId] = (SAVE.heroLevels[heroId] || 0) + amount;
}
function heroLevel(heroId){
  const xp = SAVE.heroLevels[heroId] || 0;
  return 1 + Math.floor(xp / 500); // every 500 xp = +1 hero level
}

/* ---------------- UPGRADES ----------------
   Each hero can be upgraded in 3 tracks, 5 tiers each, paid in coins. */
function upgradeTier(heroId, track){
  const u = SAVE.heroUpgrades[heroId];
  return (u && u[track]) || 0;
}
function upgradeCost(tier){ return 120 + tier * 90; }
function buyUpgrade(heroId, track){
  const tier = upgradeTier(heroId, track);
  if (tier >= 5) return false;
  const cost = upgradeCost(tier);
  if (SAVE.coins < cost) return false;
  SAVE.coins -= cost;
  if (!SAVE.heroUpgrades[heroId]) SAVE.heroUpgrades[heroId] = { speed:0, magnet:0, coin:0, luck:0 };
  SAVE.heroUpgrades[heroId][track]++;
  persist();
  return true;
}
