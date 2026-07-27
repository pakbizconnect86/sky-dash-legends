/* ================================================================
   SKY DASH: LEGENDS — data.js
   All static game configuration lives here: worlds, heroes,
   power-ups, missions, achievements, shop catalog.
   Keeping data separate from logic makes the game easy to extend
   (add a world/hero by adding an entry, not touching engine code).
   ================================================================ */

/* ---------------- WORLDS ----------------
   Each world defines its own palette (day + night variants),
   weather pool, unique obstacle flavors, unique enemy flavors,
   music scale, and a boss.                                       */
const WORLDS = [
  {
    id: 'forest', name: 'Emerald Forest', unlockDistance: 0,
    sky: { day: ['#8fd6ff', '#eafff0'], night: ['#0b1230', '#26305c'] },
    ground: '#8fd6a0', groundTop: '#e7f6c9',
    fog: 'rgba(180,220,180,0.35)',
    weatherPool: ['clear', 'rain', 'fog'],
    obstacleSkin: { spike: '#4a8f5c', ground: '#6b4a2b', flyer: '#e0a24a' },
    enemyNames: ['Thornling', 'Bramble Bat', 'Moss Golem'],
    musicScale: [261.6, 329.6, 392.0, 440.0, 392.0, 329.6],
    boss: { name: 'The Ancient Treant', color: '#2f6b3a', hp: 100 }
  },
  {
    id: 'desert', name: 'Sunfire Desert', unlockDistance: 3000,
    sky: { day: ['#ffd58a', '#fff3d6'], night: ['#2a1b3d', '#5c3a5e'] },
    ground: '#e8c27a', groundTop: '#f6e3b0',
    fog: 'rgba(230,190,120,0.35)',
    weatherPool: ['clear', 'sandstorm'],
    obstacleSkin: { spike: '#c96a2b', ground: '#a5672f', flyer: '#ffb347' },
    enemyNames: ['Sand Viper', 'Scorpion Rider', 'Dune Wraith'],
    musicScale: [293.7, 349.2, 440.0, 493.9, 440.0, 349.2],
    boss: { name: 'Pharaoh of Ash', color: '#c9832b', hp: 140 }
  },
  {
    id: 'snow', name: 'Frostpeak Range', unlockDistance: 7000,
    sky: { day: ['#bfe3ff', '#f3faff'], night: ['#0a1633', '#1f2f55'] },
    ground: '#eaf6ff', groundTop: '#ffffff',
    fog: 'rgba(220,240,255,0.45)',
    weatherPool: ['clear', 'snow', 'thunder'],
    obstacleSkin: { spike: '#7fb8d9', ground: '#5d86a3', flyer: '#bfe3ff' },
    enemyNames: ['Frost Sprite', 'Yeti Cub', 'Ice Wraith'],
    musicScale: [349.2, 415.3, 493.9, 587.3, 493.9, 415.3],
    boss: { name: 'The Frozen Colossus', color: '#7fc4e8', hp: 180 }
  }
];

/* ---------------- HEROES ----------------
   Each hero has a unique passive ability applied by game.js.
   `cost` is in gems (premium currency).                          */
const CHARACTERS = [
  { id:'blaze', name:'Blaze', cost:0,   body:'#ff6b4d', accent:'#c93a1e',
    ability:'ember_start', abilityDesc:'Starts every run with a 3s Speed Boost.' },
  { id:'aqua',  name:'Aqua',  cost:250, body:'#4dc9ff', accent:'#1a7fbf',
    ability:'shield_plus', abilityDesc:'Shield power-ups last 50% longer.' },
  { id:'volt',  name:'Volt',  cost:400, body:'#ffe14d', accent:'#c9a51a',
    ability:'magnet_plus', abilityDesc:'Magnet radius increased by 50%.' },
  { id:'terra', name:'Terra', cost:600, body:'#8a5a2b', accent:'#5c3b1a',
    ability:'triple_jump', abilityDesc:'Gains a third mid-air jump.' },
  { id:'frost', name:'Frost', cost:800, body:'#a6e8ff', accent:'#4fa9cf',
    ability:'freeze_plus', abilityDesc:'Freeze Time power-ups last 50% longer.' },
  { id:'nova',  name:'Nova',  cost:1200,body:'#c78aff', accent:'#7a3ec9',
    ability:'gem_plus', abilityDesc:'Earns 20% more gems from every run.' }
];

/* ---------------- POWER-UPS ---------------- */
const POWERUP_DEFS = {
  shield:      { name:'Shield',        color:'#6be3ff', icon:'🛡️', duration:8  },
  magnet:      { name:'Magnet',        color:'#ff6b6b', icon:'🧲', duration:8  },
  doubleCoins: { name:'Double Coins',  color:'#ffd23f', icon:'x2', duration:10 },
  speedBoost:  { name:'Speed Boost',   color:'#ff9a4d', icon:'⚡', duration:6  },
  freezeTime:  { name:'Freeze Time',   color:'#8ad6ff', icon:'❄️', duration:5  },
  invincible:  { name:'Invincibility', color:'#ffffff', icon:'★', duration:5  },
  rocket:      { name:'Rocket Flight', color:'#ff5470', icon:'🚀', duration:6  },
  healthPack:  { name:'Health Pack',   color:'#4dd4a8', icon:'❤️', duration:0  } // instant heal
};
const POWERUP_KEYS = Object.keys(POWERUP_DEFS);

