/* ================================================================
   SKY DASH: LEGENDS — entities.js
   Procedural (vector) rendering for every character, enemy, boss
   and particle in the game. Nothing here depends on external
   image files, so there are zero missing-asset risks and the
   whole game ships as pure code.
   ================================================================ */

function roundRect(g,x,y,w,h,r){
  g.beginPath();
  g.moveTo(x+r,y);
  g.arcTo(x+w,y,x+w,y+h,r);
  g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r);
  g.arcTo(x,y,x+w,y,r);
  g.closePath();
}

/* ---------------- HERO RENDERING ----------------
   Drawn at design-scale 40px, then transformed to the requested
   size. `glow` adds a soft outer light (used for invincibility /
   rocket flight / boss-intro highlight). `expr` drives the face:
   'idle' (default, blinks + breathes), 'happy' (victory smile),
   'hurt' (wince), 'dead' (X eyes).                                */
function drawHero(g, x, y, size, charDef, legPhase, sliding, faceRight, glow, expr){
  expr = expr || 'idle';
  g.save();
  g.translate(x,y);
  const s = size/40;
  g.scale(faceRight===false ? -s : s, s);

  const bodyColor = charDef.body, accentColor = charDef.accent;
  // gentle breathing: a tiny height pulse so the hero never looks
  // frozen even when standing still (countdown, menu preview)
  const breathe = Math.sin(performance.now()/450) * 1.1;
  const bodyH = (sliding ? 22 : 34) + breathe;
  const bodyY = (sliding ? -12 : -30) - breathe*0.5;

  if (glow){
    g.shadowColor = bodyColor;
    g.shadowBlur = 22;
  }

  // legs
  g.fillStyle = accentColor;
  const legSwing = Math.sin(legPhase)*10;
  if (!sliding){
    g.beginPath(); g.ellipse(-6, 2+legSwing*0.2, 5, 10, 0,0,Math.PI*2); g.fill();
    g.beginPath(); g.ellipse(6, 2-legSwing*0.2, 5, 10, 0,0,Math.PI*2); g.fill();
  }

  // body
  g.fillStyle = bodyColor;
  roundRect(g, -16, bodyY, 32, bodyH, 14);
  g.fill();

  // character outline — a soft dark stroke around the silhouette so
  // the hero reads clearly against any world background/weather
  g.lineWidth = 2.2;
  g.strokeStyle = 'rgba(20,25,40,.45)';
  g.stroke();

  // rim-light (fake dynamic lighting: brighter edge facing "sun")
  g.strokeStyle = 'rgba(255,255,255,.55)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(16, bodyY+4); g.lineTo(16, bodyY+bodyH-8);
  g.stroke();

  // belly highlight
  g.fillStyle = 'rgba(255,255,255,.25)';
  roundRect(g, -10, bodyY+4, 14, bodyH-10, 8);
  g.fill();

  g.shadowBlur = 0;
  const eyeX = 8, eyeY = bodyY+bodyH*0.35;

  if (expr === 'dead'){
    // X eyes
    g.strokeStyle = '#233047'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(eyeX-3,eyeY-3); g.lineTo(eyeX+3,eyeY+3); g.moveTo(eyeX+3,eyeY-3); g.lineTo(eyeX-3,eyeY+3); g.stroke();
  } else {
    // blink cycle: eyes closed for a short window every few seconds
    const blinkCycle = (performance.now()/1000) % 3.4;
    const blinking = blinkCycle > 3.2 && expr !== 'hurt';
    if (blinking){
      g.strokeStyle = '#233047'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(eyeX-3,eyeY); g.lineTo(eyeX+3,eyeY); g.stroke();
    } else {
      g.fillStyle = '#233047';
      g.beginPath(); g.arc(eyeX, eyeY, expr==='hurt' ? 2.2 : 3, 0, Math.PI*2); g.fill();
      if (expr==='hurt'){
        // furrowed brow
        g.strokeStyle = '#233047'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(eyeX-4,eyeY-5); g.lineTo(eyeX+4,eyeY-3); g.stroke();
      }
    }
    // mouth — smiles by default, bigger grin when happy, flat when hurt
    g.strokeStyle = '#233047'; g.lineWidth = 1.4; g.lineCap = 'round';
    g.beginPath();
    if (expr==='happy'){ g.arc(eyeX-1, eyeY+5, 4, 0.15*Math.PI, 0.85*Math.PI); }
    else if (expr==='hurt'){ g.moveTo(eyeX-3, eyeY+7); g.lineTo(eyeX+3, eyeY+7); }
    else { g.arc(eyeX-1, eyeY+6, 2.6, 0.15*Math.PI, 0.85*Math.PI); }
    g.stroke();
  }

  // wing/arm accessory
  g.fillStyle = accentColor;
  g.beginPath();
  g.ellipse(-14, bodyY+bodyH*0.5, 7, 4, Math.sin(legPhase)*0.4, 0, Math.PI*2);
  g.fill();

  g.restore();
}

