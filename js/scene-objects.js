/* ====================================================================
   MODULO: SCENE OBJECTS
   ====================================================================
   Definisce la posizione delle sorgenti luminose, dei quadri, delle targhe 
   e delle panchine nella scena.
   ==================================================================== */

// Definizione sorgenti luminose
var lights = [
    {position:[4,2.5,0],   color:[1,1,1],   intensity:2}, 
    {position:[-4,2.5,0],  color:[1,1,1],  intensity:2},  
];

// Definizione dei quadri
var frames = [
  {translation:[6, 1.7, -5.9], rotation: [Math.PI,0,Math.PI], scale:[1,1,1], textureIndex:0},
  {translation:[-6, 1.7, -5.9], rotation: [0,0,0], scale:[1,1,1], textureIndex:1},
  {translation:[0, 1.7, -5.9], rotation: [0,0,0], scale:[1,1,1], textureIndex:2},
  {translation:[6, 1.7, -5.9], rotation: [0,0,0], scale:[1,1,1], textureIndex:3},
  {translation:[-6, 1.7, -5.9], rotation: [Math.PI,0,Math.PI], scale:[1,1,1], textureIndex:4}
];

// Definizione delle targhe
var caption = [
  {index:0,translation: [6, 0.8, -5.9], rotation:[0, 0, 0], textSize: 27, text: "Colazione sull'erba \n Claude Monet" },
  {index:1,translation: [-6, 0.8, -5.9], rotation:[0, 0, 0], textSize: 27, text: "La grande onda di Kanagawa \n Katsushika Hokusai" },
  {index:2,translation: [0, 0.8, -5.9], rotation:[0, 0, 0], textSize: 27, text: "Castello Pandone \n Luca Cotugno" },
  {index:3,translation: [-6, 0.8, 5.9], rotation:[0, Math.PI, 0], textSize: 27, text: "Nascita di Venere \n Sandro Botticelli" },
  {index:4,translation: [6, 0.8, 5.9], rotation:[0, Math.PI, 0], textSize: 27, text: "La persistenza della memoria \n Salvador Dalì" },
  {index:5,translation: [-1.3, 1.2, 5.9], rotation:[0, Math.PI, 0], textSize: 27, text: "Diane \n Anselme Flamen" }
]

/* Pre-crea gli oggetti plane e texture per ogni targa */
var captionPlanes = []
caption.forEach(cap => {
  captionPlanes[cap.index] = { plane: createPlane(gl), texture: createTextTexture(gl, cap.text) };
})

captionPlanes.forEach(cap => {
  console.log("Drawing plaque with vertices:", cap.plane.numVertices);
})

/* Posizioni delle panchine */
var benchPosition = [[5,0.2,0],[0,0.2,0],[-5,0.2,0]];

// ===== CONFIGURAZIONE DEL RENDERING =====

/* Abilita il depth test per renderizzare correttamente gli oggetti 3D sovrapposti */
gl.enable(gl.DEPTH_TEST);

// Capovolge l'asse Y quando carica le immagini
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
