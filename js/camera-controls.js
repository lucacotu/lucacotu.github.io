/* ====================================================================
   MODULO: CAMERA CONTROLS
   ====================================================================
   Gestisce lo stato e l'input della telecamera in prima persona:
   posizione/orientamento, stato seduto/in piedi, confini di movimento,
   apertura/chiusura del menu impostazioni e gestione di tutti gli
   ingressi utente (tastiera, controlli touch a schermo, mouse-look
   da desktop).
   ==================================================================== */

// ==================== MOVIMENTO DELLA TELECAMERA ====================

var menuOpen = false;
var shadowsEnabled = true;
var gui;

/**
 * Verifica se il giocatore può sedersi su una panchina nella posizione attuale
 */
function canSit() {
  const x = camPos[0];
  const z = camPos[2];

  /* Definisce le zone valide per sedersi per ciascuna panchina */
  const benches = [
    { x: [3.5, 6.5] },   /* Panchina destra */
    { x: [-6.5, -3.5] }, /* Panchina sinistra */
    { x: [-1.5, 1.5] }   /* Panchina centrale */
  ];

  /* Verifica se il giocatore è nell'area per sedersi e vicino a una panchina */
  if (z >= -1 && z <= 1) {
    for (let bench of benches) {
      if (x >= bench.x[0] && x <= bench.x[1]) {
        return true;
      }
    }
  }

  showNotification("You can't sit here", 2000);
  return false;
}

/**
 * Apre/chiude il menu impostazioni dat.GUI
 */
function toggleMenu() {
  menuOpen = !menuOpen;
  if (gui) {
    if ('ontouchstart' in window) {
      gui.domElement.style.display = menuOpen ? '' : 'none';
    } else {
      menuOpen ? gui.open() : gui.close();
    }
  }
}

/**
 * Gestisce l'input da tastiera per il movimento della telecamera e l'interazione
 * Implementa il movimento in prima persona con i tasti WASD e la rotazione con le frecce
 * Il tasto E alterna la posizione seduto/in piedi
 */
function handleCameraMovement(e) {
  if (menuOpen) return;
  const spd = 0.2;  /* Moltiplicatore della velocità di movimento */

  const forward = [Math.sin(yaw), 0, -Math.cos(yaw)];      
  const right = [Math.cos(yaw), 0, Math.sin(yaw)];

  if (sit == false && (e.key == "w" || e.key == "W")) {
    camPos = camPos.map((v, i) => v + forward[i] * spd);
  }
  if (sit == false && (e.key == "s" || e.key == "S")) {
    camPos = camPos.map((v, i) => v - forward[i] * spd);
  }
  if (sit == false && (e.key == "a" || e.key == 'A')) {
    camPos = camPos.map((v, i) => v - right[i] * spd);
  }
  if (sit == false && (e.key == "d" || e.key == "D")) {
    camPos = camPos.map((v, i) => v + right[i] * spd);
  }

  if (e.key == "ArrowLeft") yaw -= 0.05;
  if (e.key == "ArrowRight") yaw += 0.05;

  /* Alterna tra seduto e in piedi con il tasto E */
  if (e.key == "E" || e.key == "e") {
    if (sit) {
      sit = !sit;
      camPos[1] = 1.6;  
    } else {
      /* Tentativo di sedersi su una panchina */
      if (canSit()) {
        sit = !sit;
        if (camPos[2] < 0) yaw = 0;      
        else yaw = Math.PI;              
        camPos[1] = 1;                   
        camPos[2] = 0;                   
      }
    }
  }

  /* Limita la posizione della telecamera ai confini della stanza */
  camPos = camPos.map((v, i) => Math.min(Math.max(v, roomMin[i]), roomMax[i]));
}

// ===== INIZIALIZZAZIONE DELLA TELECAMERA =====
/**
 * Configurazione della telecamera in prima persona
 */

/* Confini dello spazio della telecamera */
var roomMin = [-width+1,0,-depth+1];
var roomMax = [width-1,height,depth-1];

/* Variabili di stato della telecamera */
var camPos = [0,1,0];   /* Posizione della telecamera */
var yaw = 0;            /* Angolo di rotazione orizzontale */
var sit = true;         /* Il giocatore è seduto? */

