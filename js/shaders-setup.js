/* ====================================================================
   MODULO: SHADERS SETUP
   ====================================================================
   Compila il programma shader principale ("progObj", usato per
   disegnare stanza, cornici, statua e panchine), recupera le location
   di tutti i suoi attributi e uniform, e avvia il caricamento
   asincrono delle 4 mesh OBJ della scena (luce, cornici, statua,
   panchine), convertendo ogni parte caricata in VBO al termine.

   Dipendenze: richiede gli script shader inline ("vertex-shader-obj"
   e "fragment-shader-obj" definiti in index.html), js/utils.js
   (makeVBO, onResourceLoaded), js/scene-geometry.js (gl e gli array
   positionBuf.../normalBuf.../texcoordBuf.../numVertices... per
   light/Frame/Statue/Bench) e utils/load_mesh.js (LoadMesh).

   Espone (variabili globali condivise, dichiarate con "var"): progObj,
   positionLocation, normalLocation, texcoordLocation, frameLocation,
   textureLocation, viewMatrixLocation, projectionMatrixLocation,
   u_normalMatrix, u_viewPosLocation, u_ignoreLight, u_useTexture,
   u_objectColor, u_lights_position[], u_lights_color[],
   u_lights_intensity[], meshLight, meshFrame, meshStatue, meshBench.
   ==================================================================== */

// ======= CONFIGURAZIONE DEI PROGRAMMI SHADER =======
/**
 * Creazione dei programmi shader:
 * Un programma è una coppia di shader compilati (vertex + fragment)
 * I programmi definiscono come viene renderizzata la geometria
 */

/* Programma principale per il rendering degli oggetti 3D (cornici, statua, panchine, stanza) */
var progObj = webglUtils.createProgramFromScripts(gl, ["vertex-shader-obj", "fragment-shader-obj"]);

// ===== POSIZIONI DEGLI ATTRIBUTI =====
/**
 * Gli attributi sono dati per-vertice passati agli shader
 * La location indica allo shader dove trovare ogni attributo nel VBO
 */
var positionLocation = gl.getAttribLocation(progObj, "a_position");     /* Posizione del vertice */
var normalLocation = gl.getAttribLocation(progObj, "a_normal");         /* Normale della superficie */
var texcoordLocation = gl.getAttribLocation(progObj, "a_texcoord");    /* Coordinata texture */

// ===== POSIZIONI DELLE UNIFORM =====
/**
 * Le uniform sono valori uguali per tutti i vertici in una draw call
 * Controllano trasformazioni, illuminazione e proprietà dei materiali
 */
var frameLocation = gl.getUniformLocation(progObj, "u_world");          /* Matrice da modello a mondo */
var textureLocation = gl.getUniformLocation(progObj, "u_texture");      /* Sampler della texture */
var viewMatrixLocation = gl.getUniformLocation(progObj, "u_view");      /* Matrice da mondo a vista */
var projectionMatrixLocation = gl.getUniformLocation(progObj, "u_proj"); /* Matrice da vista a clip */

var u_normalMatrix = gl.getUniformLocation(progObj, "u_normalMatrix");  /* Matrice di trasformazione delle normali */
var u_viewPosLocation = gl.getUniformLocation(progObj, "u_viewPos");    /* Posizione telecamera per lo specular */

var u_ignoreLight = gl.getUniformLocation(progObj,'u_ignoreLight');     /* Flag per disabilitare l'illuminazione */
var u_useTexture = gl.getUniformLocation(progObj,'u_useTexture');       /* Usa texture invece di colore solido */
var u_objectColor = gl.getUniformLocation(progObj,'u_objectColor');     /* Colore solido dell'oggetto */

/* Uniform delle sorgenti luminose (una per luce) */
var u_lights_position = [];
var u_lights_color = [];
var u_lights_intensity = [];
for (let i=0; i<2; i++){
  u_lights_position[i] = gl.getUniformLocation(progObj, `u_lights[${i}].position`)
  u_lights_color[i] =gl.getUniformLocation(progObj, `u_lights[${i}].color`)
  u_lights_intensity[i] =gl.getUniformLocation(progObj, `u_lights[${i}].intensity`)
}

