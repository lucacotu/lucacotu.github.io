/* ====================================================================
   MODULO: UTILS
   ====================================================================
   Funzioni di utilità generiche usate da tutti gli altri moduli:
   - Sistema di notifiche a schermo e tracciamento del caricamento
     delle risorse (texture e mesh) prima di avviare il rendering
   - Helper WebGL generici per creare buffer, geometrie semplici e
     texture (da immagine o da testo disegnato su canvas 2D)

   Dipendenze: nessuna verso altri moduli applicativi. Usa solo le
   librerie esterne caricate nell'<head> (gl viene usato dentro le
   funzioni ma risolto solo al momento della chiamata, quando
   scene-geometry.js lo ha già definito).

   Espone (variabili/funzioni globali): notifTimeout, showNotification,
   resourcesToLoad, onResourceLoaded, makeVBO, createPlane,
   setNormalMatrix, loadTexture, createTextTexture.
   Deve essere caricato per primo, prima di scene-geometry.js.
   ==================================================================== */

// ==================== SISTEMA DI NOTIFICHE ====================
/**
 * Mostra un messaggio di notifica temporaneo al centro dello schermo
 * @param {string} text - Il messaggio da visualizzare
 * @param {number} duration - Per quanto tempo mostrare il messaggio, in millisecondi (default: 3000)
 *
 * Esempio: showNotification("Non puoi sederti qui", 2000)
 */
let notifTimeout;

function showNotification(text, duration = 3000) {
  const notif = document.getElementById("notification");
  clearTimeout(notifTimeout);  /* Annulla il timeout precedente se una notifica è già visibile */
  notif.innerText = text;      /* Imposta il testo della notifica */
  notif.style.opacity = "1";   /* La rende visibile (la transizione CSS gestisce la dissolvenza in entrata) */
  /* Pianifica la dissolvenza in uscita della notifica dopo "duration" */
  notifTimeout = setTimeout(() => {
    notif.style.opacity = "0";
  }, duration);
}

// Risorse da attendere: 8 texture + 4 mesh = 12
let resourcesToLoad = 12;

function onResourceLoaded() {
  resourcesToLoad--;
  document.getElementById("loading-text").innerText =
    `Loading... ${12 - resourcesToLoad}/12`;
  if (resourcesToLoad <= 0) {
    document.getElementById("loading").style.display = "none";
    draw();
  }
}

// ==================== FUNZIONI DI UTILITÀ ====================

/**
 * Crea un Vertex Buffer Object (VBO) - memoria GPU per i dati dei vertici
 * @param {number[]} data - Array di valori degli attributi dei vertici
 * @returns {WebGLBuffer} Il buffer creato
 *
 * I VBO vengono usati per memorizzare grandi quantità di dati geometrici
 * sulla GPU, per un rendering efficiente delle mesh e della geometria della stanza
 */
function makeVBO(data) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  return buf;
}

/**
 * Crea una semplice geometria 2D a forma di piano (per le targhette didascaliche)
 * Usato per mostrare il testo su pannelli all'interno della scena 3D
 * @param {WebGLRenderingContext} gl - Il contesto WebGL
 * @returns {object} Oggetto contenente i buffer VBO di posizione, texcoord e normali
 *
 * Il piano è un quad 2x1 (2 unità di larghezza, 1 di altezza) sul piano XY rivolto verso +Z
 */
