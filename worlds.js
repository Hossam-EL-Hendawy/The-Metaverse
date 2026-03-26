/* ═══════════════════════════════════
   worlds.js — World Builder
═══════════════════════════════════ */
'use strict';

const Worlds = (() => {
  let _scene, _camera;
  let worldObjects = [];
  let portals      = [];
  let currentIdx   = -1;

  // Lights
  let ambientLight, sunLight, fillLight, pointLights = [];

  const WORLD_DATA = [
    {
      id: 0,
      name:     'NEXUS CITY',
      emoji:    '🏙',
      sky:      0x050a18,
      fogColor: 0x050a18,
      fogNear:  25, fogFar: 90,
      ambientColor: 0x2244aa, ambientInt: 0.4,
      sunColor:     0x4488ff, sunInt: 1.8,
      fillColor:    0x001133, fillInt: 0.3,
      groundColor:  0x090e1c,
      build: _buildCity
    },
    {
      id: 1,
      name:     'OCEAN REALM',
      emoji:    '🌊',
      sky:      0x000e22,
      fogColor: 0x001133,
      fogNear:  12, fogFar: 55,
      ambientColor: 0x0055aa, ambientInt: 0.5,
      sunColor:     0x00aaff, sunInt: 1.4,
      fillColor:    0x003366, fillInt: 0.4,
      groundColor:  0x001a33,
      build: _buildOcean
    },
    {
      id: 2,
      name:     'COSMOS',
      emoji:    '🌌',
      sky:      0x000008,
      fogColor: 0x000010,
      fogNear:  40, fogFar: 130,
      ambientColor: 0x220055, ambientInt: 0.25,
      sunColor:     0xbb55ff, sunInt: 1.2,
      fillColor:    0x110022, fillInt: 0.2,
      groundColor:  0x03030a,
      build: _buildCosmos
    },
    {
      id: 3,
      name:     'FOREST',
      emoji:    '🌿',
      sky:      0x080f04,
      fogColor: 0x0d1f08,
      fogNear:  18, fogFar: 65,
      ambientColor: 0x228811, ambientInt: 0.55,
      sunColor:     0xffcc44, sunInt: 2.0,
      fillColor:    0x103308, fillInt: 0.3,
      groundColor:  0x122609,
      build: _buildForest
    },
    {
      id: 4,
      name:     'DESERT RUINS',
      emoji:    '🏜',
      sky:      0x180e00,
      fogColor: 0x1a1000,
      fogNear:  30, fogFar: 100,
      ambientColor: 0xaa6600, ambientInt: 0.6,
      sunColor:     0xff9922, sunInt: 2.5,
      fillColor:    0x441100, fillInt: 0.2,
      groundColor:  0x281a04,
      build: _buildDesert
    }
  ];

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
  }

  function load(idx) {
    _clear();
    currentIdx = idx;
    const w = WORLD_DATA[idx];

    _scene.background = new THREE.Color(w.sky);
    _scene.fog = new THREE.Fog(w.fogColor, w.fogNear, w.fogFar);

    _setupLights(w);
    w.build(w);
    _spawnPortals(idx, w);
    _spawnNPCs(idx);

    return w;
  }

  function _clear() {
    worldObjects.forEach(o => _scene.remove(o));
    worldObjects = [];
    portals = [];
    AvatarSystem.clearNPCs();
  }

  function _setupLights(w) {
    if (ambientLight) _scene.remove(ambientLight);
    if (sunLight)     _scene.remove(sunLight);
    if (fillLight)    _scene.remove(fillLight);
    pointLights.forEach(l => _scene.remove(l));
    pointLights = [];

    ambientLight = new THREE.AmbientLight(w.ambientColor, w.ambientInt);
    _scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(w.sunColor, w.sunInt);
    sunLight.position.set(30, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near   = 0.5;
    sunLight.shadow.camera.far    = 200;
    sunLight.shadow.camera.left   = -50;
    sunLight.shadow.camera.right  = 50;
    sunLight.shadow.camera.top    = 50;
    sunLight.shadow.camera.bottom = -50;
    _scene.add(sunLight);

    fillLight = new THREE.DirectionalLight(w.fillColor, w.fillInt);
    fillLight.position.set(-20, 10, -20);
    _scene.add(fillLight);
  }

  function _add(obj) {
    _scene.add(obj);
    worldObjects.push(obj);
    return obj;
  }

  function _ground(color, size=200) {
    const geo = new THREE.PlaneGeometry(size, size, 60, 60);
    const mat = new THREE.MeshStandardMaterial({color, roughness:0.9, metalness:0.05});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    return _add(mesh);
  }

  function _box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    return _add(m);
  }

  // ── NEXUS CITY ──
  function _buildCity(w) {
    _ground(w.groundColor);
    _add(new THREE.GridHelper(200, 50, 0x0033ff, 0x001133));

    const palette = [0x00f5ff, 0xff6b00, 0x9b59ff, 0x00ff88, 0xff3355, 0xffcc00];
    const rings = [
      { count:8,  r:12, hRange:[6,22],  wRange:[2,4] },
      { count:16, r:26, hRange:[4,16],  wRange:[1.5,3] },
      { count:24, r:42, hRange:[3,12],  wRange:[1.5,2.5] },
    ];

    rings.forEach(ring => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2 + Math.random() * 0.3;
        const r = ring.r + (Math.random() - 0.5) * 4;
        const h = ring.hRange[0] + Math.random() * (ring.hRange[1] - ring.hRange[0]);
        const bw = ring.wRange[0] + Math.random() * (ring.wRange[1] - ring.wRange[0]);
        const color = palette[Math.floor(Math.random() * palette.length)];
        const mat = new THREE.MeshStandardMaterial({
          color: 0x0d1a2e, emissive: color,
          emissiveIntensity: 0.04 + Math.random() * 0.06,
          roughness: 0.85, metalness: 0.2
        });
        const building = _box(bw, h, bw, mat, Math.cos(angle)*r, h/2, Math.sin(angle)*r);

        // Windows
        const wRows = Math.floor(h / 1.4);
        for (let row = 0; row < wRows; row++) {
          for (let col = 0; col < 2; col++) {
            if (Math.random() > 0.35) {
              const wm = new THREE.MeshBasicMaterial({
                color, transparent: true, opacity: 0.5 + Math.random()*0.4,
                side: THREE.DoubleSide
              });
              const wp = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.3), wm);
              wp.position.set(
                Math.cos(angle)*r + (col-0.5)*bw*0.6,
                1.0 + row * 1.4,
                Math.sin(angle)*r + bw/2 + 0.01
              );
              _add(wp);
            }
          }
        }

        // Roof light
        if (h > 12) {
          const pl = new THREE.PointLight(color, 0.8, 10);
          pl.position.set(Math.cos(angle)*r, h + 1, Math.sin(angle)*r);
          _add(pl);
          pointLights.push(pl);
        }
      }
    });

    // Ground lights
    for (let i = 0; i < 20; i++) {
      const a = Math.random()*Math.PI*2, r = 4+Math.random()*30;
      const pl = new THREE.PointLight(palette[i%palette.length], 0.6, 8);
      pl.position.set(Math.cos(a)*r, 0.3, Math.sin(a)*r);
      _add(pl); pointLights.push(pl);
    }

    // Road lines
    const roadMat = new THREE.MeshBasicMaterial({color: 0x223366});
    for (let i = -5; i <= 5; i++) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 100), roadMat);
      road.rotation.x = -Math.PI/2; road.position.set(i*4, 0.01, 0);
      _add(road);
      const road2 = new THREE.Mesh(new THREE.PlaneGeometry(100, 0.2), roadMat);
      road2.rotation.x = -Math.PI/2; road2.position.set(0, 0.01, i*4);
      _add(road2);
    }
  }

  // ── OCEAN REALM ──
  function _buildOcean(w) {
    // Wavy ground
    const geo = new THREE.PlaneGeometry(200, 200, 80, 80);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getY(i);
      pos.setZ(i, (Math.sin(x*0.3)*Math.cos(z*0.3)) * 0.6 + (Math.random()-0.5)*0.3);
    }
    geo.computeVertexNormals();
    const gMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: 0x001c33, roughness: 0.95, metalness: 0.1
    }));
    gMesh.rotation.x = -Math.PI/2; gMesh.receiveShadow = true;
    _add(gMesh);

    // Coral
    const coralColors = [0xff4488, 0xff8800, 0x00ffaa, 0xff2266, 0xffdd00, 0xbb44ff];
    for (let i = 0; i < 50; i++) {
      const a = Math.random()*Math.PI*2, r = 4+Math.random()*28;
      const h = 0.8 + Math.random() * 5.5;
      const segments = 3 + Math.floor(Math.random()*4);
      const color = coralColors[Math.floor(Math.random()*coralColors.length)];
      const mat = new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:0.25, roughness:0.8});
      const coral = new THREE.Mesh(new THREE.CylinderGeometry(0.05+Math.random()*0.1, 0.2+Math.random()*0.3, h, segments), mat);
      coral.position.set(Math.cos(a)*r, h/2, Math.sin(a)*r);
      coral.castShadow = true;
      _add(coral);
    }

    // Bubbles
    for (let i = 0; i < 100; i++) {
      const s = 0.04 + Math.random()*0.18;
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(s, 6, 6),
        new THREE.MeshStandardMaterial({color:0x88ddff, transparent:true, opacity:0.35, emissive:0x66bbff, emissiveIntensity:0.5})
      );
      b.position.set((Math.random()-0.5)*50, Math.random()*9, (Math.random()-0.5)*50);
      b.userData.bubble = { speed: 0.4+Math.random()*0.8, startY: b.position.y };
      _add(b);
    }

    // Bioluminescent fish (simple)
    const fishColors = [0x00ffff, 0xff44bb, 0x44ffaa];
    for (let i = 0; i < 12; i++) {
      const fc = fishColors[i%3];
      const fm = new THREE.MeshStandardMaterial({color:fc, emissive:fc, emissiveIntensity:0.8});
      const fish = new THREE.Mesh(new THREE.SphereGeometry(0.15+Math.random()*0.1,8,6), fm);
      fish.scale.z = 2.5;
      fish.position.set((Math.random()-0.5)*30, 0.5+Math.random()*4, (Math.random()-0.5)*30);
      fish.userData.fish = { phase: Math.random()*Math.PI*2, r: 4+Math.random()*8 };
      _add(fish);
    }

    // Underwater light shafts (vertical planes)
    for (let i = 0; i < 6; i++) {
      const shaftMat = new THREE.MeshBasicMaterial({
        color: 0x0088ff, transparent: true, opacity: 0.04, side: THREE.DoubleSide
      });
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 15), shaftMat);
      shaft.position.set((Math.random()-0.5)*30, 7, (Math.random()-0.5)*30);
      _add(shaft);
    }
  }

  // ── COSMOS ──
  function _buildCosmos(w) {
    _ground(w.groundColor, 300);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 2000; i++) {
      starPos.push((Math.random()-0.5)*250, 15+Math.random()*80, (Math.random()-0.5)*250);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({color:0xffffff, size:0.12, sizeAttenuation:true}));
    _add(stars);

    // Nebula clouds (large transparent spheres)
    const nebulaColors = [0xff44aa, 0x4422ff, 0x22aaff, 0xaa22ff];
    for (let i = 0; i < 5; i++) {
      const nc = nebulaColors[i%nebulaColors.length];
      const nebula = new THREE.Mesh(
        new THREE.SphereGeometry(8+Math.random()*12, 8, 8),
        new THREE.MeshBasicMaterial({color:nc, transparent:true, opacity:0.04, side:THREE.BackSide})
      );
      const a = Math.random()*Math.PI*2, r = 20+Math.random()*40;
      nebula.position.set(Math.cos(a)*r, 5+Math.random()*20, Math.sin(a)*r);
      _add(nebula);
    }

    // Planets
    const planetColors = [0xff4400, 0x4488ff, 0x44ff88, 0xffaa00, 0xff44aa, 0xaabb00, 0x44aaff];
    for (let i = 0; i < 10; i++) {
      const pr = 1.2 + Math.random() * 3.5;
      const pc = planetColors[i % planetColors.length];
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(pr, 18, 18),
        new THREE.MeshStandardMaterial({color:pc, emissive:pc, emissiveIntensity:0.12, roughness:0.75, metalness:0.1})
      );
      const pa = Math.random()*Math.PI*2, pd = 12+Math.random()*35;
      planet.position.set(Math.cos(pa)*pd, pr, Math.sin(pa)*pd);
      planet.castShadow = true;
      _add(planet);
      planet.userData.planet = { a: pa, r: pd, speed: (0.1+Math.random()*0.2) * (Math.random()>0.5?1:-1) };

      // Rings
      if (Math.random() > 0.45) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(pr*1.7, pr*0.18, 4, 48),
          new THREE.MeshStandardMaterial({color:pc, transparent:true, opacity:0.45, metalness:0.5, roughness:0.5})
        );
        ring.rotation.x = 0.4 + Math.random()*0.6;
        ring.position.copy(planet.position);
        ring.userData.ringOf = planet;
        _add(ring);
      }

      // Moon
      if (Math.random() > 0.6) {
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(pr*0.28, 10, 10),
          new THREE.MeshStandardMaterial({color:0xaaaaaa, roughness:0.9})
        );
        moon.position.copy(planet.position);
        moon.position.x += pr * 2.5;
        moon.userData.moonOf = { planet, offset: pr*2.5 };
        _add(moon);
      }
    }

    // Asteroid belt (ring of rocks)
    for (let i = 0; i < 60; i++) {
      const a = (i/60) * Math.PI*2 + Math.random()*0.1;
      const r = 50 + (Math.random()-0.5)*8;
      const sz = 0.1 + Math.random()*0.5;
      const asteroid = new THREE.Mesh(
        new THREE.IcosahedronGeometry(sz, 0),
        new THREE.MeshStandardMaterial({color:0x554433, roughness:0.95})
      );
      asteroid.position.set(Math.cos(a)*r, (Math.random()-0.5)*3, Math.sin(a)*r);
      asteroid.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
      _add(asteroid);
    }
  }

  // ── FOREST ──
  function _buildForest(w) {
    // Ground with bumps
    const geo = new THREE.PlaneGeometry(200, 200, 50, 50);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, (Math.random()-0.5)*0.4);
    }
    geo.computeVertexNormals();
    const gMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color:0x183310, roughness:0.95}));
    gMesh.rotation.x = -Math.PI/2; gMesh.receiveShadow = true;
    _add(gMesh);

    // Grass patches
    const grassColors = [0x1a4010, 0x2a5518, 0x1e4a12];
    for (let i = 0; i < 80; i++) {
      const gmat = new THREE.MeshStandardMaterial({color:grassColors[i%3], roughness:1});
      const patch = new THREE.Mesh(new THREE.CylinderGeometry(0.8+Math.random(),1.2+Math.random(),0.15,6), gmat);
      patch.position.set((Math.random()-0.5)*90, 0, (Math.random()-0.5)*90);
      patch.receiveShadow = true;
      _add(patch);
    }

    // Trees
    for (let i = 0; i < 80; i++) {
      const a = Math.random()*Math.PI*2;
      const r = 5 + Math.random()*38;
      const h = 4 + Math.random()*9;
      const trunkMat = new THREE.MeshStandardMaterial({color:0x3a1f08, roughness:0.95, metalness:0.0});
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.35, h, 7), trunkMat);
      trunk.position.set(Math.cos(a)*r, h/2, Math.sin(a)*r);
      trunk.castShadow = true;
      _add(trunk);

      const leafColor = 0x1a4010 + Math.floor(Math.random()*0x153300);
      const leafMat = new THREE.MeshStandardMaterial({
        color: leafColor, roughness: 0.9,
        emissive: leafColor, emissiveIntensity: 0.04
      });
      const leafR = 1.2 + Math.random()*1.5;
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(leafR, 8, 8), leafMat);
      leaves.position.set(trunk.position.x, h + leafR*0.5, trunk.position.z);
      leaves.scale.y = 0.7 + Math.random()*0.4;
      leaves.castShadow = true;
      _add(leaves);

      // Extra leaf layers
      if (Math.random() > 0.5) {
        const l2 = new THREE.Mesh(new THREE.SphereGeometry(leafR*0.7, 7, 7), leafMat);
        l2.position.set(trunk.position.x, h + leafR*1.2, trunk.position.z);
        _add(l2);
      }
    }

    // Rocks
    for (let i = 0; i < 25; i++) {
      const rMat = new THREE.MeshStandardMaterial({color:0x556655, roughness:0.9, metalness:0.1});
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3+Math.random()*0.8, 1), rMat);
      rock.position.set((Math.random()-0.5)*50, 0.2, (Math.random()-0.5)*50);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      _add(rock);
    }

    // Fireflies
    for (let i = 0; i < 60; i++) {
      const ff = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 4, 4),
        new THREE.MeshBasicMaterial({color: Math.random()>0.5 ? 0xffff44 : 0x44ffaa})
      );
      ff.position.set((Math.random()-0.5)*50, 0.5+Math.random()*3.5, (Math.random()-0.5)*50);
      ff.userData.firefly = { phase: Math.random()*Math.PI*2, ry: ff.position.y, rx: ff.position.x, rz: ff.position.z };
      _add(ff);
    }

    // Forest mist (low fog plane)
    const mistMat = new THREE.MeshBasicMaterial({color:0x4a7a40, transparent:true, opacity:0.06, side:THREE.DoubleSide});
    for (let i = 0; i < 5; i++) {
      const mist = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mistMat);
      mist.position.set((Math.random()-0.5)*30, 0.3+i*0.15, (Math.random()-0.5)*30);
      _add(mist);
    }
  }

  // ── DESERT RUINS ──
  function _buildDesert(w) {
    // Sandy ground
    const dGeo = new THREE.PlaneGeometry(200, 200, 60, 60);
    const dPos = dGeo.attributes.position;
    for (let i = 0; i < dPos.count; i++) {
      dPos.setZ(i, (Math.random()-0.5)*0.8);
    }
    dGeo.computeVertexNormals();
    const dMesh = new THREE.Mesh(dGeo, new THREE.MeshStandardMaterial({color:0x3a2a0e, roughness:0.95}));
    dMesh.rotation.x = -Math.PI/2; dMesh.receiveShadow = true;
    _add(dMesh);

    const stoneMat = new THREE.MeshStandardMaterial({color:0x5a4422, roughness:0.95, metalness:0.05});
    const ruinedMat = new THREE.MeshStandardMaterial({color:0x3d2d15, roughness:0.99});

    // Ruins columns
    for (let i = 0; i < 30; i++) {
      const a = Math.random()*Math.PI*2, r = 6+Math.random()*32;
      const h = 1+Math.random()*5;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,h,8), stoneMat);
      col.position.set(Math.cos(a)*r, h/2, Math.sin(a)*r);
      col.castShadow=true;
      if (Math.random()>0.3) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9,0.25,0.9), stoneMat);
        cap.position.set(col.position.x, h+0.12, col.position.z);
        _add(cap);
      }
      _add(col);
    }

    // Pyramid
    const pyrGeo = new THREE.ConeGeometry(8, 12, 4);
    const pyr = new THREE.Mesh(pyrGeo, stoneMat);
    pyr.position.set(30, 6, 30);
    pyr.castShadow = true;
    _add(pyr);

    // Broken walls
    for (let i = 0; i < 12; i++) {
      const len = 3+Math.random()*8;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(len, 1.2+Math.random()*1.5, 0.6), ruinedMat);
      wall.position.set((Math.random()-0.5)*50, 0.8, (Math.random()-0.5)*50);
      wall.rotation.y = Math.random()*Math.PI;
      wall.castShadow = true;
      _add(wall);
    }

    // Sand dunes
    for (let i = 0; i < 15; i++) {
      const dune = new THREE.Mesh(
        new THREE.SphereGeometry(3+Math.random()*4, 12, 8),
        new THREE.MeshStandardMaterial({color:0x4a3418, roughness:0.99})
      );
      dune.position.set((Math.random()-0.5)*80, -1+Math.random()*0.5, (Math.random()-0.5)*80);
      dune.scale.y = 0.3;
      _add(dune);
    }

    // Floating sand particles
    for (let i = 0; i < 40; i++) {
      const sp = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 4, 4),
        new THREE.MeshBasicMaterial({color:0xaa8833, transparent:true, opacity:0.6})
      );
      sp.position.set((Math.random()-0.5)*60, 0.3+Math.random()*2, (Math.random()-0.5)*60);
      sp.userData.sand = { phase: Math.random()*Math.PI*2, baseY: sp.position.y };
      _add(sp);
    }

    // Golden light from sun at horizon
    const sunGlow = new THREE.PointLight(0xff8800, 2, 80);
    sunGlow.position.set(60, 5, 60);
    _add(sunGlow); pointLights.push(sunGlow);
  }

  // ── PORTALS ──
  function _spawnPortals(currentWorldIdx, w) {
    const others = WORLD_DATA.filter(wd => wd.id !== currentWorldIdx);
    const positions = [
      [-6, -12], [6, -12], [0, 14], [-12, 0], [12, 0]
    ];
    others.slice(0, 4).forEach((targetWorld, i) => {
      const [px, pz] = positions[i];
      _buildPortal(px, pz, targetWorld);
    });
  }

  function _buildPortal(x, z, targetWorld) {
    const color = [0x00f5ff, 0xff6b00, 0xaa44ff, 0x00ff88, 0xffcc00][targetWorld.id % 5];

    // Outer ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.4, 0.12, 10, 48),
      new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:1.5, metalness:0.8, roughness:0.2})
    );
    ring.position.set(x, 2.0, z);
    _add(ring);

    // Inner portal plane
    const inner = new THREE.Mesh(
      new THREE.CircleGeometry(1.25, 32),
      new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.25, side:THREE.DoubleSide})
    );
    inner.position.set(x, 2.0, z);
    _add(inner);

    // Portal glow
    const pl = new THREE.PointLight(color, 1.2, 12);
    pl.position.set(x, 2, z);
    _add(pl); pointLights.push(pl);

    // Label
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256; labelCanvas.height = 48;
    const lCtx = labelCanvas.getContext('2d');
    lCtx.font = 'bold 16px "Share Tech Mono", monospace';
    lCtx.fillStyle = '#' + color.toString(16).padStart(6,'0');
    lCtx.textAlign = 'center';
    lCtx.fillText(`⬡ ${targetWorld.emoji} ${targetWorld.name}`, 128, 32);
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 0.6),
      new THREE.MeshBasicMaterial({map:labelTex, transparent:true, side:THREE.DoubleSide, depthWrite:false})
    );
    label.position.set(x, 3.8, z);
    _add(label);

    portals.push({ ring, inner, x, z, toWorldId: targetWorld.id, color });
  }

  const NPC_ARCHETYPES = {
    0: [
      { name:'NEXUS_GUIDE', role:'guide', mood:'helpful', bio:'City concierge who helps new arrivals learn controls, portals, and systems.' },
      { name:'BYTE_MERCHANT', role:'merchant', mood:'sharp', bio:'Trades cosmetic items, portal keys, and speed boosts in Nexus City.' },
      { name:'PATCH_KEEPER', role:'quest', mood:'focused', bio:'Offers delivery, scavenger, and calibration quests across the city districts.' }
    ],
    1: [
      { name:'TIDE_GUIDE', role:'guide', mood:'calm', bio:'Knows reefs, currents, and hidden bubbles in Ocean Realm.' },
      { name:'CORAL_TRADER', role:'merchant', mood:'cheerful', bio:'Sells coral shards, shells, and water-glide boosts.' },
      { name:'DEEP_SCOUT', role:'quest', mood:'mysterious', bio:'Gives quests about lost relics and glowing fish swarms.' }
    ],
    2: [
      { name:'STAR_SAGE', role:'guide', mood:'wise', bio:'Explains gravity pads, orbit paths, and cosmic landmarks.' },
      { name:'NEBULA_DEALER', role:'merchant', mood:'cool', bio:'Trades stardust, moon crystals, and rare trails.' },
      { name:'ORBIT_HUNTER', role:'quest', mood:'driven', bio:'Shares anomaly and beacon quests around drifting planets.' }
    ],
    3: [
      { name:'ROOT_GUIDE', role:'guide', mood:'warm', bio:'Knows safe paths, fireflies, and forest ruins.' },
      { name:'MOSS_MERCHANT', role:'merchant', mood:'friendly', bio:'Sells herbs, masks, and stealth charms.' },
      { name:'GROVE_WARDEN', role:'quest', mood:'alert', bio:'Provides rescue and cleansing quests in the deep grove.' }
    ],
    4: [
      { name:'DUNE_GUIDE', role:'guide', mood:'dry', bio:'Knows ruins, sand winds, and hidden vault paths.' },
      { name:'RELIC_MERCHANT', role:'merchant', mood:'greedy', bio:'Trades relic fragments, shields, and ancient keys.' },
      { name:'SUN_HUNTER', role:'quest', mood:'bold', bio:'Offers treasure and ruin defense quests in the desert.' }
    ]
  };

  // ── NPCs ──
  function _spawnNPCs(worldIdx) {
    const counts = [6, 5, 4, 7, 5];
    const n = counts[worldIdx] || 5;
    const world = WORLD_DATA[worldIdx];
    const archetypes = NPC_ARCHETYPES[worldIdx] || NPC_ARCHETYPES[0];

    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const r = 6 + Math.random() * 12;
      const archetype = archetypes[i % archetypes.length];
      const profile = {
        id: `${world.name.toLowerCase().replace(/\s+/g,'_')}_${i}`,
        name: i < archetypes.length ? archetype.name : `${world.name.split(' ')[0]}_${String(i).padStart(2,'0')}`,
        role: archetype.role,
        mood: archetype.mood,
        worldId: worldIdx,
        bio: archetype.bio,
        systemPrompt: `${archetype.name} is an NPC in ${world.name}. Stay in-character, be concise, reference the current world, and offer actionable help.`
      };
      AvatarSystem.spawnNPC(Math.cos(a) * r, Math.sin(a) * r, worldIdx + i, profile);
    }
  }

  // ── PER-FRAME ANIMATE ──
  function animate(time, delta) {
    worldObjects.forEach(obj => {
      const ud = obj.userData;
      if (ud.bubble)  { obj.position.y += delta * ud.bubble.speed; if(obj.position.y > 10) obj.position.y = 0; }
      if (ud.fish)    { obj.position.x = ud.fish.r*Math.cos(time*0.5+ud.fish.phase); obj.position.z = ud.fish.r*Math.sin(time*0.5+ud.fish.phase); obj.rotation.y = time*0.5+ud.fish.phase+Math.PI/2; }
      if (ud.planet)  { ud.planet.a += delta*ud.planet.speed; obj.position.x = Math.cos(ud.planet.a)*ud.planet.r; obj.position.z = Math.sin(ud.planet.a)*ud.planet.r; obj.rotation.y += delta*0.2; }
      if (ud.ringOf)  { obj.position.copy(ud.ringOf.position); }
      if (ud.moonOf)  { const pa = ud.moonOf.planet.userData.planet.a; obj.position.x = ud.moonOf.planet.position.x + Math.cos(time)*ud.moonOf.offset; obj.position.z = ud.moonOf.planet.position.z + Math.sin(time)*ud.moonOf.offset; }
      if (ud.firefly) { obj.position.y = ud.firefly.ry + Math.sin(time*2.5+ud.firefly.phase)*0.5; obj.position.x = ud.firefly.rx + Math.sin(time*1.3+ud.firefly.phase)*0.8; obj.material.opacity = 0.4+Math.sin(time*4+ud.firefly.phase)*0.4; }
      if (ud.sand)    { obj.position.y = ud.sand.baseY + Math.sin(time*1.5+ud.sand.phase)*0.4; }
    });

    // Rotate portals
    portals.forEach(p => {
      p.ring.rotation.z += delta * 0.8;
      p.ring.rotation.y += delta * 0.3;
      // Pulse inner
      const pScale = 1 + Math.sin(time*3)*0.05;
      p.inner.scale.setScalar(pScale);
      // Portal light pulse
    });
  }

  function getPortals()    { return portals; }
  function getWorldData()  { return WORLD_DATA; }
  function getCurrent()    { return currentIdx; }

  return { init, load, animate, getPortals, getWorldData, getCurrent };
})();
