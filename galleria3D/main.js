"use strict";

let gl, programInfo;
let textures = {};
let meshes = {};
let cameraAngleX = 0, cameraAngleY = 0, cameraDistance = 10;
let cameraX = 0, cameraZ = 0;
let lastMouseX, lastMouseY, dragging = false;

let settings = {
    lightX: 5,
    lightY: 5,
    lightZ: 5,
    shininess: 50,
    bumpMapping: false,
    resetCamera: function() {
        cameraAngleX = 0;
        cameraAngleY = 0;
        cameraDistance = 10;
        cameraX = 0;
        cameraZ = 0;
    }
};

function main() {
    const canvas = document.getElementById("glcanvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("WebGL non supportato");
        return;
    }

    const vertexShader = webglUtils.createShader(gl, gl.VERTEX_SHADER,
        document.getElementById("vs").text);
    const fragmentShader = webglUtils.createShaderFromScript(gl, gl.FRAGMENT_SHADER,
        document.getElementById("fs").text);

    const program = webglUtils.createProgram(gl, vertexShader, fragmentShader);
    programInfo = {
        program: program,
        attribLocations: {
            position: gl.getAttribLocation(program, "a_position"),
            normal: gl.getAttribLocation(program, "a_normal"),
            texcoord: gl.getAttribLocation(program, "a_texcoord"),
        },
        uniformLocations: {
            matrix: gl.getUniformLocation(program, "u_matrix"),
            world: gl.getUniformLocation(program, "u_world"),
            worldInverseTranspose: gl.getUniformLocation(program, "u_worldInverseTranspose"),
            texture: gl.getUniformLocation(program, "u_texture"),
            color: gl.getUniformLocation(program, "u_color"),
            shininess: gl.getUniformLocation(program, "u_shininess"),
            lightWorldPosition: gl.getUniformLocation(program, "u_lightWorldPosition"),
            viewWorldPosition: gl.getUniformLocation(program, "u_viewWorldPosition"),
            lightColor: gl.getUniformLocation(program, "u_lightColor"),
            specularColor: gl.getUniformLocation(program, "u_specularColor"),
        }
    };

    // Carica mesh
    createRoom();
    loadOBJ("models/scultura.obj", "scultura");

    // Carica texture
    textures.parete = loadTexture("textures/parete.jpg");
    textures.pavimento = loadTexture("textures/pavimento.jpg");
    textures.quadro1 = loadTexture("textures/quadro1.jpg");
    textures.quadro2 = loadTexture("textures/foto_autore.jpg");

    // GUI
    const gui = new dat.GUI();
    gui.add(settings, "lightX", -10, 10);
    gui.add(settings, "lightY", -10, 10);
    gui.add(settings, "lightZ", -10, 10);
    gui.add(settings, "shininess", 1, 200);
    gui.add(settings, "bumpMapping");
    gui.add(settings, "resetCamera");

    initControls(canvas);
    requestAnimationFrame(drawScene);
}

function createRoom() {
    meshes.pavimento = meshUtils.createPlane(gl, programInfo, 20, 20);
    meshes.parete1 = meshUtils.createPlane(gl, programInfo, 20, 10);
    meshes.parete2 = meshUtils.createPlane(gl, programInfo, 20, 10);
    meshes.parete3 = meshUtils.createPlane(gl, programInfo, 20, 10);
    meshes.parete4 = meshUtils.createPlane(gl, programInfo, 20, 10);
}

function loadOBJ(url, name) {
    glmReadOBJ(url, function(modelData) {
        meshes[name] = meshUtils.createMeshVAO(gl, programInfo, modelData);
    });
}

function loadTexture(url) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

    const img = new Image();
    img.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
            gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    img.src = url;

    return tex;
}

function initControls(canvas) {
    canvas.addEventListener("mousedown", e => {
        dragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    canvas.addEventListener("mouseup", () => dragging = false);
    canvas.addEventListener("mousemove", e => {
        if (dragging) {
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            cameraAngleY += dx * 0.01;
            cameraAngleX += dy * 0.01;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });
    canvas.addEventListener("wheel", e => {
        cameraDistance += e.deltaY * 0.01;
        if (cameraDistance < 2) cameraDistance = 2;
    });
    document.addEventListener("keydown", e => {
        const step = 0.2;
        if (e.key === "w") cameraZ -= step;
        if (e.key === "s") cameraZ += step;
        if (e.key === "a") cameraX -= step;
        if (e.key === "d") cameraX += step;
    });
}

function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    const fov = 60 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = m4.perspective(fov, aspect, 0.1, 100);

    let cameraMatrix = m4.yRotation(cameraAngleY);
    cameraMatrix = m4.xRotate(cameraMatrix, cameraAngleX);
    cameraMatrix = m4.translate(cameraMatrix, cameraX, 0, cameraDistance + cameraZ);
    const viewMatrix = m4.inverse(cameraMatrix);

    gl.useProgram(programInfo.program);
    gl.uniform3fv(programInfo.uniformLocations.lightWorldPosition, [settings.lightX, settings.lightY, settings.lightZ]);
    gl.uniform3fv(programInfo.uniformLocations.viewWorldPosition, [cameraX, 0, cameraDistance + cameraZ]);
    gl.uniform3fv(programInfo.uniformLocations.lightColor, [1, 1, 1]);
    gl.uniform3fv(programInfo.uniformLocations.specularColor, [1, 1, 1]);
    gl.uniform1f(programInfo.uniformLocations.shininess, settings.shininess);

    drawObject(meshes.pavimento, textures.pavimento, m4.translation(0, -5, 0), projectionMatrix, viewMatrix);
    drawObject(meshes.parete1, textures.parete, m4.multiply(m4.translation(0, 0, -10), m4.xRotation(-Math.PI / 2)), projectionMatrix, viewMatrix);
    drawObject(meshes.parete2, textures.parete, m4.multiply(m4.translation(-10, 0, 0), m4.yRotation(Math.PI / 2)), projectionMatrix, viewMatrix);
    drawObject(meshes.parete3, textures.parete, m4.multiply(m4.translation(0, 0, 10), m4.yRotation(Math.PI)), projectionMatrix, viewMatrix);
    drawObject(meshes.parete4, textures.parete, m4.multiply(m4.translation(10, 0, 0), m4.yRotation(-Math.PI / 2)), projectionMatrix, viewMatrix);

    if (meshes.scultura) {
        drawObject(meshes.scultura, textures.parete, m4.translation(0, -5, 0), projectionMatrix, viewMatrix);
    }

    requestAnimationFrame(drawScene);
}

function drawObject(mesh, texture, worldMatrix, projectionMatrix, viewMatrix) {
    if (!mesh) return;
    const worldInverseTransposeMatrix = m4.transpose(m4.inverse(worldMatrix));

    gl.uniformMatrix4fv(programInfo.uniformLocations.matrix, false,
        m4.multiply(projectionMatrix, m4.multiply(viewMatrix, worldMatrix)));
    gl.uniformMatrix4fv(programInfo.uniformLocations.world, false, worldMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.worldInverseTranspose, false, worldInverseTransposeMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.texture, 0);
    gl.uniform4fv(programInfo.uniformLocations.color, [1, 1, 1, 1]);

    meshUtils.renderMesh(gl, mesh);
}

main();