/* Listener da tastiera per il movimento della telecamera */
document.addEventListener("keydown", e => {
  handleCameraMovement(e);
  camPos = camPos.map((v,i) => Math.min(Math.max(v, roomMin[i]), roomMax[i]));
});

// ==================== CONTROLLI TOUCH ====================

if ('ontouchstart' in window) {
  document.getElementById('touch-controls').style.display = 'block';
  document.getElementById('controls-legend').style.display = 'none';
}

// --- Joystick (movimento, lato sinistro) ---
const joystickThumb = document.getElementById('joystick-thumb');
const joystickZone  = document.getElementById('joystick-zone');
const JOYSTICK_MAX  = 40;

let joystickActive = false;
let joystickId     = null;
let joystickOrigin = { x: 0, y: 0 };
let joystickDelta  = { x: 0, y: 0 };

joystickZone.addEventListener('touchstart', e => {
  if (menuOpen) return;
  e.preventDefault();
  const t = e.changedTouches[0];
  joystickId = t.identifier;
  joystickActive = true;
  const rect = joystickZone.getBoundingClientRect();
  joystickOrigin = { x: rect.left + 70, y: rect.top + 70 };
}, { passive: false });

joystickZone.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier !== joystickId) continue;
    let dx = t.clientX - joystickOrigin.x;
    let dy = t.clientY - joystickOrigin.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > JOYSTICK_MAX) { dx = dx / len * JOYSTICK_MAX; dy = dy / len * JOYSTICK_MAX; }
    joystickDelta = { x: dx, y: dy };
    joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;
  }
}, { passive: false });

joystickZone.addEventListener('touchend', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier !== joystickId) continue;
    joystickActive = false;
    joystickId = null;
    joystickDelta = { x: 0, y: 0 };
    joystickThumb.style.transform = 'translate(0px, 0px)';
  }
}, { passive: false });

function applyJoystickMovement() {
  if (!joystickActive || sit || menuOpen) return;
  const spd = 0.08;
  const nx = joystickDelta.x / JOYSTICK_MAX;
  const ny = joystickDelta.y / JOYSTICK_MAX;
  const forward = [Math.sin(yaw), 0, -Math.cos(yaw)];
  const right   = [Math.cos(yaw), 0,  Math.sin(yaw)];
  camPos = camPos.map((v, i) => v - forward[i] * ny * spd + right[i] * nx * spd);
  camPos = camPos.map((v, i) => Math.min(Math.max(v, roomMin[i]), roomMax[i]));
}

// --- Look zone (rotazione yaw, lato destro) ---
const lookZone = document.getElementById('look-zone');
let lookId    = null;
let lookLastX = 0;

lookZone.addEventListener('touchstart', e => {
  if (menuOpen) return;
  e.preventDefault();
  if (lookId !== null) return;
  const t = e.changedTouches[0];
  lookId    = t.identifier;
  lookLastX = t.clientX;
}, { passive: false });

lookZone.addEventListener('touchmove', e => {
  if (menuOpen) return;
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier !== lookId) continue;
    yaw += (t.clientX - lookLastX) * 0.005;
    lookLastX = t.clientX;
  }
}, { passive: false });

lookZone.addEventListener('touchend', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier !== lookId) continue;
    lookId = null;
  }
}, { passive: false });

// --- Pulsante interazione ---
document.getElementById('interact-btn').addEventListener('touchstart', e => {
  e.preventDefault();
  handleCameraMovement({ key: 'e' });
}, { passive: false });

// --- Pulsante menu impostazioni ---
document.getElementById('menu-btn').addEventListener('touchstart', e => {
  e.preventDefault();
  toggleMenu();
}, { passive: false });

// ==================== CONTROLLO VISTA CON MOUSE (DESKTOP) ====================
if (!('ontouchstart' in window)) {
  const MOUSE_SENSITIVITY = 0.003;
  let mouseDown = false;

  canvas.addEventListener('mousedown', e => {
    if (menuOpen) return;
    mouseDown = true;
  });

  document.addEventListener('mouseup', () => {
    mouseDown = false;
  });

  document.addEventListener('mousemove', e => {
    if (!mouseDown || menuOpen) return;
    yaw += e.movementX * MOUSE_SENSITIVITY;
  });
}