/* ---------------- ENEMY RENDERING ----------------
   `e.kind` is the movement role (ground-hopper vs flyer); the
   world's `enemyKind` picks the creature silhouette drawn on top,
   so the same forest world never looks like the cyber city.       */
function drawEnemy(g, e, worldSkin, enemyKind){
  g.save();
  g.translate(e.x, e.y);
  const baseColor = e.kind==='ground' ? worldSkin.ground : worldSkin.flyer;
  const flap = Math.sin(e.t*10)*6;

  if (enemyKind === 'robot'){
    g.fillStyle = baseColor;
    roundRect(g, -e.w/2, -e.h/2, e.w, e.h, 4); g.fill();
    g.strokeStyle='rgba(255,255,255,.5)'; g.lineWidth=1; g.strokeRect(-e.w/2+3,-e.h/2+3,e.w-6,e.h-6);
    g.fillStyle = '#ff3d3d'; g.shadowColor='#ff3d3d'; g.shadowBlur=8;
    g.beginPath(); g.arc(0,-2,3,0,Math.PI*2); g.fill(); g.shadowBlur=0;
    g.strokeStyle = baseColor; g.lineWidth=2; g.beginPath(); g.moveTo(0,-e.h/2); g.lineTo(0,-e.h/2-6); g.stroke();
  } else if (enemyKind === 'ghost'){
    g.globalAlpha = 0.78;
    g.fillStyle = baseColor;
    const wob = Math.sin(e.t*6)*4;
    g.beginPath();
    g.moveTo(-e.w/2, 2);
    g.quadraticCurveTo(-e.w/2, -e.h/2, 0, -e.h/2);
    g.quadraticCurveTo(e.w/2, -e.h/2, e.w/2, 2);
    for (let i=3;i>=0;i--){ g.lineTo(e.w/2 - i*(e.w/3), 2 + (i%2===0? wob:-wob)); }
    g.closePath(); g.fill();
    g.globalAlpha = 1;
    eyesFace(g, -5,-4, 5,-4);
  } else if (enemyKind === 'fireMonster'){
    g.fillStyle = baseColor;
    g.beginPath(); g.arc(0,0,e.w/2,0,Math.PI*2); g.fill();
    g.fillStyle = 'rgba(255,180,80,.8)';
    for (let i=0;i<3;i++){
      const a = -Math.PI/2 + (i-1)*0.5;
      const flick = Math.sin(e.t*8+i)*3;
      g.beginPath();
      g.moveTo(Math.cos(a)*e.w*0.3, Math.sin(a)*e.w*0.3);
      g.lineTo(Math.cos(a)*e.w*0.7+flick, Math.sin(a)*e.w*0.7-8);
      g.lineTo(Math.cos(a)*e.w*0.5, Math.sin(a)*e.w*0.5);
      g.closePath(); g.fill();
    }
    eyesFace(g, -5,-2, 5,-2);
  } else if (enemyKind === 'dragon'){
    g.fillStyle = baseColor;
    roundRect(g, -e.w/2, -e.h/2, e.w*0.8, e.h*0.8, 8); g.fill();
    g.beginPath(); g.moveTo(e.w*0.3,0); g.lineTo(e.w*0.7,-6); g.lineTo(e.w*0.7,6); g.closePath(); g.fill(); // tail
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.beginPath(); g.ellipse(-e.w/2-4, flap*0.6, 9, 4, 0.3, 0, Math.PI*2); g.fill();
    g.beginPath(); g.ellipse(e.w/2-2, -flap*0.6, 9, 4, -0.3, 0, Math.PI*2); g.fill();
    eyesFace(g, -3,-2, 3,-2);
  } else {
    // bird (default): the original flapping-wing critter
    if (e.kind === 'ground'){
      g.fillStyle = baseColor;
      g.beginPath(); g.arc(0,0,e.w/2,0,Math.PI*2); g.fill();
      eyesFace(g, -6,-4, 6,-4);
    } else {
      g.fillStyle = baseColor;
      roundRect(g, -e.w/2, -e.h/2, e.w, e.h, 10); g.fill();
      g.fillStyle = 'rgba(255,255,255,.6)';
      g.beginPath(); g.ellipse(-e.w/2-6, flap, 10, 5, 0.3, 0, Math.PI*2); g.fill();
      g.beginPath(); g.ellipse(e.w/2+6, -flap, 10, 5, -0.3, 0, Math.PI*2); g.fill();
    }
  }
  g.restore();
}
function eyesFace(g,ax,ay,bx,by){
  g.fillStyle='#fff'; g.beginPath(); g.arc(ax,ay,4,0,Math.PI*2); g.arc(bx,by,4,0,Math.PI*2); g.fill();
  g.fillStyle='#233047'; g.beginPath(); g.arc(ax,ay,2,0,Math.PI*2); g.arc(bx,by,2,0,Math.PI*2); g.fill();
}

