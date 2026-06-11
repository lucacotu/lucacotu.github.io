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
   ==================================================================== */

// Variabili globali 

/* Mesh della sorgente luminosa */
var positionBufLight = [];
var normalBufLight = [];
var texcoordBufLight = [];
var numVerticesLight = [];

/* Mesh delle cornici */
var positionBufFrame = [];
var normalBufFrame = [];
var texcoordBufFrame = [];
var numVerticesFrame = [];

/* Mesh della statua */
var positionBufStatue = [];
var normalBufStatue = [];
var texcoordBufStatue = [];
var numVerticesStatue = [];

/* Mesh delle panchine */
var positionBufBench = [];
var normalBufBench = [];
var texcoordBufBench = [];
var numVerticesBench = [];

/* Ottiene il canvas e il contesto WebGL2 */
var canvas = document.getElementById("gl");
var gl = canvas.getContext("webgl2");
if (!gl) throw "WebGL2 non supportato"; 

/* Matrice di proiezione */
var proj;

/**
 * Gestisce gli eventi di ridimensionamento della finestra
 * Aggiorna le dimensioni del canvas e la matrice di proiezione in base alla finestra
 */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  proj = m4.perspective(Math.PI/3, canvas.width/canvas.height, 0.1, 100);
}

/* Ridimensionamento iniziale per riempire la finestra */
resizeCanvas();
/* Aggiorna ad ogni ridimensionamento della finestra */
window.addEventListener("resize", resizeCanvas);

// Dimensioni della stanza
var width  = 10;  
var depth  = 6;   
var height = 3;

// Geometria pavimento
var floor = [
  -width,0,-depth,  width,0,-depth,  width,0, depth,   /* Primo triangolo */
  -width,0,-depth,  width,0, depth, -width,0, depth    /* Secondo triangolo */
];

// Geometria pareti

const wallN = [
  -width,0,-depth,  width,0,-depth,  width,height,-depth,
  -width,0,-depth,  width,height,-depth, -width,height,-depth
];

const wallS = [
  -width,0, depth,  width,0, depth,  width,height, depth,
  -width,0, depth,  width,height, depth, -width,height, depth
];

const wallE = [
   width,0,-depth,  width,0, depth,  width,height, depth,
   width,0,-depth,  width,height, depth,  width,height,-depth
];

const wallW = [
  -width,0,-depth, -width,0, depth, -width,height, depth,
  -width,0,-depth, -width,height, depth, -width,height,-depth
];

// Geometria soffitto
var ceil = [
  -width,height,-depth,  width,height, depth,  width,height,-depth,
  -width,height,-depth, -width,height, depth,  width,height, depth
];

// Normali superfici
const floorNormals = [
  0,1,0, 0,1,0, 0,1,0,
  0,1,0, 0,1,0, 0,1,0
];
var floorNormBuf = makeVBO(floorNormals);

const ceilNormals = [
  0,-1,0, 0,-1,0, 0,-1,0,
  0,-1,0, 0,-1,0, 0,-1,0
];
var ceilNormBuf = makeVBO(ceilNormals);


const wallNormals = [
  0,0,1, 0,0,1, 0,0,1,
  0,0,1, 0,0,1, 0,0,1,

  0,0,-1, 0,0,-1, 0,0,-1,
  0,0,-1, 0,0,-1, 0,0,-1,

  -1,0,0, -1,0,0, -1,0,0,
  -1,0,0, -1,0,0, -1,0,0,

  1,0,0, 1,0,0, 1,0,0,
  1,0,0, 1,0,0, 1,0,0,
];
var wallNormBuf = makeVBO(wallNormals);

// Cordinate texture

const wallText = [
  0,0,  1,0,  1,1,  
  0,0,  1,1,  0,1  
];

const floorText = [
  0,0,  4,0,  4,4,  
  0,0,  4,4,  0,4
];

const ceilText = [
  0,0,  2,2,  2,0,  
  0,0,  0,2,  2,2
];

// Creazione dei Vertex Buffer Object (VBO)
var floorBuf = makeVBO(floor);
var floorTexBuf = makeVBO(floorText);
var ceilBuf = makeVBO(ceil);
var ceilTexBuf = makeVBO(ceilText);
var wallsBuf = makeVBO([...wallN, ...wallS, ...wallE, ...wallW]);
var texturePosition = makeVBO([...wallText, ...wallText, ...wallText, ...wallText]);
var wallCount = (wallN.length + wallS.length + wallE.length + wallW.length) 

// Caricamento texture 

var textureWall = loadTexture(gl, "assets/", "wall.jpg");   
var textureFloor = loadTexture(gl, "assets/", "floor.jpg");   
var textureCeil = loadTexture(gl, "assets/", "wall.jpg");    

var textureFrame = [];
textureFrame[0] = loadTexture(gl, "assets/", "venere.jpg");      
textureFrame[1] = loadTexture(gl, "assets/", "onda.jpg");        
textureFrame[2] = loadTexture(gl, "assets/", "castello.jpg");    
textureFrame[3] = loadTexture(gl, "assets/", "colazione.jpg");   
textureFrame[4] = loadTexture(gl, "assets/", "memoria.jpg");     

var textureStatue = loadTexture(gl, "assets/", "statue_texture.jpg");    
var textureBench = loadTexture(gl, "assets/", "bench_Albedo.png");

console.log("Texture caricate: ", textureWall, textureFloor, textureCeil)