function createPlane(gl) {
  /* ===== VERTICI DEL PIANO ===== */
  const positions = new Float32Array([
    -1, -0.5, 0,  /* Basso-sinistra */
     1, -0.5, 0,  /* Basso-destra */
    -1,  0.5, 0,  /* Alto-sinistra */
     1,  0.5, 0,  /* Alto-destra */
  ]);

  /* ===== COORDINATE TEXTURE ===== */
  const texcoords = new Float32Array([
    0, 1,  /* UV basso-sinistra */
    1, 1,  /* UV basso-destra */
    0, 0,  /* UV alto-sinistra */
    1, 0,  /* UV alto-destra */
  ]);

  /* ===== NORMALI DI SUPERFICIE ===== */
  const normals = new Float32Array([
    0, 0, 1,  /* Tutti i vertici puntano verso +Z (rivolti verso la telecamera) */
    0, 0, 1,
    0, 0, 1,
    0, 0, 1
  ]);

  /* Crea e carica i buffer degli attributi dei vertici */
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

/**
 * Calcola e invia allo shader la matrice delle normali
 * La matrice delle normali è l'inversa trasposta della matrice di modello
 * Serve per trasformare correttamente le normali di superficie (specialmente con scaling non uniforme)
 * @param {mat4} world - La matrice di trasformazione da spazio modello a spazio mondo
 */
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

// ==================== CARICAMENTO TEXTURE ====================

/**
 * Carica un file immagine come texture WebGL
 * Gestisce il caricamento asincrono dell'immagine e la configurazione della texture sulla GPU
 * @param {WebGLRenderingContext} gl - Il contesto WebGL
 * @param {string} path - Percorso del file immagine (es. "")
 * @param {string} fileName - Nome del file immagine (es. "wood_floor.jpg")
 * @returns {WebGLTexture} La texture creata
 *
 * Caratteristiche:
 * - Crea una texture placeholder bianca durante il caricamento dell'immagine
 * - Applica il mipmapping per un rendering efficiente in lontananza
 * - Usa il wrapping REPEAT, supportato da WebGL2 anche per texture non potenza di 2
 */
function loadTexture(gl, path, fileName) {
  /* Crea una nuova texture e la collega (bind) */
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  /* Crea una texture placeholder bianca (1x1 pixel, RGBA) */
  const level = 0;
  const internalFormat = gl.RGBA;
  const pixel = new Uint8Array([255, 255, 255, 255]);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

  if(fileName){
    /* Carica l'immagine in modo asincrono */
    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      /* WebGL2 supporta il mipmapping e il wrapping REPEAT anche per texture non potenza di 2,
         quindi la ripetizione (es. UV > 1 su soffitto/pavimento) funziona sempre */
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      onResourceLoaded();  /* Segnala che il caricamento di una risorsa è terminato */
    };
    img.src = path + fileName;
  }
  return texture;
}

/**
 * Crea una texture a partire da testo disegnato su un canvas HTML5
 * Usata per le didascalie e le targhette mostrate nella galleria
 * @param {WebGLRenderingContext} gl - Il contesto WebGL
 * @param {string} text - Il testo da disegnare (supporta più righe con \n)
 * @returns {WebGLTexture} Texture contenente il testo disegnato
 *
 * Procedimento:
 * 1. Crea un canvas 512x128 (orientamento orizzontale, adatto al testo)
 * 2. Disegna uno sfondo bianco con bordo nero
 * 3. Disegna il testo in nero, centrato
 * 4. Carica il canvas come texture
 */
function createTextTexture(gl, text) {
  /* Crea un canvas su cui disegnare il testo */
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  /* Imposta le dimensioni del canvas: 512 pixel di larghezza, 128 di altezza (rapporto 4:1, adatto al testo) */
  canvas.width = 512;
  canvas.height = 128;

  /* Disegna lo sfondo bianco */
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  /* Disegna un bordo nero attorno all'area di testo */
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  /* Imposta le proprietà di rendering del testo */
  ctx.fillStyle = "black";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";  /* Centra il testo orizzontalmente */
  ctx.textBaseline = "middle"; /* Centra il testo verticalmente */

  /* Gestisce il testo multi-riga (suddiviso per ritorno a capo) */
  const lines = text.split("\n");
  const lineHeight = 34;
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

  /* Disegna ogni riga di testo */
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });

  /* Converte il canvas in una texture WebGL */
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

  /* Imposta i parametri della texture per un canvas non potenza di 2 */
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  return texture;
}