/* ---------------- MISSIONS (rotate daily-ish) ---------------- */
const MISSIONS_TEMPLATE = [
  { id:'m_coins50',    name:'Collect 50 coins in one run',       target:50,  type:'run_coins',    reward:{coins:60} },
  { id:'m_score800',   name:'Score 800 in one run',              target:800, type:'run_score',    reward:{coins:80} },
  { id:'m_powerup3',   name:'Use 3 power-ups in one run',        target:3,   type:'run_powerups', reward:{gems:5} },
  { id:'m_gems10',     name:'Collect 10 gems in one run',        target:10,  type:'run_gems',     reward:{coins:100} },
  { id:'m_noHit300',   name:'Travel 300m without getting hit',   target:300, type:'run_nohit',    reward:{gems:8} }
];

/* ---------------- WEEKLY CHALLENGES ---------------- */
const WEEKLY_TEMPLATE = [
  { id:'w_runs10',    name:'Complete 10 runs this week',     target:10,   type:'week_runs',  reward:{gems:25} },
  { id:'w_coins1000', name:'Collect 1000 coins this week',   target:1000, type:'week_coins', reward:{coins:400} },
  { id:'w_boss1',     name:'Defeat 1 boss this week',        target:1,    type:'week_boss',  reward:{gems:40} }
];

/* ---------------- ACHIEVEMENTS ---------------- */
const ACHIEVEMENTS_TEMPLATE = [
  { id:'a_firstrun',  name:'First Steps',      desc:'Complete your first run',        target:1,    type:'total_runs',   reward:{coins:50} },
  { id:'a_coins1000', name:'Coin Collector',   desc:'Collect 1000 coins total',       target:1000, type:'total_coins',  reward:{gems:20} },
  { id:'a_score2000', name:'Sky Champion',     desc:'Reach a high score of 2000',     target:2000, type:'high_score',   reward:{gems:30} },
  { id:'a_heroes3',   name:'Fashionista',      desc:'Unlock 3 heroes',                target:3,    type:'heroes_unlocked', reward:{gems:25} },
  { id:'a_runs25',    name:'Dedicated Dasher', desc:'Complete 25 runs',               target:25,   type:'total_runs',   reward:{coins:300} },
  { id:'a_boss1',     name:'Boss Slayer',      desc:'Defeat your first boss',         target:1,    type:'bosses_beaten',reward:{gems:35} },
  { id:'a_level10',   name:'Rising Legend',    desc:'Reach account level 10',         target:10,   type:'account_level',reward:{gems:50} }
];

/* ---------------- GAME MODES ---------------- */
const GAME_MODES = [
  { id:'endless',  name:'Endless Mode',  desc:'Run as far as you can. Speed ramps forever.', energyCost:1 },
  { id:'timeTrial',name:'Time Trial',    desc:'Score as much as possible in 60 seconds.',    energyCost:1 },
  { id:'survival', name:'Survival Mode', desc:'One hit and it is over. No mercy.',            energyCost:1 },
  { id:'story',     name:'Story Mode',    desc:'Progress through stages across all worlds.',  energyCost:1 }
];

/* ---------------- STORY STAGES ----------------
   3 worlds x 3 stages (2 distance goals + 1 boss stage each)      */
function buildStoryStages(){
  const stages = [];
  WORLDS.forEach((w, wi)=>{
    stages.push({ id:w.id+'_1', world:w.id, name:w.name+' I',   type:'distance', target:600 });
    stages.push({ id:w.id+'_2', world:w.id, name:w.name+' II',  type:'distance', target:1200 });
    stages.push({ id:w.id+'_boss', world:w.id, name:w.name+' Boss', type:'boss', target:1 });
  });
  return stages;
}
const STORY_STAGES = buildStoryStages();

/* ---------------- PREMIUM SKINS ----------------
   Purely cosmetic recolors, purchasable per-hero with coins.
   Each has its own subtle animated glow tier for a "premium" feel. */
const SKIN_DEFS = [
  { id:'silver', name:'Silver',  cost:300, body:'#c9d6e3', accent:'#8aa0b8', glow:false },
  { id:'golden', name:'Golden',  cost:600, body:'#ffd23f', accent:'#c9a51a', glow:true  },
  { id:'shadow', name:'Shadow',  cost:900, body:'#4a4a5e', accent:'#26263a', glow:true  }
];

/* Resolves the colors actually used to render a hero right now,
   taking into account any equipped premium skin.                 */
function getEffectiveHeroDef(heroId){
  const base = CHARACTERS.find(c=>c.id===heroId) || CHARACTERS[0];
  const skinId = SAVE.selectedSkin[heroId];
  if (skinId){
    const skin = SKIN_DEFS.find(s=>s.id===skinId);
    if (skin) return Object.assign({}, base, { body:skin.body, accent:skin.accent, skinGlow:skin.glow });
  }
  return base;
}

/* ---------------- SPIN WHEEL PRIZES ---------------- */
const SPIN_PRIZES = [
  { label:'50 Coins', type:'coins', amount:50 },
  { label:'5 Gems',   type:'gems',  amount:5 },
  { label:'100 Coins',type:'coins', amount:100 },
  { label:'1 Energy', type:'energy',amount:1 },
  { label:'10 Gems',  type:'gems',  amount:10 },
  { label:'200 Coins',type:'coins', amount:200 },
  { label:'3 Gems',   type:'gems',  amount:3 },
  { label:'JACKPOT',  type:'gems',  amount:25 }
];

/* ---------------- CHEST REWARD POOL ---------------- */
function rollChestReward(){
  const roll = Math.random();
  if (roll < 0.5) return { type:'coins', amount: 80 + Math.floor(Math.random()*120) };
  if (roll < 0.85) return { type:'gems', amount: 5 + Math.floor(Math.random()*10) };
  return { type:'gems', amount: 20 + Math.floor(Math.random()*15) };
}
