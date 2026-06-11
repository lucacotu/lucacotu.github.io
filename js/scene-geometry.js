/* ====================================================================
   MODULO: SCENE GEOMETRY
   ====================================================================
   Inizializza il canvas e il contesto WebGL2, gestisce il
   ridimensionamento della finestra e la matrice di proiezione, e
   definisce la geometria statica della stanza (pavimento, pareti,
   soffitto) con le relative normali, coordinate texture e VBO.
   Carica inoltre tutte le texture di superficie e dei quadri da file
   immagine. Dichiara infine gli array dei buffer per le mesh OBJ
   (luce, cornici, statua, panchine), che verranno popolati dal
   modulo shaders-setup.js dopo il caricamento dei file .obj.

   Dipendenze: richiede js/utils.js (makeVBO, loadTexture) già caricato.

   Espone (variabili globali condivise, dichiarate con "var" per
   essere visibili agli altri moduli): canvas, gl, proj, width, depth,
   height (dimensioni della stanza, usate anche da camera-controls.js
   per i confini di movimento), le coppie
   positionBuf.../normalBuf.../texcoordBuf.../numVertices... per
   light/Frame/Statue/Bench, floor, ceil, floorBuf/floorTexBuf,
   ceilBuf/ceilTexBuf, wallsBuf, texturePosition, wallCount,
   floorNormBuf/ceilNormBuf/wallNormBuf, textureWall/Floor/Ceil,
   textureFrame[], textureStatue, textureBench.
   ==================================================================== */

// ==================== VARIABILI GLOBALI ====================
/**
 * Questi array e oggetti memorizzano i dati dei vertex buffer per tutti gli oggetti 3D
 * che possono essere renderizzati. La geometria di ogni oggetto è suddivisa per materiale (parti).
 *
 * Struttura: [meshID][partIndex] = bufferObject
 */

/* Mesh della sorgente luminosa (attualmente non utilizzata) */
var positionBufLight = [];
var normalBufLight = [];
var texcoordBufLight = [];
var numVerticesLight = [];

/* Mesh delle cornici (quadri) */
var positionBufFrame = [];
var normalBufFrame = [];
var texcoordBufFrame = [];
var numVerticesFrame = [];

/* Mesh della statua (scultura di Diana) */
var positionBufStatue = [];
var normalBufStatue = [];
var texcoordBufStatue = [];
var numVerticesStatue = [];

/* Mesh delle panchine (arredamento) */
var positionBufBench = [];
var normalBufBench = [];
var texcoordBufBench = [];
var numVerticesBench = [];

/* Ottiene il canvas e il contesto WebGL2 */
var canvas = document.getElementById("gl");
var gl = canvas.getContext("webgl2");
if (!gl) throw "WebGL2 non supportato";  /* Errore di fallback se WebGL2 non è disponibile */

/* Matrice di proiezione, condivisa con tutti i moduli: dichiarata qui
   perché resizeCanvas() (chiamata subito sotto) la imposta per la
   prima volta. Verrà inviata allo shader nel loop di animazione. */
var proj;

/**
 * Gestisce gli eventi di ridimensionamento della finestra
 * Aggiorna le dimensioni del canvas e la matrice di proiezione in base alla finestra
 */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  /* Ricalcola la matrice di proiezione per il nuovo aspect ratio */
  proj = m4.perspective(Math.PI/3, canvas.width/canvas.height, 0.1, 100);
}

/* Ridimensionamento iniziale per riempire la finestra */
resizeCanvas();
/* Aggiorna ad ogni ridimensionamento della finestra */
window.addEventListener("resize", resizeCanvas);

// ===== DEFINIZIONE GEOMETRIA DELLA STANZA =====
/**
 * Definisce le dimensioni della stanza della galleria
 * Le unità sono unità di distanza arbitrarie (assumiamo metri)
 */
var width  = 10;  /* Larghezza della stanza (asse X) */
var depth  = 6;   /* Profondità della stanza (asse Z) */
var height = 3;   /* Altezza della stanza (asse Y) */

/**
 * ===== GEOMETRIA DEL PAVIMENTO =====
 * Piano piatto a Y=0 (livello del suolo)
 * Due triangoli che formano un quadrilatero, seguendo l'ordine di avvolgimento di OpenGL (antiorario visto dall'alto)
 */
var floor = [
  -width,0,-depth,  width,0,-depth,  width,0, depth,   /* Primo triangolo */
  -width,0,-depth,  width,0, depth, -width,0, depth    /* Secondo triangolo */
];

/**
 * ===== GEOMETRIA DELLE PARETI =====
 * Quattro pareti: Nord (-Z), Sud (+Z), Est (+X), Ovest (-X)
 * Ogni parete è composta da 2 triangoli (quadrilatero)
 * Le normali puntano verso l'esterno della stanza
 */

/* Parete nord (lato Z negativo) */
const wallN = [
  -width,0,-depth,  width,0,-depth,  width,height,-depth,
  -width,0,-depth,  width,height,-depth, -width,height,-depth
];

/* Parete sud (lato Z positivo) */
const wallS = [
  -width,0, depth,  width,0, depth,  width,height, depth,
  -width,0, depth,  width,height, depth, -width,height, depth
];

/* Parete est (lato X positivo) */
const wallE = [
   width,0,-depth,  width,0, depth,  width,height, depth,
   width,0,-depth,  width,height, depth,  width,height,-depth
];

/* Parete ovest (lato X negativo) */
const wallW = [
  -width,0,-depth, -width,0, depth, -width,height, depth,
  -width,0,-depth, -width,height, depth, -width,height,-depth
];

