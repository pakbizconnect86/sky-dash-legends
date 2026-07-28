/* ================================================================
   SKY DASH: LEGENDS — world.js
   Renders the living backdrop: sky gradient that blends smoothly
   between a day palette and night palette on a slow cycle, plus a
   parallax layer of scenery, plus a weather layer (rain / snow /
   fog / sandstorm / thunder) drawn per active world.
   ================================================================ */

function lerpColor(hexA, hexB, t){
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r-a.r)*t);
  const g = Math.round(a.g + (b.g-a.g)*t);
  const bl= Math.round(a.b + (b.b-a.b)*t);
  return `rgb(${r},${g},${bl})`;
}
function hexToRgb(hex){
  hex = hex.replace('#','');
  return { r: parseInt(hex.substr(0,2),16), g: parseInt(hex.substr(2,2),16), b: parseInt(hex.substr(4,2),16) };
}

function createWorldRuntime(worldDef, W, H){
  return {
    def: worldDef,
    dayT: 0.25,                 // 0..1 cycle position (0=dawn .25=day .5=dusk .75=night)
    dayCycleLength: 90,         // seconds for a full day/night loop
    weather: worldDef.weatherPool[0],
    weatherTimer: 14,
    rain: makeWeatherParticles('rain', W, H),
    snow: makeWeatherParticles('snow', W, H),
    ash: makeWeatherParticles('ash', W, H),
    meteor: makeWeatherParticles('meteor', W, H),
    fogPhase: 0,
    lightning: 0,
    clouds: Array.from({length:6}, ()=>({ x:Math.random()*W, y:Math.random()*H*0.35+20, s:Math.random()*0.6+0.6, speed:Math.random()*10+6 })),
    hills: Array.from({length:8}, (_,i)=>({ x:i*220, w:150+Math.random()*60, h:60+Math.random()*100 })),
    // small per-world decoration layer: grass tufts (forest), neon signs
    // (cyber city), lava vents (volcano), distant planets (space)
    props: Array.from({length:12}, (_,i)=>({ x:i*160+Math.random()*40, phase:Math.random()*Math.PI*2, size:0.7+Math.random()*0.6 }))
  };
}

function makeWeatherParticles(kind, W, H){
  const n = kind==='rain' ? 90 : (kind==='meteor' ? 14 : 60);
  const arr = [];
  for (let i=0;i<n;i++){
    arr.push({
      x: Math.random()*W, y: Math.random()*H,
      speed: kind==='rain' ? 700+Math.random()*300 : (kind==='meteor' ? 500+Math.random()*300 : 40+Math.random()*40),
      drift: (kind==='snow'||kind==='ash') ? (Math.random()-0.5)*30 : (kind==='meteor' ? -220-Math.random()*100 : 0),
      len: kind==='rain' ? 14+Math.random()*10 : (kind==='meteor' ? 28+Math.random()*20 : 0),
      r: (kind==='snow'||kind==='ash') ? 1.5+Math.random()*2 : 0
    });
  }
  return arr;
}

function updateWorld(wr, dt, W, H, running){
  wr.dayT = (wr.dayT + dt/wr.dayCycleLength) % 1;

  wr.weatherTimer -= dt;
  if (wr.weatherTimer <= 0){
    const pool = wr.def.weatherPool;
    wr.weather = pool[Math.floor(Math.random()*pool.length)];
    wr.weatherTimer = 16 + Math.random()*10;
  }
  if (wr.weather === 'thunder'){
    wr.lightning -= dt;
    if (wr.lightning <= -3 - Math.random()*4) wr.lightning = 0.12;
  }

  if (running){
    wr.clouds.forEach(c=>{ c.x -= c.speed*dt; if (c.x<-100) c.x = W+100; });
    if (wr.weather==='rain'){
      wr.rain.forEach(p=>{ p.y += p.speed*dt; p.x -= 60*dt; if (p.y>H){ p.y=-20; p.x=Math.random()*W; } });
    }
    if (wr.weather==='snow' || wr.def.id==='snow'){
      wr.snow.forEach(p=>{ p.y += p.speed*dt; p.x += p.drift*dt; if (p.y>H){ p.y=-10; p.x=Math.random()*W; } });
    }
    if (wr.weather==='ashfall' || wr.def.id==='volcano'){
      wr.ash.forEach(p=>{ p.y += p.speed*dt*0.4; p.x += p.drift*dt; if (p.y>H){ p.y=-10; p.x=Math.random()*W; } });
    }
    if (wr.weather==='meteor'){
      wr.meteor.forEach(p=>{ p.y += p.speed*dt; p.x += p.drift*dt; if (p.y>H || p.x<-40){ p.y=-20; p.x=Math.random()*W+W*0.3; } });
    }
    if (wr.weather==='sandstorm'){
      wr.fogPhase += dt*1.4;
    } else {
      wr.fogPhase += dt*0.2;
    }
    wr.props.forEach(p=>{ p.phase += dt; });
  }
}

