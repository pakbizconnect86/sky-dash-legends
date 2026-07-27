/* ================================================================
   SKY DASH: LEGENDS — audio.js
   All audio is synthesized with the Web Audio API. This means the
   game needs zero external audio files (fully offline, tiny
   download size) while still giving each world its own musical
   identity and a distinct, more intense boss theme.
   ================================================================ */

const AudioSys = (function(){
  let ctx = null;
  let musicTimer = null;
  let musicPlaying = false;
  let currentScale = null;
  let bossMode = false;

  function ensureCtx(){
    if (!ctx){ ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function sfxVol(){ return SAVE.settings.sfxOn ? SAVE.settings.sfxVolume : 0; }
  function musicVol(){ return SAVE.settings.musicOn ? SAVE.settings.musicVolume : 0; }

  function blip(freq, dur, type, vol, glideTo){
    const v = sfxVol();
    if (v <= 0) return;
    const c = ensureCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, c.currentTime + dur);
    g.gain.setValueAtTime((vol||0.15) * v, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }

  // Layered "chord" hit for big moments (level up, chest open, boss defeat)
  function chord(freqs, dur, vol){
    freqs.forEach(f => blip(f, dur, 'triangle', vol));
  }

  return {
    jump(){ blip(420, .18, 'square', .12, 700); },
    doubleJump(){ blip(520, .16, 'square', .12, 900); },
    tripleJump(){ blip(640, .16, 'square', .13, 1100); },
    slide(){ blip(200, .12, 'sawtooth', .08, 120); },
    coin(){ blip(880, .09, 'sine', .1, 1200); },
    gem(){ blip(1300, .14, 'sine', .12, 1700); },
    hit(){ blip(140, .3, 'sawtooth', .18, 60); },
    heal(){ blip(500, .2, 'sine', .12, 900); },
    powerup(){ blip(600, .22, 'triangle', .14, 1400); },
    click(){ blip(500, .06, 'square', .07); },
    bossRoar(){ blip(90, .5, 'sawtooth', .22, 50); },
    bossHit(){ blip(220, .18, 'square', .16, 90); },
    levelUp(){ chord([523,659,784,1046], .35, .12); },
    reward(){ chord([440,554,659], .3, .12); },
    spinTick(){ blip(700, .04, 'square', .06); },

    startMusic(scale, isBoss){
      currentScale = scale; bossMode = !!isBoss;
      if (musicPlaying){ this.stopMusic(); }
      if (musicVol() <= 0) return;
      const c = ensureCtx();
      musicPlaying = true;
      let i = 0;
      const master = c.createGain();
      master.gain.value = musicVol() * (bossMode ? 0.09 : 0.06);
      master.connect(c.destination);
      const stepMs = bossMode ? 180 : 300;
      const notes = currentScale;
      const step = ()=>{
        if (!musicPlaying) return;
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = bossMode ? 'sawtooth' : 'triangle';
        o.frequency.value = notes[i % notes.length] * (bossMode && i%4===3 ? 0.5 : 1);
        g.gain.setValueAtTime(0.001, c.currentTime);
        g.gain.linearRampToValueAtTime(1, c.currentTime + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + stepMs/1000*0.9);
        o.connect(g); g.connect(master);
        o.start(); o.stop(c.currentTime + stepMs/1000);
        i++;
        musicTimer = setTimeout(step, stepMs);
      };
      step();
    },
    stopMusic(){
      musicPlaying = false;
      if (musicTimer) clearTimeout(musicTimer);
    },
    refreshVolume(){
      // called when settings sliders change while music is playing
      if (musicPlaying && currentScale){ this.startMusic(currentScale, bossMode); }
      else if (!musicPlaying && SAVE.settings.musicOn && currentScale){ this.startMusic(currentScale, bossMode); }
    }
  };
})();