/**
 * ===== GEOMETRIA DEL SOFFITTO =====
 * Piano piatto a Y=height
 * La normale punta verso il basso (verso l'interno della stanza)
 */
var ceil = [
  -width,height,-depth,  width,height, depth,  width,height,-depth,
  -width,height,-depth, -width,height, depth,  width,height, depth
];

// ===== NORMALI DELLE SUPERFICI =====
/**
 * Le normali sono perpendicolari alla superficie e servono per i calcoli di illuminazione
 * Ogni normale è specificata per vertice (può essere condivisa da più normali per il flat shading)
 */

/* Le normali del pavimento puntano verso l'alto (direzione +Y) */
const floorNormals = [
  0,1,0, 0,1,0, 0,1,0,
  0,1,0, 0,1,0, 0,1,0
];
var floorNormBuf = makeVBO(floorNormals);

/* Le normali del soffitto puntano verso il basso (direzione -Y) - rivolte verso l'interno */
const ceilNormals = [
  0,-1,0, 0,-1,0, 0,-1,0,
  0,-1,0, 0,-1,0, 0,-1,0
];
var ceilNormBuf = makeVBO(ceilNormals);

/**
 * Le normali delle pareti puntano verso l'esterno della stanza
 * Suddivise in 4 gruppi: davanti(+Z), dietro(-Z), sinistra(-X), destra(+X)
 */
const wallNormals = [
  /* Normale della parete sud (direzione +Z) */
  0,0,1, 0,0,1, 0,0,1,
  0,0,1, 0,0,1, 0,0,1,
  /* Normale della parete nord (direzione -Z) */
  0,0,-1, 0,0,-1, 0,0,-1,
  0,0,-1, 0,0,-1, 0,0,-1,
  /* Normale della parete ovest (direzione -X) */
  -1,0,0, -1,0,0, -1,0,0,
  -1,0,0, -1,0,0, -1,0,0,
  /* Normale della parete est (direzione +X) */
  1,0,0, 1,0,0, 1,0,0,
  1,0,0, 1,0,0, 1,0,0,
];
var wallNormBuf = makeVBO(wallNormals);

// ====== COORDINATE TEXTURE ======
/**
 * Le coordinate UV mappano le immagini delle texture 2D sulle superfici 3D
 * Intervallo: da (0,0) in basso a sinistra a (1,1) in alto a destra dell'immagine texture
 * Possono essere usate più mappature per tiling diversi (es. il pavimento ha un tiling 4x4)
 */

const wallText = [
  0,0,  1,0,  1,1,  /* Primo triangolo della texture della parete */
  0,0,  1,1,  0,1   /* Secondo triangolo della texture della parete */
];

const floorText = [
  0,0,  4,0,  4,4,  /* Il pavimento ripete la texture 4 volte in ogni direzione */
  0,0,  4,4,  0,4
];

const ceilText = [
  0,0,  2,2,  2,0,  /* Il soffitto ha un tiling della texture 2x2 */
  0,0,  0,2,  2,2
];

// ===== CREAZIONE DEI VERTEX BUFFER OBJECT (VBO) =====
/**
 * Converte tutti i dati di geometria dalla RAM alla memoria video della GPU
 * I VBO sono efficienti per il rendering di mesh di grandi dimensioni
 */
var floorBuf = makeVBO(floor);
var floorTexBuf = makeVBO(floorText);
var ceilBuf = makeVBO(ceil);
var ceilTexBuf = makeVBO(ceilText);
var wallsBuf = makeVBO([...wallN, ...wallS, ...wallE, ...wallW]);  /* Combina tutte e 4 le pareti */
var texturePosition = makeVBO([...wallText, ...wallText, ...wallText, ...wallText]);
var wallCount = (wallN.length + wallS.length + wallE.length + wallW.length) / 3; /* Totale vertici delle pareti */

// ===== CARICAMENTO TEXTURE DA FILE IMMAGINE =====
/**
 * Le texture sono immagini 2D mappate sulle superfici 3D
 * Vengono caricate in modo asincrono da file immagine
 * Ogni materiale usa un file texture diverso
 */

/* Texture delle superfici della stanza */
var textureWall = loadTexture(gl, "assets/", "wall.jpg");   /* Texture della parete */
var textureFloor = loadTexture(gl, "assets/", "floor.jpg");   /* Pavimento in legno */
var textureCeil = loadTexture(gl, "assets/", "wall.jpg");    /* Soffitto (uguale al pavimento) */

/* Texture dei quadri/cornici (5 opere diverse) */
var textureFrame = [];
textureFrame[0] = loadTexture(gl, "assets/", "venere.jpg");      /* Quadro 1 */
textureFrame[1] = loadTexture(gl, "assets/", "onda.jpg");        /* L'onda (Hokusai) */
textureFrame[2] = loadTexture(gl, "assets/", "castello.jpg");    /* Castello */
textureFrame[3] = loadTexture(gl, "assets/", "colazione.jpg");   /* Quadro di Manet */
textureFrame[4] = loadTexture(gl, "assets/", "memoria.jpg");     /* Quadro di Dalí */

/* Texture degli oggetti */
var textureStatue = loadTexture(gl, "assets/", "statue_texture.jpg");    /* Texture marmo della statua */
var textureBench = loadTexture(gl, "assets/", "bench_Albedo.png");       /* Texture legno della panchina */

console.log("Texture caricate: ", textureWall, textureFloor, textureCeil)