/* ---------------- OBSTACLE RENDERING ---------------- */
function drawObstacle(g, o, worldSkin){
  g.save();
  if (o.type==='spike'){
    g.fillStyle = worldSkin.spike;
    g.beginPath();
    g.moveTo(o.x-o.w/2, o.y); g.lineTo(o.x, o.y-o.h); g.lineTo(o.x+o.w/2, o.y);
    g.closePath(); g.fill();
  } else if (o.type==='mover'){
    g.translate(o.x,o.y);
    g.fillStyle = worldSkin.ground;
    roundRect(g,-o.w/2,-o.h/2,o.w,o.h,8); g.fill();
  }
  g.restore();
}

/* ---------------- BOSS RENDERING ---------------- */
function drawBoss(g, boss){
  g.save();
  g.translate(boss.x, boss.y);
  const bob = Math.sin(boss.t*2)*8;
  g.translate(0,bob);
  g.shadowColor = boss.def.color; g.shadowBlur = boss.hitFlash>0 ? 40 : 20;
  g.fillStyle = boss.hitFlash>0 ? '#fff' : boss.def.color;
  g.beginPath(); g.arc(0,0,boss.r,0,Math.PI*2); g.fill();
  g.shadowBlur = 0;
  eyesFace(g, -boss.r*0.3, -boss.r*0.15, boss.r*0.3, -boss.r*0.15);
  g.restore();
}

/* ---------------- PET / COMPANION RENDERING ---------------- */
function drawPet(g, x, y, t, color, kind, attackFlash){
  g.save();
  g.translate(x, y + Math.sin(t*4)*4);
  g.shadowColor = color; g.shadowBlur = attackFlash>0 ? 20 : 12;
  g.fillStyle = attackFlash>0 ? '#fff' : color;

  if (kind==='robot'){
    roundRect(g,-9,-8,18,16,4); g.fill();
    g.strokeStyle='rgba(0,0,0,.3)'; g.lineWidth=1; g.strokeRect(-6,-5,12,10);
    g.fillStyle='#233047'; g.beginPath(); g.arc(0,-10,1.6,0,Math.PI*2); g.fill();
  } else if (kind==='fairy'){
    g.beginPath(); g.arc(0,0,6,0,Math.PI*2); g.fill();
    const flap = Math.sin(t*18)*6;
    g.fillStyle='rgba(255,255,255,.6)';
    g.beginPath(); g.ellipse(-8,flap,7,3,0.5,0,Math.PI*2); g.fill();
    g.beginPath(); g.ellipse(8,-flap,7,3,-0.5,0,Math.PI*2); g.fill();
  } else if (kind==='phoenix'){
    g.beginPath(); g.arc(0,0,9,0,Math.PI*2); g.fill();
    g.fillStyle='rgba(255,150,60,.7)';
    const flick = Math.sin(t*10)*3;
    g.beginPath(); g.moveTo(-6,4); g.lineTo(-2,14+flick); g.lineTo(2,4); g.closePath(); g.fill();
  } else {
    // dragon (default starter): rounded body + tiny wings + tail
    g.beginPath(); g.arc(0,0,10,0,Math.PI*2); g.fill();
    const flap = Math.sin(t*14)*5;
    g.fillStyle = 'rgba(255,255,255,.7)';
    g.beginPath(); g.ellipse(-9, flap, 6, 3, 0.4, 0, Math.PI*2); g.fill();
    g.beginPath(); g.ellipse(9, -flap, 6, 3, -0.4, 0, Math.PI*2); g.fill();
  }
  g.shadowBlur = 0;
  g.fillStyle = '#233047';
  g.beginPath(); g.arc(3,-2,1.6,0,Math.PI*2); g.fill();
  g.restore();
}

