/* ====================================================================
   MODULO: RENDER
   ====================================================================
   Contiene drawScene(), la funzione che disegna l'intera scena 3D.
   ==================================================================== */

/**
 * FUNZIONE PRINCIPALE DI RENDERING: drawScene
 * Renderizza l'intera scena: stanza, oggetti, illuminazione
 * Questa funzione viene chiamata ad ogni frame per disegnare tutto ciò che è visibile
 */
function drawScene(program) {
    gl.useProgram(program);

    /* Rendering pavimento */
    gl.bindBuffer(gl.ARRAY_BUFFER, floorBuf);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

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
    gl.uniform1i(u_ignoreLight, 0);          /* Applica l'illuminazione */
    gl.uniform1i(u_useTexture, 1);           /* Usa la texture */
    gl.uniform3fv(u_objectColor, [1, 1, 1]); /* Moltiplicatore di colore bianco */

    /* Matrice identità: il pavimento non viene trasformato */
    let world = m4.identity();
    gl.uniformMatrix4fv(frameLocation, false, world);
    setNormalMatrix(world);

    /* Disegna il pavimento: 6 vertici (2 triangoli) */
    gl.drawArrays(gl.TRIANGLES, 0, floor.length / 3);



    /* Rendering soffitto*/
    gl.bindBuffer(gl.ARRAY_BUFFER, ceilBuf);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

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

    gl.drawArrays(gl.TRIANGLES, 0, ceil.length / 3);



    /* Rendering pareti */
    gl.bindBuffer(gl.ARRAY_BUFFER, wallsBuf);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

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

    gl.drawArrays(gl.TRIANGLES, 0, wallCount);



    /* Rendering quadri */
    frames.forEach(el => {
        for (let i = 0; i < meshFrame.part.length; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBufFrame[i]);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(positionLocation);

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
            gl.uniform1i(u_useTexture, i);   /* 0 = colore solido, 1 = texture */
            gl.uniform3fv(u_objectColor, [0.55, 0.40, 0.05]);

            /* Trasformazione: rotazione -> traslazione */
            let worldFrame = m4.identity();
            worldFrame = m4.multiply(worldFrame, m4.xRotation(el.rotation[0]));
            worldFrame = m4.multiply(worldFrame, m4.yRotation(el.rotation[1]));
            worldFrame = m4.multiply(worldFrame, m4.zRotation(el.rotation[2]));
            worldFrame = m4.multiply(worldFrame, m4.translation(el.translation[0], el.translation[1], el.translation[2]));

            gl.uniformMatrix4fv(frameLocation, false, worldFrame);
            setNormalMatrix(worldFrame);

            gl.drawArrays(gl.TRIANGLES, 0, numVerticesFrame[i]);
        }
    });



    /* Rendering statua */
    for (let i = 0; i < meshStatue.part.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBufStatue[i]);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);

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
        gl.uniform1i(u_useTexture, 1);
        gl.uniform3fv(u_objectColor, [0, 0, 0]);

        /* Trasformazione: traslazione -> scala */
        let worldStatue = m4.identity();
        worldStatue = m4.multiply(worldStatue, m4.translation(0, 1.2, 5.4));
        worldStatue = m4.multiply(worldStatue, m4.scaling(1.2, 1.2, 1.2));
        gl.uniformMatrix4fv(frameLocation, false, worldStatue);
        setNormalMatrix(worldStatue);

        gl.drawArrays(gl.TRIANGLES, 0, numVerticesStatue[i]);
    }



    /* Rendering panchine */
    benchPosition.forEach(el => {
        for (let i = 0; i < meshBench.part.length; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBufBench[i]);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(positionLocation);

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

            /* Trasformazione: traslazione -> scala */
            let worldBench = m4.identity();
            worldBench = m4.multiply(worldBench, m4.translation(el[0], el[1], el[2]));
            worldBench = m4.multiply(worldBench, m4.scaling(1.2, 1.2, 1.2));
            gl.uniformMatrix4fv(frameLocation, false, worldBench);
            setNormalMatrix(worldBench);

            gl.drawArrays(gl.TRIANGLES, 0, numVerticesBench[i]);
        }
    });



    /* Rendering lampade */
    const lightFixtureScale = 0.25;
    const lightFixtureYOffset = 0.45;
    lights.forEach(l => {
        for (let i = 0; i < meshLight.part.length; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBufLight[i]);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(positionLocation);

            gl.bindBuffer(gl.ARRAY_BUFFER, normalBufLight[i]);
            gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(normalLocation);

            gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBufLight[i]);
            gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(texcoordLocation);

            /* Texture non usata */
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureFloor);
            gl.uniform1i(textureLocation, 0);

            gl.uniform1i(u_ignoreLight, 1); // Ignora la luce
            gl.uniform1i(u_useTexture, 0);
            gl.uniform3fv(u_objectColor, meshLight.part[i].diffuse);

            /* Trasformazione: traslazione -> scala */
            let worldLight = m4.identity();
            worldLight = m4.multiply(worldLight, m4.translation(l.position[0], l.position[1] + lightFixtureYOffset, l.position[2]));
            worldLight = m4.multiply(worldLight, m4.scaling(lightFixtureScale, lightFixtureScale, lightFixtureScale));
            gl.uniformMatrix4fv(frameLocation, false, worldLight);
            setNormalMatrix(worldLight);

            gl.drawArrays(gl.TRIANGLES, 0, numVerticesLight[i]);
        }
    });



    /* Rendering targhe */
    caption.forEach(cap => {

        /* Recupera il plane e la texture del testo pre-creati per questa didascalia */
        const { plane, texture } = captionPlanes[cap.index];

        gl.bindBuffer(gl.ARRAY_BUFFER, plane.position);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, plane.normal);
        gl.enableVertexAttribArray(normalLocation);
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, plane.texcoord);
        gl.enableVertexAttribArray(texcoordLocation);
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureLocation, 0);

        gl.uniform1i(u_useTexture, 1);
        gl.uniform1i(u_ignoreLight, 0);
        gl.uniform3fv(u_objectColor, [1,1,1]);


        /* Trasformazione: traslazione -> rotazione -> scala */
        let matrix = m4.identity();
        matrix = m4.multiply(matrix, m4.translation(cap.translation[0], cap.translation[1], cap.translation[2]));
        matrix = m4.multiply(matrix, m4.xRotation(cap.rotation[0]))
        matrix = m4.multiply(matrix, m4.yRotation(cap.rotation[1]));
        matrix = m4.multiply(matrix, m4.zRotation(cap.rotation[2]));
        matrix = m4.multiply(matrix, m4.scaling(0.7,0.35,0.35));

        gl.uniformMatrix4fv(frameLocation, false, matrix);
        setNormalMatrix(matrix);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, plane.numVertices);
    })
}
