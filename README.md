# Sky Dash: Legends

A polished, fully offline HTML5 endless runner. Pure JavaScript + Canvas 2D —
no build step, no external assets, no server. Open `index.html` and play.

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
- **Rewarded/interstitial ads, IAP, Battle Pass** — need an ad network SDK and
  app-store billing integration.
- **Anti-cheat** — meaningless in client-side JS (anyone can edit
  localStorage or open devtools); a real anti-cheat system requires
  server-side validation of scores/currency.

Everything else in the request is implemented and working. If you later want
to wire this up to a real backend (Firebase is a natural fit given your past
projects), the save format in `save.js` is already a clean versioned JSON
object — it's a straightforward next step, not a rewrite.
