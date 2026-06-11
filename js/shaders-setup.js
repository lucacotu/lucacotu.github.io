/* ====================================================================
   MODULO: SHADERS SETUP
   ====================================================================
   Compila il programma shader principale ("progObj", usato per
   disegnare stanza, cornici, statua e panchine), recupera le location
   di tutti i suoi attributi e uniform, e avvia il caricamento
   asincrono delle 4 mesh OBJ della scena.
   ==================================================================== */

// Creazione dei programmi shader

/* Programma principale per gli oggetti */
var progObj = webglUtils.createProgramFromScripts(gl, ["vertex-shader-obj", "fragment-shader-obj"]);


var positionLocation = gl.getAttribLocation(progObj, "a_position");     
var normalLocation = gl.getAttribLocation(progObj, "a_normal");         
var texcoordLocation = gl.getAttribLocation(progObj, "a_texcoord");    

var frameLocation = gl.getUniformLocation(progObj, "u_world");          
var textureLocation = gl.getUniformLocation(progObj, "u_texture");      
var viewMatrixLocation = gl.getUniformLocation(progObj, "u_view");      
var projectionMatrixLocation = gl.getUniformLocation(progObj, "u_proj"); 

var u_normalMatrix = gl.getUniformLocation(progObj, "u_normalMatrix");  
var u_viewPosLocation = gl.getUniformLocation(progObj, "u_viewPos");    

var u_ignoreLight = gl.getUniformLocation(progObj,'u_ignoreLight');     
var u_useTexture = gl.getUniformLocation(progObj,'u_useTexture');       
var u_objectColor = gl.getUniformLocation(progObj,'u_objectColor');     

/* Uniform delle sorgenti luminose (una per luce) */
var u_lights_position = [];
var u_lights_color = [];
var u_lights_intensity = [];
for (let i=0; i<2; i++){
  u_lights_position[i] = gl.getUniformLocation(progObj, `u_lights[${i}].position`)
  u_lights_color[i] =gl.getUniformLocation(progObj, `u_lights[${i}].color`)
  u_lights_intensity[i] =gl.getUniformLocation(progObj, `u_lights[${i}].intensity`)
}

// Caricamento delle mesh

var meshLight = new Array();
meshLight.sourceMesh= 'assets/light.obj';
meshLight.index = 0;
meshLight.part = [];

LoadMesh(gl, meshLight, () => {
  positionBufLight = [];
  normalBufLight = [];
  texcoordBufLight = [];
  numVerticesLight = [];
  gl.useProgram(progObj);
  for (let i=0; i<meshLight.part.length; i++){
      positionBufLight[i] = makeVBO(meshLight.part[i].positions);
      normalBufLight[i] = makeVBO(meshLight.part[i].normals);
      texcoordBufLight[i] = makeVBO(meshLight.part[i].texcoords);
      numVerticesLight[i] = meshLight.part[i].positions.length / 3;
  }
 onResourceLoaded();
});

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