/* ═══════════════════════════════════
   physics.js — Custom Physics Engine
═══════════════════════════════════ */
'use strict';

const Physics = (() => {
  const GRAVITY      = 22;
  const JUMP_FORCE   = 10;
  const WALK_SPEED   = 7;
  const SPRINT_SPEED = 14;
  const FRICTION     = 12;
  const GROUND_Y     = 2.2;
  const STEP_HEIGHT  = 0.5;

  let _camera, _scene;
  let velocity   = new THREE.Vector3();
  let canJump    = true;
  let onGround   = true;
  let sprinting  = false;

  // Input state
  const keys = {};
  let mouseDX = 0, mouseDY = 0;
  let pointerLocked = false;

  // Euler for look
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const lookSensitivity = 0.0018;

  // Collision objects (bounding boxes)
  const collidables = [];
  const _box = new THREE.Box3();
  const _playerBox = new THREE.Box3();

  function init(camera, scene) {
    _camera = camera;
    _scene  = scene;
    _attachListeners();
  }

  function _attachListeners() {
    document.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'Space') { _tryJump(); e.preventDefault(); }
    });
    document.addEventListener('keyup',  e => { keys[e.code] = false; });
    document.addEventListener('mousemove', e => {
      if (!pointerLocked) return;
      mouseDX += e.movementX;
      mouseDY += e.movementY;
    });
    document.addEventListener('pointerlockchange', () => {
      pointerLocked = document.pointerLockElement === document.getElementById('canvas');
    });
  }

  function _tryJump() {
    if (canJump && onGround) {
      velocity.y = JUMP_FORCE;
      canJump = false;
      onGround = false;
      setTimeout(() => { canJump = true; }, 300);
    }
  }

  function addCollidable(mesh) { collidables.push(mesh); }
  function clearCollidables() { collidables.length = 0; }

  function update(delta) {
    if (!_camera) return;

    // ── LOOK ──
    euler.y -= mouseDX * lookSensitivity;
    euler.x -= mouseDY * lookSensitivity;
    euler.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, euler.x));
    _camera.quaternion.setFromEuler(euler);
    mouseDX = 0; mouseDY = 0;

    // ── MOVEMENT ──
    sprinting = !!keys['ShiftLeft'];
    const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;

    const fwd   = new THREE.Vector3(-Math.sin(euler.y), 0, -Math.cos(euler.y));
    const right = new THREE.Vector3( Math.cos(euler.y), 0, -Math.sin(euler.y));

    const move = new THREE.Vector3();
    if (keys['KeyW']) move.add(fwd);
    if (keys['KeyS']) move.sub(fwd);
    if (keys['KeyD']) move.add(right);
    if (keys['KeyA']) move.sub(right);
    move.normalize();

    const accel = 60 * delta;
    velocity.x += move.x * speed * accel;
    velocity.z += move.z * speed * accel;

    // ── FRICTION ──
    velocity.x -= velocity.x * FRICTION * delta;
    velocity.z -= velocity.z * FRICTION * delta;

    // ── GRAVITY ──
    if (!onGround) {
      velocity.y -= GRAVITY * delta;
    }

    // ── APPLY ──
    _camera.position.x += velocity.x * delta;
    _camera.position.y += velocity.y * delta;
    _camera.position.z += velocity.z * delta;

    // ── GROUND CHECK ──
    if (_camera.position.y <= GROUND_Y) {
      _camera.position.y = GROUND_Y;
      velocity.y = 0;
      onGround = true;
    } else {
      onGround = false;
    }

    // ── BOUNDARY ──
    const LIMIT = 90;
    _camera.position.x = Math.max(-LIMIT, Math.min(LIMIT, _camera.position.x));
    _camera.position.z = Math.max(-LIMIT, Math.min(LIMIT, _camera.position.z));
  }

  function getEuler()     { return euler; }
  function getVelocity()  { return velocity; }
  function isOnGround()   { return onGround; }
  function isSprinting()  { return sprinting; }
  function isMoving()     { return !!(keys['KeyW']||keys['KeyS']||keys['KeyA']||keys['KeyD']); }
  function getSpeed()     { return Math.sqrt(velocity.x*velocity.x + velocity.z*velocity.z); }
  function isKey(code)    { return !!keys[code]; }
  function isLocked()     { return pointerLocked; }
  function resetVelocity(){ velocity.set(0,0,0); }

  return { init, update, addCollidable, clearCollidables,
           getEuler, getVelocity, isOnGround, isSprinting,
           isMoving, getSpeed, isKey, isLocked, resetVelocity };
})();
