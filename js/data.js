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
    enemyNames: ['Thornling', 'Bramble Bat', 'Moss Golem'], enemyKind: 'bird',
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
    enemyNames: ['Sand Viper', 'Scorpion Rider', 'Dune Wraith'], enemyKind: 'ghost',
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
    enemyNames: ['Frost Sprite', 'Yeti Cub', 'Ice Wraith'], enemyKind: 'ghost',
    musicScale: [349.2, 415.3, 493.9, 587.3, 493.9, 415.3],
    boss: { name: 'The Frozen Colossus', color: '#7fc4e8', hp: 180 }
  },
  {
    id: 'volcano', name: 'Cinderpeak Volcano', unlockDistance: 11000,
    sky: { day: ['#ff9a5c', '#3a1a1a'], night: ['#2b0d0d', '#4a1a12'] },
    ground: '#3a2620', groundTop: '#6b3a2a',
    fog: 'rgba(255,120,60,0.35)',
    weatherPool: ['clear', 'ashfall', 'thunder'],
    obstacleSkin: { spike: '#8a2f1e', ground: '#4a2a1c', flyer: '#ff7a3d' },
    enemyNames: ['Ember Imp', 'Magma Bat', 'Cinder Golem'], enemyKind: 'fireMonster',
    musicScale: [220.0, 261.6, 311.1, 349.2, 311.1, 261.6],
    boss: { name: 'The Magma Behemoth', color: '#ff5a2b', hp: 220 }
  },
  {
    id: 'cyberCity', name: 'Neon District', unlockDistance: 15000,
    sky: { day: ['#3a2b6b', '#7a5cc9'], night: ['#0a0a1a', '#1a1040'] },
    ground: '#1c1c2e', groundTop: '#2e2e4a',
    fog: 'rgba(120,90,220,0.3)',
    weatherPool: ['clear', 'fog', 'rain'],
    obstacleSkin: { spike: '#ff2fd6', ground: '#2fd6ff', flyer: '#c9ff2f' },
    enemyNames: ['Rogue Drone', 'Data Wraith', 'Sentry Bot'], enemyKind: 'robot',
    musicScale: [277.2, 329.6, 392.0, 466.2, 392.0, 329.6],
    boss: { name: 'The Rogue Mainframe', color: '#ff2fd6', hp: 260 }
  },
  {
    id: 'space', name: 'Orbital Frontier', unlockDistance: 19000,
    sky: { day: ['#0a0e2a', '#1a1a4a'], night: ['#000008', '#0a0a20'] },
    ground: '#2a2a3e', groundTop: '#4a4a66',
    fog: 'rgba(140,160,255,0.25)',
    weatherPool: ['clear', 'meteor'],
    obstacleSkin: { spike: '#8a8aff', ground: '#5a5a8a', flyer: '#ffcf5a' },
    enemyNames: ['Void Drifter', 'Ion Wisp', 'Star Reaper'], enemyKind: 'robot',
    musicScale: [196.0, 233.1, 277.2, 329.6, 277.2, 233.1],
    boss: { name: 'The Void Sentinel', color: '#8a5aff', hp: 300 }
  },
  {
    id: 'skyCastle', name: 'Sky Castle', unlockDistance: 24000,
    sky: { day: ['#ffe8b0', '#fff6e0'], night: ['#2a2050', '#4a3a7a'] },
    ground: '#e8d8c0', groundTop: '#fff6e8',
    fog: 'rgba(255,240,210,0.4)',
    weatherPool: ['clear', 'thunder', 'fog'],
    obstacleSkin: { spike: '#c9a86a', ground: '#8a6a4a', flyer: '#ffd8a0' },
    enemyNames: ['Sky Wyrmling', 'Cloud Sentinel', 'Storm Drake'], enemyKind: 'dragon',
    musicScale: [392.0, 466.2, 523.3, 622.3, 523.3, 466.2],
    boss: { name: 'The Sky Sovereign Dragon', color: '#ffb347', hp: 340 }
  }
];

/* ---------------- HEROES ----------------
   Each hero has a unique passive ability applied by game.js.
   `cost` is in gems (premium currency).                          */
