# Sky Dash: Legends

A polished, fully offline HTML5 endless runner. Pure JavaScript + Canvas 2D —
no build step, no external assets, no server. Open `index.html` and play.

**v3 update:** added Sky Castle (7th world), richer character animation
(blink/breathe/expressions), Dash, Perfect Jump bonus, combat-capable pets
(Dragon/Robot/Fairy/Phoenix), a Power Shop, and Vibration/FPS settings — see
"What's new in v3" below. v1/v2 features and saves are untouched.

## Folder structure
```
sky-dash-legends/
├── index.html          # markup for every screen/modal
├── css/
│   └── style.css        # full theme, animations, responsive layout
└── js/
    ├── data.js           # worlds, heroes, power-ups, missions, shop data
    ├── save.js            # localStorage persistence, XP/level, energy, upgrades
    ├── i18n.js            # English + Roman Urdu strings
    ├── audio.js           # synthesized SFX + per-world/boss music (Web Audio API)
    ├── entities.js        # hero/enemy/boss/particle rendering
    ├── world.js           # parallax backgrounds, day/night cycle, weather
    ├── game.js             # physics, spawning, collisions, modes, boss fights
    ├── ui.js               # menus, shop, missions, story map, settings, etc.
    └── main.js             # boot, input (keyboard/touch/gamepad), main loop
```

## How to run
- **Locally:** double-click `index.html`, or serve the folder with any static
  server (`python3 -m http.server`) and open it in a browser.
- **GitHub Pages:** push this whole folder to a repo and enable Pages — same
  workflow you've used for your other single/multi-file tools.

## What's included
- 3 fully realized worlds (Forest, Desert, Snow), each with its own palette,
  weather pool, enemy names, and boss.
- 6 heroes with distinct passive abilities, gem-based unlocks, coin-based
  upgrades (speed / magnet / coin value), and premium recolor skins.
- Endless, Time Trial, Survival, and Story modes; Story mode is a 9-stage map
  (2 distance stages + 1 boss stage per world) with star ratings.
- All 8 requested power-ups, hearts/health system, shield/invincibility,
  magnet, freeze time, rocket flight.
- Day/night cycle, dynamic weather (rain/snow/fog/sandstorm/thunder),
  parallax backgrounds, particle effects (sparkle/smoke/fire/explosion),
  screen shake, glow, camera zoom punches, a cinematic intro.
- XP/leveling, daily rewards (7-day streak + bonus chest), weekly challenges,
  missions, achievements, a lucky spin wheel, treasure chests.
- Coins + gems economy, energy system with real-time regen, hero/skin/upgrade
  shop tabs.
- Local leaderboard (per mode), settings (SFX/music volume, screen shake,
  graphics quality, language EN/Roman-Urdu), profile/stats page.
- Keyboard, touch (tap/swipe), and Gamepad API controller support.

## Honest scope note
A few items from the original request need infrastructure this offline,
client-side build cannot provide, and are **not** included:
- **Cloud save / online leaderboards** — need a backend + database.
- **Rewarded/interstitial ads, IAP, Battle Pass payments** — the Battle Pass
  progression system is implemented, but it can't take real money without an
  app-store billing integration, so its "premium unlock" spends in-game gems.
- **Anti-cheat** — meaningless in client-side JS (anyone can edit
  localStorage or open devtools); a real anti-cheat system requires
  server-side validation of scores/currency.

Everything else in the request is implemented and working. If you later want
to wire this up to a real backend (Firebase is a natural fit given your past
projects), the save format in `save.js` is already a clean versioned JSON
object — it's a straightforward next step, not a rewrite.

## What's new in v2

**Bug fixes**
- Ground-enemy hit box was vertically offset from its visible sprite — fixed
  to match the circle exactly.
- Camera zoom could stack (boss intro + power-up punch + shake) and drift to
  an unreadable extreme — now clamped to a sane range.
- Boss-victory screen always said "STAGE CLEAR" instead of "VICTORY!" because
  the boss object was already cleared by the time the screen read it — fixed
  to check the stage type instead.
- Old saves without the newer fields (battle pass, pets) could crash on
  load — the loader now deep-merges every nested object safely.
- Particle system had no upper bound, so a very long run could quietly grow
  memory and cost FPS — now hard-capped and quality-aware (Settings → Low
  Graphics halves particle density for older phones).
- Added `env(safe-area-inset-*)` padding so the HUD/menus never sit under a
  notch, punch-hole camera, or the Android gesture bar.

**New systems**
- 3-2-1-GO countdown before every run (the hero is always fully idle on the
  ground during it — no more “spawns mid-air” edge case).
- Combo meter with near-miss bonuses and a score multiplier (x1.5 / x2 / x3).
- Coin-revive: die once and you can pay coins to continue with a shield,
  once per run.
- Landing dust, running footstep dust, and a lightweight motion-blur trail
  during Speed Boost / Rocket Flight.
- Character silhouette outline for readability against any background.
- Mini-boss encounters every ~1.4km in Endless/Survival (separate from the
  full Story-mode bosses) plus a rare secret chest collectible.
- 3 more worlds — Volcano, Cyber City, Space — each with unique enemies,
  obstacles, weather (ashfall, meteor showers), music, and a boss. Story
  Mode now spans all 6 worlds automatically (18 stages).
- 6 more heroes (12 total), each with a distinct passive ability.
- Companion pets (3, gem-unlocked) that passively pull nearby coins/gems in.
- Battle Pass with 20 tiers, a free track and a premium track (gem-unlocked).
- Skill Tree now has a 4th branch (Luck) that raises power-up drop odds.

## What's new in v3

- **7th world: Sky Castle**, unlocked after Cyber City. Story Mode is now
  21 stages across 7 worlds.
- **Character animation pass**: idle breathing, periodic blinking, and
  distinct facial expressions for idle / happy / hurt states (procedural,
  not hand-drawn art — see note below).
- **Dash**: a short forward burst with a few i-frames, on Shift/E, a
  dedicated on-screen button, or gamepad X/Square. Has a cooldown.
- **Perfect Jump bonus**: clearing an obstacle with a razor-thin gap now
  gives a bigger combo tick, bonus coins, and its own sound/sparkle, on top
  of the regular near-miss bonus.
- **Enemies now look different per world** — bird, robot, ghost, fire
  monster, and dragon silhouettes, matched to each world's theme.
- **Pets renamed and expanded**: Dragon / Robot / Fairy / Phoenix. They
  still pull in nearby coins/gems, and now also periodically zap the
  nearest enemy within range (with a cooldown per pet).
- **Power Shop** (new Shop tab): buy one-time starter charges for any
  power-up with coins — your next run begins with it already active.
- **Settings**: added Vibration (haptic buzz on taking a hit) and a
  toggleable on-screen FPS counter.

**Note on "Wall Jump":** this is a flat endless-runner (no vertical walls
to jump off), so a literal wall jump doesn't fit the genre. "Perfect Jump
Bonus" — also requested — was implemented instead, which is the closest
skill-based jump-timing mechanic that actually fits this game.

**Note on character art:** "console-quality hand-drawn mascot" implies real
character art from an illustrator — this is still procedural vector code
(shapes drawn with Canvas 2D), just with meaningfully better animation than
before. A truly hand-illustrated character sheet is outside what code alone
can produce.

