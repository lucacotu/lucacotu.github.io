/* ====================================================================
   MODULO: RENDER
   ====================================================================
   Contiene drawScene(), la funzione che disegna l'intera scena 3D:
   pavimento, soffitto, pareti, cornici dei quadri, statua, panchine,
   lampade e targhette/didascalie. La funzione accetta il programma
   shader da usare e un flag isDepthPass che, quando true, disabilita
   l'invio di normali/texture/colore (usato per un'eventuale passata di
   sola profondità con un programma alternativo).

   Dipendenze: richiede js/scene-geometry.js (gl, geometria e texture
   della stanza), js/scene-objects.js (frames, caption, captionPlanes,
   benchPosition, lights), js/shaders-setup.js (location di attributi e
   uniform, mesh di cornici/statua/panchine/luce con i relativi
   buffer), js/shadow-mapping.js (depth_posLoc) e js/utils.js
   (setNormalMatrix).

   Espone: la funzione drawScene(program, isDepthPass), chiamata dal
   loop di animazione in js/main.js.
   ==================================================================== */

/**
 * FUNZIONE PRINCIPALE DI RENDERING: drawScene
 * Renderizza l'intera scena: stanza, oggetti, illuminazione
 * Questa funzione viene chiamata ad ogni frame per disegnare tutto ciò che è visibile
 *
 * @param {WebGLProgram} program - Il programma shader da usare per il rendering
 * @param {boolean} isDepthPass - true se si sta renderizzando per la shadow map, false per il rendering normale
 *
 * Sequenza di rendering:
 * 1. Pavimento (texture in legno)
 * 2. Soffitto (texture in legno)
 * 3. Pareti (texture bianca)
 * 4. Cornici dei quadri (5 opere diverse)
 * 5. Statua (scultura di Diana)
 * 6. Panchine (sedute della galleria)
 * 7. Didascalie/targhette (testo sovrapposto)
 */
