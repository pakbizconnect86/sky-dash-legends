/* ================================================================
   SKY DASH: LEGENDS — i18n.js
   Minimal localization layer. Ships with English and Roman Urdu
   (the two languages most relevant to this game's audience).
   Adding a language = adding one object to LANGS.
   ================================================================ */

const LANGS = {
  en: {
    play: 'PLAY', shop: 'SHOP', missions: 'MISSIONS', leaderboard: 'LEADERBOARD',
    settings: 'SETTINGS', profile: 'PROFILE', story: 'STORY', endless: 'ENDLESS',
    timeTrial: 'TIME TRIAL', survival: 'SURVIVAL', pause: 'PAUSED', resume: 'RESUME',
    restart: 'RESTART', mainMenu: 'MAIN MENU', gameOver: 'GAME OVER', retry: 'RETRY',
    newBest: 'NEW HIGH SCORE', energyEmpty: 'Out of Energy', spin: 'LUCKY SPIN',
    chests: 'CHESTS', claim: 'CLAIM', selected: 'SELECTED', select: 'SELECT', buy: 'BUY',
    dailyReward: 'Daily Reward!', weeklyChallenges: 'Weekly Challenges', achievements: 'Achievements',
    upgrade: 'UPGRADE', maxed: 'MAXED', bossIncoming: 'BOSS INCOMING', victory: 'VICTORY!'
  },
  ur: {
    play: 'KHELO', shop: 'DUKAAN', missions: 'MISSIONS', leaderboard: 'LEADERBOARD',
    settings: 'SETTINGS', profile: 'PROFILE', story: 'KAHANI', endless: 'ENDLESS',
    timeTrial: 'TIME TRIAL', survival: 'SURVIVAL', pause: 'RUKA HUA', resume: 'JAARI RAKHO',
    restart: 'DOBARA', mainMenu: 'MAIN MENU', gameOver: 'GAME KHATAM', retry: 'DOBARA KOSHISH',
    newBest: 'NAYA HIGH SCORE', energyEmpty: 'Energy Khatam', spin: 'LUCKY SPIN',
    chests: 'SANDOOQ', claim: 'LO', selected: 'CHUNA GAYA', select: 'CHUNO', buy: 'KHAREEDO',
    dailyReward: 'Rozana Inaam!', weeklyChallenges: 'Haftawar Challenges', achievements: 'Kaarnamay',
    upgrade: 'BEHTAR BANAO', maxed: 'PORA', bossIncoming: 'BOSS AA RAHA HAI', victory: 'JEET!'
  }
};

function t(key){
  const lang = LANGS[SAVE.settings.language] || LANGS.en;
  return lang[key] || LANGS.en[key] || key;
}
