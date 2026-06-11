/* ====================================================================
   MODULO: MAIN
   ====================================================================
   Modulo che costruisce il menu impostazioni dat.GUI e definisce draw(), 
   il loop di animazione principale. Il loop viene avviato la prima 
   volta da onResourceLoaded() quando tutte le risorse sono state caricate, 
   poi si auto-richiama con requestAnimationFrame.
   ==================================================================== */

// ==================== MENU IMPOSTAZIONI (dat.GUI) ====================

const qualitySizes  = { 'Bassa': 1024, 'Normale': 2048, 'Alta': 4096 };
const lightColorMap = { 'Neutra': [1,1,1], 'Calda': [1,0.85,0.6], 'Fredda': [0.8,0.9,1], 'Serale': [0.9,0.85,1] };

const guiParams = {
    shadows: true,
    shadowQuality: 'Normale',
    lightColor: 'Neutra',
    salva: function() {
        shadowsEnabled = guiParams.shadows;
        const newSize = qualitySizes[guiParams.shadowQuality];
        if (newSize !== SHADOW_SIZE) recreateShadowResources(newSize);
        const newColor = lightColorMap[guiParams.lightColor];
        lights.forEach(l => l.color = newColor);
        menuOpen = false;
        if ('ontouchstart' in window) gui.domElement.style.display = 'none';
        else gui.close();
    }
};

gui = new dat.GUI({ name: 'Impostazioni' });
const shadowsCtrl  = gui.add(guiParams, 'shadows').name('Mostra ombre');
const qualityCtrl  = gui.add(guiParams, 'shadowQuality', Object.keys(qualitySizes)).name('Qualità ombre');
gui.add(guiParams, 'lightColor', Object.keys(lightColorMap)).name('Luce');
gui.add(guiParams, 'salva').name('Salva impostazioni');

shadowsCtrl.onChange(val => {
    qualityCtrl.__li.style.display = val ? '' : 'none';
});

if ('ontouchstart' in window) {
  gui.domElement.style.display = 'none';
  gui.domElement.style.transform = 'scale(2)';
  gui.domElement.style.transformOrigin = 'top right';
} else {
  gui.close();
}

/**
 * FRAME PRINCIPALE DI ANIMAZIONE
 * Questa funzione viene chiamata 60 volte al secondo
 * Aggiorna la telecamera e renderizza la scena ad ogni frame
 */
function draw() {
  /* Pulisce il canvas: imposta il colore di sfondo su nero */
  gl.clearColor(0,0,0,1);
  /* Pulisce sia il color buffer che il depth buffer per un frame pulito */
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  applyJoystickMovement();

  if (shadowsEnabled) {
    renderShadowMap(0, shadowCubeTexture,  shadowFBO);   /* luce 0 */
    renderShadowMap(1, shadowCubeTexture1, shadowFBO1);  /* luce 1 */
  }

  /* Usa il programma principale di rendering degli oggetti */
  gl.useProgram(progObj);

  /* Calcola la direzione di vista della telecamera */
  const center = [
    camPos[0] + Math.sin(yaw),
    camPos[1],                     
    camPos[2] - Math.cos(yaw)
  ];

  /**
   * Matrice della telecamera: descrive dove si trova la telecamera e verso dove è rivolta
   * Matrice vista: inversa della matrice della telecamera
   */
  var cameraMatrix = m4.lookAt(camPos, center, [0, 1, 0]);  /* Mondo con asse Y verso l'alto */
  var viewMatrix = m4.inverse(cameraMatrix);

  /* Invio delle uniform allo shader */
  gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);           /* Matrice vista */
  gl.uniformMatrix4fv(projectionMatrixLocation, false, proj);           /* Matrice di proiezione */
  gl.uniform3fv(u_viewPosLocation, camPos);                             /* Posizione telecamera per lo specular */

  /* Invia allo shader posizione, colore e intensità di ogni sorgente luminosa */
  lights.forEach((l,i)=>{
          gl.uniform3fv(u_lights_position[i], l.position);     /* Posizione della luce */
          gl.uniform3fv(u_lights_color[i], l.color);           /* Colore della luce */
          gl.uniform1f(u_lights_intensity[i], l.intensity);    /* Intensità della luce */
  });

  /* Lega le cubemap alle unità di texture 1 e 2 */
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowCubeTexture);
  gl.uniform1i(u_shadowCubeLocation, 1);

  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowCubeTexture1);
  gl.uniform1i(u_shadowCube1Location, 2);

  gl.uniform1f(u_farPlaneLocation, SHADOW_FAR);
  gl.uniform1i(u_useShadowsLocation, shadowsEnabled ? 1 : 0);

  /* ===== RENDERIZZAZIONE DELLA SCENA ===== */
  /**
   * Chiama drawScene per renderizzare tutti gli oggetti con la telecamera e l'illuminazione attuali
   * isDepthPass=false: rendering normale (non per le shadow map)
   */
  drawScene(progObj, false);


   /* Crea il ciclo di animazione */
  requestAnimationFrame(draw);
}

console.log("Inizializzazione completata, inizio il loop di rendering");
