/* ====================================================================
   MODULO: SCENE OBJECTS
   ====================================================================
   Definisce il contenuto "artistico" della galleria: le sorgenti
   luminose, il posizionamento delle cornici/quadri sulle pareti, le
   didascalie/targhette (con le relative texture di testo pre-generate)
   e le posizioni delle panchine. Imposta inoltre due opzioni globali
   del contesto WebGL necessarie al rendering: depth test e flip
   verticale delle texture caricate da immagine.

   Dipendenze: richiede js/scene-geometry.js (gl) e js/utils.js
   (createPlane, createTextTexture) già caricati.

   Espone (variabili globali condivise, dichiarate con "var"): lights,
   frames, caption, captionPlanes, benchPosition. Usate da
   js/shadow-mapping.js (shadow pass) e js/render.js (drawScene), oltre
   che da js/main.js (menu impostazioni e loop di animazione).
   ==================================================================== */

//====== CONFIGURAZIONE ILLUMINAZIONE E SCENA ======

/**
 * Definisce le sorgenti luminose della scena
 * Attualmente: 2 sorgenti luminose principali vicino al soffitto, una per lato della stanza
 * Struttura: position [x,y,z], color [r,g,b], intensity (moltiplicatore di luminosità)
 */
var lights = [
    {position:[4,2.5,0],   color:[1,1,1],   intensity:2},  /* Luce bianca centrale */
    {position:[-4,2.5,0],  color:[1,1,1],  intensity:2},  /* Luce calda laterale */
];

/**
 * Posizionamento delle cornici/quadri sulle pareti
 * Ogni cornice ha:
 * - translation: posizione sulla parete [x, y, z]
 * - rotation: orientamento [x, y, z] in radianti
 * - scale: fattore di scala delle dimensioni [x, y, z]
 * - textureIndex: quale texture del quadro usare (0-4)
 */
var frames = [
  {translation:[6, 1.7, -5.9], rotation: [Math.PI,0,Math.PI], scale:[1,1,1], textureIndex:0},
  {translation:[-6, 1.7, -5.9], rotation: [0,0,0], scale:[1,1,1], textureIndex:1},
  {translation:[0, 1.7, -5.9], rotation: [0,0,0], scale:[1,1,1], textureIndex:2},
  {translation:[6, 1.7, -5.9], rotation: [0,0,0], scale:[1,1,1], textureIndex:3},
  {translation:[-6, 1.7, -5.9], rotation: [Math.PI,0,Math.PI], scale:[1,1,1], textureIndex:4}
];

/**
 * Definizioni delle didascalie/targhette
 * Sovrapposizioni di testo che identificano le opere
 * Ogni didascalia mostra:
 * - position: posizione sulla parete [x, y, z]
 * - rotation: direzione verso cui è rivolta
 * - text: nome dell'opera e autore
 *
 * Attualmente mostra i nomi degli artisti e i titoli delle opere
 */
var caption = [
  {index:0,translation: [6, 0.8, -5.9], rotation:[0, 0, 0], textSize: 27, text: "Colazione sull'erba \n Claude Monet" },
  {index:1,translation: [-6, 0.8, -5.9], rotation:[0, 0, 0], textSize: 27, text: "La grande onda di Kanagawa \n Katsushika Hokusai" },
  {index:2,translation: [0, 0.8, -5.9], rotation:[0, 0, 0], textSize: 27, text: "Castello Pandone \n Luca Cotugno" },
  {index:3,translation: [-6, 0.8, 5.9], rotation:[0, Math.PI, 0], textSize: 27, text: "Nascita di Venere \n Sandro Botticelli" },
  {index:4,translation: [6, 0.8, 5.9], rotation:[0, Math.PI, 0], textSize: 27, text: "La persistenza della memoria \n Salvador Dalì" },
  {index:5,translation: [-1.3, 1.2, 5.9], rotation:[0, Math.PI, 0], textSize: 27, text: "Diane \n Anselme Flamen" }
]

/* Pre-crea gli oggetti plane e texture per ogni didascalia */
var captionPlanes = []
caption.forEach(cap => {
  captionPlanes[cap.index] = { plane: createPlane(gl), texture: createTextTexture(gl, cap.text) };
})

captionPlanes.forEach(cap => {
  console.log("Drawing plaque with vertices:", cap.plane.numVertices);
})

/* Posizioni delle panchine nella stanza */
var benchPosition = [[5,0.2,0],[0,0.2,0],[-5,0.2,0]];

/* Numero totale di sorgenti luminose (usato nel ciclo dello shader) */
const NUM_LIGHTS = lights.length;

// ===== CONFIGURAZIONE DEL RENDERING =====

/* Abilita il depth test per renderizzare correttamente gli oggetti 3D sovrapposti */
gl.enable(gl.DEPTH_TEST);

/**
 * Configurazione del caricamento texture: capovolge l'asse Y quando carica le immagini
 * Questo perché WebGL usa l'origine in basso a sinistra mentre le immagini usano quella in alto a sinistra
 */
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