/* ---------------- PARTICLE SYSTEM ----------------
   A single flat particle pool covers sparkles, smoke, fire and
   explosions — differentiated by spawn parameters, which keeps
   the update loop cheap (important for 60fps on low-end phones). */
function makeParticlePool(){
  return {
    list: [],
    maxParticles: 260, // hard cap — keeps memory/FPS stable on long endless runs
    qualityScale(){ return SAVE.settings.quality === 'low' ? 0.45 : 1; },
    spawn(x,y,color,n,opts){
      opts = opts || {};
      n = Math.max(1, Math.round(n * this.qualityScale()));
      const speed = opts.speed || [40,180];
      const life = opts.life || [0.35,0.7];
      const size = opts.size || [2,4];
      const gravity = opts.gravity != null ? opts.gravity : 300;
      for (let i=0;i<n;i++){
        if (this.list.length >= this.maxParticles) this.list.shift(); // drop oldest, stay bounded
        const a = Math.random()*Math.PI*2;
        const sp = speed[0] + Math.random()*(speed[1]-speed[0]);
        this.list.push({
          x,y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - (opts.upBias||0),
          life: life[0]+Math.random()*(life[1]-life[0]),
          maxLife: life[1], color,
          size: size[0]+Math.random()*(size[1]-size[0]),
          gravity, shrink: !!opts.shrink
        });
      }
    },
    fire(x,y){ this.spawn(x,y,'#ff9a4d',4,{speed:[20,70],life:[0.25,0.45],gravity:-80,upBias:40,size:[3,6]}); },
    smoke(x,y){ this.spawn(x,y,'rgba(160,160,170,0.5)',2,{speed:[10,40],life:[0.6,1.1],gravity:-40,size:[4,8]}); },
    dust(x,y,color){ this.spawn(x,y,color||'rgba(210,200,180,.55)',3,{speed:[15,55],life:[0.2,0.4],gravity:60,size:[2,4],shrink:true}); },
    sparkle(x,y,color){ this.spawn(x,y,color||'#fff3b0',6,{speed:[30,140],life:[0.3,0.6],gravity:200,size:[2,3]}); },
    explosion(x,y,color){
      this.spawn(x,y,color||'#ff5470',24,{speed:[80,320],life:[0.3,0.7],gravity:250,size:[2,5]});
      this.spawn(x,y,'rgba(255,255,255,.8)',10,{speed:[40,160],life:[0.2,0.4],gravity:100,size:[3,6]});
    },
    update(dt){
      for (let i=this.list.length-1;i>=0;i--){
        const p = this.list[i];
        p.x += p.vx*dt; p.y += p.vy*dt; p.vy += p.gravity*dt;
        p.life -= dt;
        if (p.life<=0){ this.list.splice(i,1); }
      }
    },
    render(g){
      for (const p of this.list){
        g.globalAlpha = Math.max(0, p.life/p.maxLife);
        g.fillStyle = p.color;
        const sz = p.shrink ? p.size * (p.life/p.maxLife) : p.size;
        g.fillRect(p.x-sz/2, p.y-sz/2, sz, sz);
      }
      g.globalAlpha = 1;
    },
    clear(){ this.list.length = 0; }
  };
}