function drawScene(program, isDepthPass = false) {
    gl.useProgram(program);

    /* Seleziona la location dell'attributo posizione in base al tipo di pass */
    const posLoc = isDepthPass ? depth_posLoc : positionLocation;

    // ======================
    // RENDERING PAVIMENTO
    // ======================
    /**
     * Il pavimento è un semplice piano rettangolare a Y=0
     * Texturizzato con un motivo di venature del legno, ripetuto 4x4
     */
    gl.bindBuffer(gl.ARRAY_BUFFER, floorBuf);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    if (!isDepthPass) {
        /* Imposta normali e texture per illuminazione e texturing */
        gl.bindBuffer(gl.ARRAY_BUFFER, floorNormBuf);
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, floorTexBuf);
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texcoordLocation);

        /* Lega la texture del pavimento */
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureFloor);
        gl.uniform1i(textureLocation, 0);

        /* Il pavimento è illuminato e texturizzato */
        gl.uniform1i(u_ignoreLight, 0);      /* Applica l'illuminazione */
        gl.uniform1i(u_useTexture, 1);       /* Usa la texture */
        gl.uniform3fv(u_objectColor, [1, 1, 1]); /* Moltiplicatore di colore bianco */
    }

    /* Matrice identità: il pavimento non viene trasformato */
    let world = m4.identity();
    gl.uniformMatrix4fv(frameLocation, false, world);
    if (!isDepthPass) {
      setNormalMatrix(world);
    }

    /* Disegna il pavimento: 6 vertici (2 triangoli) */
    gl.drawArrays(gl.TRIANGLES, 0, floor.length / 3);

    // ======================
    // RENDERING SOFFITTO
    // ======================
    /**
     * Il soffitto è un piano rettangolare a Y=height
     * Texturizzato come il pavimento ma con ripetizione 2x2
     */
    gl.bindBuffer(gl.ARRAY_BUFFER, ceilBuf);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    if (!isDepthPass) {
        gl.bindBuffer(gl.ARRAY_BUFFER, ceilNormBuf);
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, ceilTexBuf);
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texcoordLocation);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureCeil);
        gl.uniform1i(textureLocation, 0);

        gl.uniform1i(u_ignoreLight, 0);
        gl.uniform1i(u_useTexture, 1);
        gl.uniform3fv(u_objectColor, [1, 1, 1]);
    }

    gl.drawArrays(gl.TRIANGLES, 0, ceil.length / 3);

    // ======================
    // RENDERING PARETI
    // ======================
    /**
     * Le quattro pareti della stanza (Nord, Sud, Est, Ovest)
     * Tutte le pareti usano la stessa texture bianca
     */
    gl.bindBuffer(gl.ARRAY_BUFFER, wallsBuf);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    if (!isDepthPass) {
        gl.bindBuffer(gl.ARRAY_BUFFER, wallNormBuf);
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, texturePosition);
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texcoordLocation);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureWall);
        gl.uniform1i(textureLocation, 0);

        gl.uniform1i(u_ignoreLight, 0);
        gl.uniform1i(u_useTexture, 1);
        gl.uniform3fv(u_objectColor, [1, 1, 1]);
    }

    gl.drawArrays(gl.TRIANGLES, 0, wallCount);

    // ======================
    // RENDERING CORNICI DEI QUADRI
    // ======================
    /**
     * Ogni cornice è un modello 3D composto da più parti
     * Posizionate sulle pareti, ognuna ha una texture di un'opera diversa
     * Più cornici permettono una disposizione tipo galleria
     */
    frames.forEach(el => {
        for (let i = 0; i < meshFrame.part.length; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBufFrame[i]);
            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(posLoc);

            if (!isDepthPass) {
                gl.bindBuffer(gl.ARRAY_BUFFER, normalBufFrame[i]);
                gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(normalLocation);

                gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBufFrame[i]);
                gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(texcoordLocation);

                /* Parte 0 = cornice (colore oro), parte 1 = tela (texture del quadro) */
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, textureFrame[el.textureIndex]);
                gl.uniform1i(textureLocation, 0);

                gl.uniform1i(u_ignoreLight, 0);
                gl.uniform1i(u_useTexture, i);  /* 0 = colore solido, 1 = texture */
                gl.uniform3fv(u_objectColor, [0.55, 0.40, 0.05]);
            }

            /* Costruisce la trasformazione: rotazione -> traslazione */
            let worldFrame = m4.identity();
            worldFrame = m4.multiply(worldFrame, m4.xRotation(el.rotation[0]));
            worldFrame = m4.multiply(worldFrame, m4.yRotation(el.rotation[1]));
            worldFrame = m4.multiply(worldFrame, m4.zRotation(el.rotation[2]));
            worldFrame = m4.multiply(worldFrame, m4.translation(el.translation[0], el.translation[1], el.translation[2]));

            gl.uniformMatrix4fv(frameLocation, false, worldFrame);
            if (!isDepthPass) {
              setNormalMatrix(worldFrame);
            }

            gl.drawArrays(gl.TRIANGLES, 0, numVerticesFrame[i]);
        }
    });

    // ======================
    // RENDERING STATUA
    // ======================
    /**
     * La scultura di Diana: un modello 3D ad alto numero di poligoni
     * Centrata nella galleria, scalata per darle rilievo
     * Illuminata con riflessi speculari per l'effetto marmo
     */
    for (let i = 0; i < meshStatue.part.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBufStatue[i]);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(posLoc);

        if (!isDepthPass) {
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBufStatue[i]);
            gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(normalLocation);

            gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBufStatue[i]);
            gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(texcoordLocation);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureStatue);
            gl.uniform1i(textureLocation, 0);

            gl.uniform1i(u_ignoreLight, 0);
            gl.uniform1i(u_useTexture, 1);  /* Texturizzata con la texture del marmo */
            gl.uniform3fv(u_objectColor, [0, 0, 0]);
        }

        /* Trasformazione: trasla nella posizione e scala */
        let worldStatue = m4.identity();
        worldStatue = m4.multiply(worldStatue, m4.translation(0, 1.2, 5.4));
        worldStatue = m4.multiply(worldStatue, m4.scaling(1.2, 1.2, 1.2));
        gl.uniformMatrix4fv(frameLocation, false, worldStatue);
        if (!isDepthPass) {
          setNormalMatrix(worldStatue);
        }

        gl.drawArrays(gl.TRIANGLES, 0, numVerticesStatue[i]);
    }

    // ======================
    // RENDERING PANCHINE
    // ======================
    /**
     * Panchine: modelli 3D delle sedute della galleria
     * Il giocatore può sedersi sulle panchine con il tasto E
     * Texturizzate con materiale legno/metallo
     */
    benchPosition.forEach(el => {
        for (let i = 0; i < meshBench.part.length; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBufBench[i]);
            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(posLoc);

            if (!isDepthPass) {
                gl.bindBuffer(gl.ARRAY_BUFFER, normalBufBench[i]);
                gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(normalLocation);

                gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBufBench[i]);
                gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(texcoordLocation);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, textureBench);
                gl.uniform1i(textureLocation, 0);

                gl.uniform1i(u_ignoreLight, 0);
                gl.uniform1i(u_useTexture, 1);
                gl.uniform3fv(u_objectColor, [0, 0, 0]);
            }

            /* Trasformazione: trasla nella posizione e scala */
            let worldBench = m4.identity();
            worldBench = m4.multiply(worldBench, m4.translation(el[0], el[1], el[2]));
            worldBench = m4.multiply(worldBench, m4.scaling(1.2, 1.2, 1.2));
            gl.uniformMatrix4fv(frameLocation, false, worldBench);
            if (!isDepthPass) {
              setNormalMatrix(worldBench);
            }

            gl.drawArrays(gl.TRIANGLES, 0, numVerticesBench[i]);
        }
    });

    // ======================
    // RENDERING LAMPADE
    // ======================
    /**
     * Lampade posizionate nei punti delle due sorgenti di luce della scena.
     * Renderizzate come oggetti "accesi": non risentono dell'illuminazione
     * della scena (u_ignoreLight=1) e non proiettano ombre (skip durante
     * isDepthPass).
     */
    if (!isDepthPass) {
        const lightFixtureScale = 0.25;
        const lightFixtureYOffset = 0.45;
        lights.forEach(l => {
            for (let i = 0; i < meshLight.part.length; i++) {
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBufLight[i]);
                gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(posLoc);

                gl.bindBuffer(gl.ARRAY_BUFFER, normalBufLight[i]);
                gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(normalLocation);

                gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBufLight[i]);
                gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(texcoordLocation);

                /* Texture non usata (u_useTexture=0): bind comunque richiesto dallo shader */
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, textureFloor);
                gl.uniform1i(textureLocation, 0);

                gl.uniform1i(u_ignoreLight, 1);
                gl.uniform1i(u_useTexture, 0);
                gl.uniform3fv(u_objectColor, meshLight.part[i].diffuse);

                let worldLight = m4.identity();
                worldLight = m4.multiply(worldLight, m4.translation(l.position[0], l.position[1] + lightFixtureYOffset, l.position[2]));
                worldLight = m4.multiply(worldLight, m4.scaling(lightFixtureScale, lightFixtureScale, lightFixtureScale));
                gl.uniformMatrix4fv(frameLocation, false, worldLight);
                setNormalMatrix(worldLight);

                gl.drawArrays(gl.TRIANGLES, 0, numVerticesLight[i]);
            }
        });
    }

    // ======================
    // RENDERING DIDASCALIE/TARGHETTE
    // ======================
    /**
     * Targhette di testo 2D mostrate sotto le opere
     * Mostrano i titoli delle opere e i nomi degli artisti
     * Renderizzate come quad texturizzati con testo pre-renderizzato
     */
     if (!isDepthPass) {
      caption.forEach(cap => {
          /* Crea il plane e la texture del testo per questa didascalia */

          const { plane, texture } = captionPlanes[cap.index];

          /* Imposta gli attributi vertice per il quad del testo */
          gl.bindBuffer(gl.ARRAY_BUFFER, plane.position);
          gl.enableVertexAttribArray(posLoc);
          gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, plane.normal);
          gl.enableVertexAttribArray(normalLocation);
          gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

          /* Coordinate texture per il quad del testo */
          gl.bindBuffer(gl.ARRAY_BUFFER, plane.texcoord);
          gl.enableVertexAttribArray(texcoordLocation);
          gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

          /* Lega la texture del testo */
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.uniform1i(textureLocation, 0);

          gl.uniform1i(u_useTexture, 1);
          gl.uniform1i(u_ignoreLight, 0);  /* Applica un po' di illuminazione alle didascalie */
          gl.uniform3fv(u_objectColor, [1,1,1]);

          /* Costruisce la matrice di trasformazione per la targhetta di testo */
          let matrix = m4.identity();
          matrix = m4.multiply(matrix, m4.translation(cap.translation[0], cap.translation[1], cap.translation[2]));
          matrix = m4.multiply(matrix, m4.xRotation(cap.rotation[0]))
          matrix = m4.multiply(matrix, m4.yRotation(cap.rotation[1]));
          matrix = m4.multiply(matrix, m4.zRotation(cap.rotation[2]));
          matrix = m4.multiply(matrix, m4.scaling(0.7,0.35,0.35));  /* Appiattisce: 0.35 = sottile come carta */

          gl.uniformMatrix4fv(frameLocation, false, matrix);
          setNormalMatrix(matrix);

          /* Disegna la targhetta di testo (triangle strip per efficienza) */
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, plane.numVertices);
      })
    }
}