/* Returns 0 = full day, 1 = full night, smoothly blended */
function nightAmount(dayT){
  // dayT: 0 dawn .25 noon .5 dusk .75 midnight 1 dawn
  const wave = Math.cos(dayT*Math.PI*2); // 1 at noon(0), -1 at midnight(.5)
  return Math.max(0, -wave); // 0 during day half, ramps 0->1 through night half
}

function renderWorld(g, wr, W, H, GROUND_Y, scrollSpeed, dt){
  const night = nightAmount(wr.dayT);
  const sky = wr.def.sky;
  const topColor = lerpColor(sky.day[0], sky.night[0], night);
  const botColor = lerpColor(sky.day[1], sky.night[1], night);

  const grad = g.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, botColor);
  g.fillStyle = grad;
  g.fillRect(0,0,W,H);

  // sun / moon
  const sunX = W - 70, sunY = 80 + night*10;
  g.beginPath(); g.arc(sunX, sunY, 40, 0, Math.PI*2);
  g.fillStyle = night>0.5 ? 'rgba(230,235,255,.9)' : 'rgba(255,224,138,.9)';
  g.shadowColor = g.fillStyle; g.shadowBlur = 30;
  g.fill(); g.shadowBlur = 0;

  // stars at night
  if (night > 0.15){
    g.fillStyle = `rgba(255,255,255,${Math.min(1,night)})`;
    for (let i=0;i<40;i++){
      const sx = (i*97) % W, sy = (i*53) % (H*0.5);
      g.fillRect(sx, sy, 2, 2);
    }
  }

  // clouds
  g.fillStyle = `rgba(255,255,255,${0.85 - night*0.35})`;
  wr.clouds.forEach(c=>{
    g.beginPath();
    g.ellipse(c.x, c.y, 40*c.s, 18*c.s, 0,0,Math.PI*2);
    g.ellipse(c.x+30*c.s, c.y+6*c.s, 28*c.s, 14*c.s, 0,0,Math.PI*2);
    g.ellipse(c.x-28*c.s, c.y+8*c.s, 24*c.s, 12*c.s, 0,0,Math.PI*2);
    g.fill();
  });

  // parallax hills/buildings, tinted per-world + darker at night
  const hillBase = { forest:'#5c9d6e', desert:'#d9a85c', snow:'#9fc4de', volcano:'#5c2a1e', cyberCity:'#3a2a6b', space:'#3a3a5e' }[wr.def.id] || '#78a0d2';
  const hillColor = lerpColor(hillBase, '#0c1020', night);
  g.fillStyle = hillColor;
  g.globalAlpha = wr.def.id==='cyberCity' ? 0.6 : 0.4;
  wr.hills.forEach(hl=>{
    hl.x -= (scrollSpeed*0.25)*dt;
    if (hl.x < -200) hl.x += WORLD_LOOP_W;
    g.fillRect(hl.x, GROUND_Y-hl.h, hl.w, hl.h);
    // cyber city: lit windows on the silhouette buildings
    if (wr.def.id==='cyberCity' && night>0.2){
      g.fillStyle = 'rgba(255,224,120,.5)';
      for (let wx=hl.x+8; wx<hl.x+hl.w-8; wx+=14){
        for (let wy=GROUND_Y-hl.h+10; wy<GROUND_Y-10; wy+=16){
          if ((Math.floor(wx+wy))%3===0) g.fillRect(wx,wy,4,6);
        }
      }
      g.fillStyle = hillColor;
    }
  });
  g.globalAlpha = 1;

  // per-world foreground decoration (drawn just above the ground line)
  wr.props.forEach(p=>{
    let x = p.x - (wr._propOffset||0);
    x = ((x % WORLD_LOOP_W) + WORLD_LOOP_W) % WORLD_LOOP_W;
    if (wr.def.id==='forest'){
      // animated grass tufts swaying in the breeze
      const sway = Math.sin(p.phase*2)*4;
      g.strokeStyle = 'rgba(60,140,80,.6)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x, GROUND_Y+4); g.quadraticCurveTo(x+sway, GROUND_Y-14, x+sway*1.4, GROUND_Y-22); g.stroke();
    } else if (wr.def.id==='volcano'){
      // glowing lava vents
      const glow = 0.5+Math.sin(p.phase*3)*0.3;
      g.fillStyle = `rgba(255,${90+Math.floor(glow*80)},40,${0.5+glow*0.3})`;
      g.shadowColor='#ff5a2b'; g.shadowBlur=14;
      g.beginPath(); g.arc(x, GROUND_Y+4, 5*p.size, 0, Math.PI*2); g.fill();
      g.shadowBlur=0;
    } else if (wr.def.id==='cyberCity'){
      // small neon sign flickers along the street
      const on = Math.sin(p.phase*6) > -0.6;
      if (on){
        g.fillStyle = ['#ff2fd6','#2fd6ff','#c9ff2f'][Math.floor(p.x)%3];
        g.shadowColor = g.fillStyle; g.shadowBlur = 10;
        g.fillRect(x-2, GROUND_Y-40-p.size*20, 4, 20*p.size);
        g.shadowBlur=0;
      }
    } else if (wr.def.id==='space'){
      // distant slow-drifting planets (background, barely moves)
      if (p.size > 1.1){
        g.fillStyle = 'rgba(180,160,255,.25)';
        g.beginPath(); g.arc(x, 100+p.phase*0, 22*p.size, 0, Math.PI*2); g.fill();
      }
    }
  });
  wr._propOffset = (wr._propOffset||0) + scrollSpeed*0.5*dt;

  // forest river strip with a soft reflection, running along the ground
  if (wr.def.id==='forest'){
    const riverY = GROUND_Y+22;
    g.fillStyle = lerpColor('#7ec9d9', '#16303a', night*0.6);
    g.globalAlpha = 0.55;
    g.fillRect(0, riverY, W, 14);
    g.globalAlpha = 0.18;
    g.fillStyle = topColor;
    g.fillRect(0, riverY, W, 6); // faint sky reflection
    g.globalAlpha = 1;
  }

  // space: extra starfield always visible regardless of day/night, since
  // there is no atmosphere to scatter sunlight
  if (wr.def.id==='space'){
    g.fillStyle = 'rgba(255,255,255,.7)';
    for (let i=0;i<60;i++){
      const sx=(i*61)%W, sy=(i*37)%(H*0.6);
      g.fillRect(sx,sy,1.6,1.6);
    }
  }

  // ground
  g.fillStyle = lerpColor(wr.def.groundTop, '#141b2e', night*0.6);
  g.fillRect(0, GROUND_Y, W, H-GROUND_Y);
  g.fillStyle = lerpColor(wr.def.ground, '#0e1526', night*0.6);
  g.fillRect(0, GROUND_Y, W, 10);

  // weather overlays
  if (wr.weather === 'rain'){
    g.strokeStyle = 'rgba(180,210,255,.55)'; g.lineWidth = 2;
    wr.rain.forEach(p=>{
      g.beginPath(); g.moveTo(p.x,p.y); g.lineTo(p.x-4,p.y+p.len); g.stroke();
    });
  }
  if (wr.weather === 'snow' || wr.def.id==='snow'){
    g.fillStyle = 'rgba(255,255,255,.9)';
    wr.snow.forEach(p=>{ g.beginPath(); g.arc(p.x,p.y,p.r,0,Math.PI*2); g.fill(); });
  }
  if (wr.weather === 'ashfall' || wr.def.id==='volcano'){
    g.fillStyle = 'rgba(120,110,100,.7)';
    wr.ash.forEach(p=>{ g.beginPath(); g.arc(p.x,p.y,p.r,0,Math.PI*2); g.fill(); });
  }
  if (wr.weather === 'meteor'){
    g.strokeStyle = 'rgba(255,210,140,.85)'; g.lineWidth = 2.5;
    g.shadowColor = '#ffcf8a'; g.shadowBlur = 8;
    wr.meteor.forEach(p=>{
      g.beginPath(); g.moveTo(p.x,p.y); g.lineTo(p.x-p.drift*0.06, p.y-p.len); g.stroke();
    });
    g.shadowBlur = 0;
  }
  if (wr.weather === 'fog' || wr.weather === 'sandstorm'){
    const a = 0.25 + Math.sin(wr.fogPhase)*0.06;
    g.fillStyle = wr.def.fog.replace(/[\d.]+\)$/, a.toFixed(2)+')');
    g.fillRect(0, GROUND_Y-160, W, 220);
  }
  if (wr.weather === 'thunder' && wr.lightning > 0){
    g.fillStyle = `rgba(255,255,255,${wr.lightning*0.6})`;
    g.fillRect(0,0,W,H);
  }

  // subtle vignette for an "HDR-ish" cinematic look
  const vg = g.createRadialGradient(W/2,H/2, H*0.3, W/2,H/2, H*0.75);
  vg.addColorStop(0,'rgba(0,0,0,0)');
  vg.addColorStop(1,`rgba(0,0,0,${0.28+night*0.15})`);
  g.fillStyle = vg;
  g.fillRect(0,0,W,H);
}

const WORLD_LOOP_W = 1700;