const CHARACTERS = [
  { id:'blaze', name:'Blaze', cost:0,   body:'#ff6b4d', accent:'#c93a1e', rarity:'common',
    ability:'ember_start', abilityDesc:'Starts every run with a 3s Speed Boost.' },
  { id:'aqua',  name:'Aqua',  cost:250, body:'#4dc9ff', accent:'#1a7fbf', rarity:'common',
    ability:'shield_plus', abilityDesc:'Shield power-ups last 50% longer.' },
  { id:'volt',  name:'Volt',  cost:400, body:'#ffe14d', accent:'#c9a51a', rarity:'common',
    ability:'magnet_plus', abilityDesc:'Magnet radius increased by 50%.' },
  { id:'terra', name:'Terra', cost:600, body:'#8a5a2b', accent:'#5c3b1a', rarity:'rare',
    ability:'triple_jump', abilityDesc:'Gains a third mid-air jump.' },
  { id:'frost', name:'Frost', cost:800, body:'#a6e8ff', accent:'#4fa9cf', rarity:'rare',
    ability:'freeze_plus', abilityDesc:'Freeze Time power-ups last 50% longer.' },
  { id:'gust',  name:'Gust',  cost:950, body:'#d6ffe8', accent:'#5ec990', rarity:'rare',
    ability:'dash_plus', abilityDesc:'Dash cooldown reduced by 30%.' },
  { id:'nova',  name:'Nova',  cost:1200,body:'#c78aff', accent:'#7a3ec9', rarity:'rare',
    ability:'gem_plus', abilityDesc:'Earns 20% more gems from every run.' },
  { id:'ember', name:'Ember', cost:1500,body:'#ff3d3d', accent:'#8a1a1a', rarity:'epic',
    ability:'revive_discount', abilityDesc:'Coin-revive costs 30% less.' },
  { id:'gale',  name:'Gale',  cost:1800,body:'#c9ffe0', accent:'#3ec98f', rarity:'epic',
    ability:'combo_plus', abilityDesc:'Combo meter builds 25% faster.' },
  { id:'onyx',  name:'Onyx',  cost:2200,body:'#4a4a5e', accent:'#1a1a26', rarity:'epic',
    ability:'invuln_plus', abilityDesc:'Post-hit invulnerability lasts longer.' },
  { id:'lumen', name:'Lumen', cost:2600,body:'#fff3b0', accent:'#d9a000', rarity:'epic',
    ability:'coin_plus', abilityDesc:'Earns 20% more coins from every run.' },
  { id:'rook',  name:'Rook',  cost:3000,body:'#7a8aa0', accent:'#3a4a5e', rarity:'legendary',
    ability:'extra_heart', abilityDesc:'Starts every run with +1 heart.' },
  { id:'vex',   name:'Vex',   cost:3600,body:'#ff5ad6', accent:'#8a1a6e', rarity:'legendary',
    ability:'powerup_plus', abilityDesc:'Power-up drop chance increased.' },
  { id:'seren', name:'Seren', cost:4200,body:'#b0d8ff', accent:'#4a78c9', rarity:'legendary',
    ability:'checkpoint_plus', abilityDesc:'Story-mode checkpoints save 15% further back.' },
  { id:'ashen', name:'Ashen', cost:4800,body:'#ffb347', accent:'#a85a1a', rarity:'legendary',
    ability:'streak_plus', abilityDesc:'Daily streak bonus coins increased by 25%.' },
  { id:'zephyr',name:'Zephyr',cost:5500,body:'#ffe14d', accent:'#7a3ec9', rarity:'legendary',
    ability:'all_rounder', abilityDesc:'Small +10% bonus to speed, magnet, and coins.' }
];
const RARITY_INFO = {
  common:    { label:'Common',    color:'#8a94a8' },
  rare:      { label:'Rare',      color:'#4fa9cf' },
  epic:      { label:'Epic',      color:'#a678ff' },
  legendary: { label:'Legendary', color:'#ffb347' }
};

/* ---------------- COMPANIONS / PETS ----------------
   Passive helpers that orbit the hero. Bought with gems, equip one
   at a time from the Shop → Pets tab. Each pet both pulls in nearby
   coins/gems AND periodically zaps the nearest ground enemy.       */
const PET_DEFS = [
  { id:'dragon',  name:'Dragon',  kind:'dragon', cost:0,   color:'#ff6b4d', desc:'A loyal hatchling. Breathes a small ember at enemies.', radius:90,  atkCooldown:3.0 },
  { id:'robot',   name:'Robot',   kind:'robot',  cost:400, color:'#6be3ff', desc:'Scans a wide radius and zaps threats with a laser.',     radius:130, atkCooldown:2.4 },
  { id:'fairy',   name:'Fairy',   kind:'fairy',  cost:900, color:'#c78aff', desc:'Sprinkles enemies with disabling dust, very frequently.', radius:110, atkCooldown:1.8 },
  { id:'phoenix', name:'Phoenix', kind:'phoenix',cost:1600,color:'#ffb347', desc:'Widest radius and hardest-hitting attack in the sky.',    radius:160, atkCooldown:2.0 }
];

/* Power Shop catalog is defined further below, right after
   POWERUP_KEYS exists (see "POWER SHOP" section). */

/* ---------------- BATTLE PASS ----------------
   A simple seasonal-style reward track driven by account level.
   Free tier rewards everyone; premium tier (one-time gem unlock)
   doubles the payout at every step.                               */
function buildBattlePassTiers(){
  const tiers = [];
  for (let i=1;i<=20;i++){
    tiers.push({
      tier:i, levelRequired:i,
      free: { coins: 40 + i*10 },
      premium: { coins: 80 + i*20, gems: 5 + Math.floor(i/2) }
    });
  }
  return tiers;
}
const BATTLE_PASS_TIERS = buildBattlePassTiers();
const BATTLE_PASS_PREMIUM_COST = 250; // gems, one-time unlock for the season

/* ---------------- SKILL TREE (hero upgrade tracks) ----------------
   Four branches per hero, 5 tiers each, paid in coins. This is the
   "skill tree" — deliberately kept flat/simple (breadth over deep
   branching) so it stays legible on a small mobile screen.        */
const UPGRADE_TRACKS = [
  { key:'speed',  label:'Speed',        desc:'Higher base run speed.' },
  { key:'magnet', label:'Magnet Radius',desc:'Wider passive pickup radius.' },
  { key:'coin',   label:'Coin Value',   desc:'More coins per pickup.' },
  { key:'luck',   label:'Luck',         desc:'Better power-up drop odds.' }
];

/* ---------------- MINI-BOSS / SECRET CHEST TUNING ---------------- */
const MINI_BOSS_DISTANCE_INTERVAL = 1400; // meters between mini-boss encounters
const SECRET_CHEST_CHANCE = 0.04;          // per obstacle-spawn tick, in Endless/Survival

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

/* ---------------- POWER SHOP ----------------
   Buy one-time "starter charges" with coins — your next run begins
   with that power-up already active, on top of anything found
   during the run itself. Health Pack isn't sold here (it's instant,
   not a timed buff, so a "starting charge" wouldn't do anything).  */
const POWER_SHOP_ITEMS = POWERUP_KEYS
  .filter(k => k !== 'healthPack')
  .map(k => ({ kind:k, cost: 60 + Math.round(POWERUP_DEFS[k].duration*8) }));

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
