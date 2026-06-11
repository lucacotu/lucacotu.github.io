/* ====================================================================
   MODULO: UTILS
   ====================================================================
   Funzioni di utilità generiche usate da tutti gli altri moduli:
   - Sistema di notifiche a schermo e tracciamento del caricamento
     delle risorse (texture e mesh) prima di avviare il rendering
   - Helper WebGL generici per creare buffer, geometrie semplici e
     texture
   ==================================================================== */


// Mostra un messaggio di notifica temporaneo al centro dello schermo
let notifTimeout;
function showNotification(text, duration = 3000) {
  const notif = document.getElementById("notification");
  clearTimeout(notifTimeout);  
  notif.innerText = text;      
  notif.style.opacity = "1";   
  notifTimeout = setTimeout(() => {
    notif.style.opacity = "0";
  }, duration);
}

// Risorse da attendere: 10 texture (3 stanza + 5 quadri + statua + panchina) + 4 mesh = 14
const TOTAL_RESOURCES = 14;
let resourcesToLoad = TOTAL_RESOURCES;

function onResourceLoaded() {
  resourcesToLoad--;
  document.getElementById("loading-text").innerText =
    `Loading... ${TOTAL_RESOURCES - resourcesToLoad}/${TOTAL_RESOURCES}`;
  if (resourcesToLoad <= 0) {
    document.getElementById("loading").style.display = "none";
    draw();
  }
}

// ==================== FUNZIONI DI UTILITÀ ====================

// Crea un Vertex Buffer Object (VBO) 
function makeVBO(data) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  return buf;
}

// Crea un piano 2D per le targhe
function createPlane(gl) {
  /* ===== VERTICI DEL PIANO ===== */
  const positions = new Float32Array([
    -1, -0.5, 0,  
     1, -0.5, 0,  
    -1,  0.5, 0,  
     1,  0.5, 0,  
  ]);

  // Coordinate texture
  const texcoords = new Float32Array([
    0, 1,  
    1, 1,  
    0, 0,  
    1, 0,  
  ]);

  // Normali
  const normals = new Float32Array([
    0, 0, 1, 
    0, 0, 1,
    0, 0, 1,
    0, 0, 1
  ]);

  // Crea e carica i buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    texcoord: texcoordBuffer,
    normal: normalBuffer,
    numVertices: 4
  };
}

// Calcola e invia allo shader la matrice delle normali
function setNormalMatrix(world) {
  const it = m4.transpose(m4.inverse(world));
  gl.uniformMatrix3fv(
    u_normalMatrix,
    false,
    new Float32Array([
      it[0], it[1], it[2],
      it[4], it[5], it[6],
      it[8], it[9], it[10],
    ])
  );
}


// Carica un file immagine come texture 
function loadTexture(gl, path, fileName) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Crea una texture placeholder bianca
  const level = 0;
  const internalFormat = gl.RGBA;
  const pixel = new Uint8Array([255, 255, 255, 255]);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

  if(fileName){
    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      onResourceLoaded();  /* Segnala che il caricamento di una risorsa è terminato */
    };
    img.src = path + fileName;
  }
  return texture;
}

// Crea una texture a partire da testo
function createTextTexture(gl, text) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 512;
  canvas.height = 128;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle"; 

  const lines = text.split("\n");
  const lineHeight = 34;
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });


  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  return texture;
}