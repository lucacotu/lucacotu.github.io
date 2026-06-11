/* ====================================================================
   MODULO: SHADOW MAPPING
   ====================================================================
   Implementa le ombre omnidirezionali in stile "point light shadow"
   tramite cubemap di profondità.
   ==================================================================== */

// Configurazione Shadow Map

var SHADOW_SIZE = 1024;
var SHADOW_FAR  = 30.0; 

/* Abilita il rendering su texture float (necessario per R32F) */
gl.getExtension('EXT_color_buffer_float');
 
var shadowCubeTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowCubeTexture);
for (let i = 0; i < 6; i++) {
    gl.texImage2D(
        gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.R32F,
        SHADOW_SIZE, SHADOW_SIZE, 0,
        gl.RED, gl.FLOAT, null
    );
}
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

let shadowDepthRBO = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, shadowDepthRBO);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, SHADOW_SIZE, SHADOW_SIZE);

var shadowFBO = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFBO);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, shadowDepthRBO);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

var shadowCubeTexture1 = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowCubeTexture1);
for (let i = 0; i < 6; i++) {
    gl.texImage2D(
        gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.R32F,
        SHADOW_SIZE, SHADOW_SIZE, 0,
        gl.RED, gl.FLOAT, null
    );
}
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

let shadowDepthRBO1 = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, shadowDepthRBO1);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, SHADOW_SIZE, SHADOW_SIZE);

var shadowFBO1 = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFBO1);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, shadowDepthRBO1);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

// Renderizza le mappe di profondità per le cubemap delle ombre
const depthProgram = webglUtils.createProgramFromScripts(gl, ["vertex-shader-light", "fragment-shader-light"]);

const depth_uLightSpace = gl.getUniformLocation(depthProgram, "u_lightSpaceMatrix");
const depth_uModel      = gl.getUniformLocation(depthProgram, "u_model");
var depth_posLoc        = 0; 

var u_shadowCubeLocation  = gl.getUniformLocation(progObj, "u_shadowCube");
var u_shadowCube1Location = gl.getUniformLocation(progObj, "u_shadowCube1");
var u_farPlaneLocation    = gl.getUniformLocation(progObj, "u_farPlane");
var u_useShadowsLocation  = gl.getUniformLocation(progObj, "u_useShadows");

const depth_uLightPos = gl.getUniformLocation(depthProgram, "u_lightPos");
const depth_uFarPlane = gl.getUniformLocation(depthProgram, "u_farPlane");

function renderShadowMap(lightIndex, cubeTexture, fbo) {
    const lightPos = lights[lightIndex].position;
    const lightProj = m4.perspective(Math.PI / 2, 1.0, 0.1, SHADOW_FAR);

    const cubeDirections = [
        { dir: [ 1, 0, 0], up: [0,-1, 0] }, 
        { dir: [-1, 0, 0], up: [0,-1, 0] }, 
        { dir: [ 0, 1, 0], up: [0, 0, 1] }, 
        { dir: [ 0,-1, 0], up: [0, 0,-1] }, 
        { dir: [ 0, 0, 1], up: [0,-1, 0] }, 
        { dir: [ 0, 0,-1], up: [0,-1, 0] }, 
    ];

    gl.useProgram(depthProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, SHADOW_SIZE, SHADOW_SIZE);

    gl.uniform3fv(depth_uLightPos, lightPos);
    gl.uniform1f(depth_uFarPlane, SHADOW_FAR);

    gl.clearColor(1.0, 0.0, 0.0, 1.0);

    for (let face = 0; face < 6; face++) {
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
            cubeTexture, 0
        );
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const d = cubeDirections[face];
        const target = [lightPos[0]+d.dir[0], lightPos[1]+d.dir[1], lightPos[2]+d.dir[2]];
        const lightView = m4.inverse(m4.lookAt(lightPos, target, d.up));
        const lightSpaceMatrix = m4.multiply(lightProj, lightView);
        gl.uniformMatrix4fv(depth_uLightSpace, false, lightSpaceMatrix);

        /* Pavimento */
        gl.bindBuffer(gl.ARRAY_BUFFER, floorBuf);
        gl.vertexAttribPointer(depth_posLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(depth_posLoc);
        gl.uniformMatrix4fv(depth_uModel, false, m4.identity());
        gl.drawArrays(gl.TRIANGLES, 0, floor.length / 3);

        /* Panchine */
        benchPosition.forEach(el => {
            for (let i = 0; i < meshBench.part.length; i++) {
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBufBench[i]);
                gl.vertexAttribPointer(depth_posLoc, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(depth_posLoc);
                gl.uniformMatrix4fv(depth_uModel, false,
                    m4.multiply(m4.translation(el[0], el[1], el[2]), m4.scaling(1.2, 1.2, 1.2)));
                gl.drawArrays(gl.TRIANGLES, 0, numVerticesBench[i]);
            }
        });

        /* Statua */
        for (let i = 0; i < meshStatue.part.length; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBufStatue[i]);
            gl.vertexAttribPointer(depth_posLoc, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(depth_posLoc);
            gl.uniformMatrix4fv(depth_uModel, false,
                m4.multiply(m4.translation(0, 1.2, 5.4), m4.scaling(1.2, 1.2, 1.2)));
            gl.drawArrays(gl.TRIANGLES, 0, numVerticesStatue[i]);
        }

        /* Quadri */
        frames.forEach(el => {
            for (let i = 0; i < meshFrame.part.length; i++) {
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBufFrame[i]);
                gl.vertexAttribPointer(depth_posLoc, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(depth_posLoc);
                let worldFrame = m4.identity();
                worldFrame = m4.multiply(worldFrame, m4.xRotation(el.rotation[0]));
                worldFrame = m4.multiply(worldFrame, m4.yRotation(el.rotation[1]));
                worldFrame = m4.multiply(worldFrame, m4.zRotation(el.rotation[2]));
                worldFrame = m4.multiply(worldFrame, m4.translation(el.translation[0], el.translation[1], el.translation[2]));
                gl.uniformMatrix4fv(depth_uModel, false, worldFrame);
                gl.drawArrays(gl.TRIANGLES, 0, numVerticesFrame[i]);
            }
        });
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function recreateShadowResources(newSize) {
    SHADOW_SIZE = newSize;

    gl.deleteTexture(shadowCubeTexture);
    shadowCubeTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowCubeTexture);
    for (let i = 0; i < 6; i++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.R32F,
            newSize, newSize, 0, gl.RED, gl.FLOAT, null);
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

    gl.bindRenderbuffer(gl.RENDERBUFFER, shadowDepthRBO);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, newSize, newSize);

    gl.deleteTexture(shadowCubeTexture1);
    shadowCubeTexture1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowCubeTexture1);
    for (let i = 0; i < 6; i++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.R32F,
            newSize, newSize, 0, gl.RED, gl.FLOAT, null);
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

    gl.bindRenderbuffer(gl.RENDERBUFFER, shadowDepthRBO1);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, newSize, newSize);
}
