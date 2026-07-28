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
   rocket flight / boss-intro highlight).                         */
function drawHero(g, x, y, size, charDef, legPhase, sliding, faceRight, glow){
  g.save();
  g.translate(x,y);
  const s = size/40;
  g.scale(faceRight===false ? -s : s, s);

  const bodyColor = charDef.body, accentColor = charDef.accent;
  const bodyH = sliding ? 22 : 34;
  const bodyY = sliding ? -12 : -30;

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

  // eye
  g.shadowBlur = 0;
  g.fillStyle = '#233047';
  g.beginPath(); g.arc(8, bodyY+bodyH*0.35, 3, 0, Math.PI*2); g.fill();

  // wing/arm accessory
  g.fillStyle = accentColor;
  g.beginPath();
  g.ellipse(-14, bodyY+bodyH*0.5, 7, 4, Math.sin(legPhase)*0.4, 0, Math.PI*2);
  g.fill();

  g.restore();
}

/* ---------------- ENEMY RENDERING ---------------- */
function drawEnemy(g, e, worldSkin){
  g.save();
  g.translate(e.x, e.y);
  if (e.kind === 'ground'){
    g.fillStyle = worldSkin.ground;
    g.beginPath(); g.arc(0,0,e.w/2,0,Math.PI*2); g.fill();
    eyesFace(g, -6,-4, 6,-4);
  } else if (e.kind === 'flyer'){
    g.fillStyle = worldSkin.flyer;
    roundRect(g, -e.w/2, -e.h/2, e.w, e.h, 10); g.fill();
    g.fillStyle = 'rgba(255,255,255,.6)';
    const flap = Math.sin(e.t*10)*6;
    g.beginPath(); g.ellipse(-e.w/2-6, flap, 10, 5, 0.3, 0, Math.PI*2); g.fill();
    g.beginPath(); g.ellipse(e.w/2+6, -flap, 10, 5, -0.3, 0, Math.PI*2); g.fill();
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
function drawPet(g, x, y, t, color){
  g.save();
  g.translate(x, y + Math.sin(t*4)*4);
  g.shadowColor = color; g.shadowBlur = 12;
  g.fillStyle = color;
  g.beginPath(); g.arc(0,0,10,0,Math.PI*2); g.fill();
  g.shadowBlur = 0;
  // tiny wings
  const flap = Math.sin(t*14)*5;
  g.fillStyle = 'rgba(255,255,255,.7)';
  g.beginPath(); g.ellipse(-9, flap, 6, 3, 0.4, 0, Math.PI*2); g.fill();
  g.beginPath(); g.ellipse(9, -flap, 6, 3, -0.4, 0, Math.PI*2); g.fill();
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