// ===== CARICAMENTO DELLE MESH =====
/**
 * Carica i modelli 3D da file OBJ
 * Ogni mesh può avere più parti con materiali diversi
 *
 * Processo:
 * 1. Crea l'oggetto mesh con il percorso del file
 * 2. LoadMesh() carica il file OBJ in modo asincrono
 * 3. Converte i dati caricati in VBO della GPU nella callback
 */

/* Mesh della sorgente luminosa (attualmente non utilizzata) */
var meshLight = new Array();
meshLight.sourceMesh= 'assets/light.obj';
meshLight.index = 0;
meshLight.part = [];

LoadMesh(gl, meshLight, () => {
  /* Questa callback viene eseguita dopo il caricamento del file OBJ */
  positionBufLight = [];
  normalBufLight = [];
  texcoordBufLight = [];
  numVerticesLight = [];
  gl.useProgram(progObj);
  /* Converte ogni parte della mesh in buffer della GPU */
  for (let i=0; i<meshLight.part.length; i++){
      positionBufLight[i] = makeVBO(meshLight.part[i].positions);
      normalBufLight[i] = makeVBO(meshLight.part[i].normals);
      texcoordBufLight[i] = makeVBO(meshLight.part[i].texcoords);
      numVerticesLight[i] = meshLight.part[i].positions.length / 3;
  }
 onResourceLoaded();
});

/* Mesh delle cornici */
var meshFrame = new Array();
meshFrame.sourceMesh = 'assets/frame.obj';
meshFrame.index = 1;
meshFrame.part = [];
LoadMesh(gl, meshFrame, () => {
  positionBufFrame = [];
  normalBufFrame = [];
  texcoordBufFrame = [];
  numVerticesFrame = [];
  gl.useProgram(progObj);
  for (let i=0; i<meshFrame.part.length; i++){
      positionBufFrame[i] = makeVBO(meshFrame.part[i].positions);
      normalBufFrame[i] = makeVBO(meshFrame.part[i].normals);
      texcoordBufFrame[i] = makeVBO(meshFrame.part[i].texcoords);
      numVerticesFrame[i] = meshFrame.part[i].positions.length / 3;
  }
  onResourceLoaded();
});

/* Mesh della statua (scultura di Diana) */
var meshStatue = new Array();
meshStatue.sourceMesh = 'assets/statue.obj';
meshStatue.index = 1;
meshStatue.part = [];
LoadMesh(gl, meshStatue, () => {
  positionBufStatue = [];
  normalBufStatue = [];
  texcoordBufStatue = [];
  numVerticesStatue = [];
  gl.useProgram(progObj);
  for (let i=0; i<meshStatue.part.length; i++){
      positionBufStatue[i] = makeVBO(meshStatue.part[i].positions);
      normalBufStatue[i] = makeVBO(meshStatue.part[i].normals);
      texcoordBufStatue[i] = makeVBO(meshStatue.part[i].texcoords);
      numVerticesStatue[i] = meshStatue.part[i].positions.length / 3;
  }
  onResourceLoaded();
});

/* Mesh delle panchine (sedute della galleria) */
var meshBench = new Array();
meshBench.sourceMesh = 'assets/bench.obj';
meshBench.index = 1;
meshBench.part = [];
LoadMesh(gl, meshBench, () => {
  positionBufBench = [];
  normalBufBench = [];
  texcoordBufBench = [];
  numVerticesBench = [];
  gl.useProgram(progObj);
  for (let i=0; i<meshBench.part.length; i++){
      positionBufBench[i] = makeVBO(meshBench.part[i].positions);
      normalBufBench[i] = makeVBO(meshBench.part[i].normals);
      texcoordBufBench[i] = makeVBO(meshBench.part[i].texcoords);
      numVerticesBench[i] = meshBench.part[i].positions.length / 3;
  }
  onResourceLoaded();
});
