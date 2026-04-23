//Funzione che carica una texture
   function loadTexture(gl, path, fileName) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      const level = 0;
      const internalFormat = gl.RGBA;
      const width = 1;
      const height = 1;
      const border = 0;
      const srcFormat = gl.RGBA;
      const srcType = gl.UNSIGNED_BYTE;
      const pixel = new Uint8Array([255, 255, 255, 255]);  // opaque blue
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
               width, height, border, srcFormat, srcType, pixel);
      
      if(fileName){
         const image = new Image();
         image.onload = function() {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,srcFormat, srcType, image);
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) 
                gl.generateMipmap(gl.TEXTURE_2D); // Yes, it's a power of 2. Generate mips.
            else {
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
         };
         image.src = path + fileName;
      }
      return texture;
      
      function isPowerOf2(value) {
         return (value & (value - 1)) == 0;
      }
   }
   
//Funzione che utilizza la libreria glm_utils per leggere un eventuale 
//file MTL associato alla mesh
	function readMTLFile(MTLfileName, mesh){
		return $.ajax({
			type: "GET",
			url: MTLfileName,
			dataType: "text",
			async: false,
			success: parseMTLFile,
			error: handleError,
		});
		function parseMTLFile(result, status, xhr){
			glmReadMTL(result, mesh);
		}
		function handleError(jqXhr, textStatus, errorMessage){
			console.error('Error : ' + errorMessage);
		}
	}

//Funzione che serve per recuperare i dati della mesh da un file OBJ
	function retrieveDataFromSource(mesh){
      loadMeshFromOBJ(mesh);
      if(mesh.fileMTL) {
         readMTLFile(mesh.sourceMesh.substring(0, mesh.sourceMesh.lastIndexOf("/")+1) + mesh.fileMTL, mesh.data); 
         mesh.materials = mesh.data.materials;
         delete mesh.data.materials;
      }
   }

//Funzione che utilizza la libreria glm_utils per leggere un file OBJ 
//contenente la definizione della mesh
   function loadMeshFromOBJ(mesh) {
      return $.ajax({
         type: "GET",
         url: mesh.sourceMesh,
         dataType: "text",
         async: false,
         success: parseobjFile,
         error: handleError,
      });
      function parseobjFile(result, status, xhr){                  
         var result = glmReadOBJ(result,new subd_mesh());
//scommentare/commentare per utilizzare o meno la LoadSubdivMesh
//         mesh.data = LoadSubdivMesh(result.mesh);
         mesh.data = result.mesh;
         mesh.fileMTL = result.fileMtl;
      }	
      function handleError(jqXhr, textStatus, errorMessage){
         console.error('Error : ' + errorMessage);
      }
   } 

/*========== Loading and storing the geometry ==========*/
   function LoadMesh(gl,mesh,onLoad) {

      console.log("Loading mesh from " + mesh.index);

      retrieveDataFromSource(mesh);
      Unitize(mesh.data);
  //Ora che ho la mesh e il/i materiali associati, mi occupo di caricare 
  //la/le texture che tali materiali contengono
      var map = mesh.materials[1].parameter;
      var path = mesh.sourceMesh.substring(0, mesh.sourceMesh.lastIndexOf("/")+1);
      mesh.materials.forEach(mat => {
      if (mat.parameter.has("map_Kd")) {
         mat.parameter.set("map_Kd", mat.parameter.get("map_Kd"));
         }
      });
      //map.set("map_Kd", loadTexture(gl, path, map.get("map_Kd")));

      let facesByMat = {};
      for (var i=1; i<=mesh.data.nface; i++) {
         let matName = mesh.data.face[i].material;
         if (!facesByMat[matName]) facesByMat[matName] = [];
         facesByMat[matName].push(i);
      }

      // Creo un "part" per ogni materiale
   for (let matName in facesByMat) {
      let part = {
         name: matName,
         positions: [],
         normals: [],
         texcoords: [],
         material: mesh.materials[matName]
      };
      // Copio i dati dei vertici, normali e UV come prima...
      let x=[], y=[], z=[], xt=[], yt=[];
      for (var v=0; v<mesh.data.nvert; v++){
         x[v]=mesh.data.vert[v+1].x;
         y[v]=mesh.data.vert[v+1].y;
         z[v]=mesh.data.vert[v+1].z;       
      }
      for (var t=0; t<mesh.data.textCoords.length-1; t++){
         xt[t]=mesh.data.textCoords[t+1].u;
         yt[t]=mesh.data.textCoords[t+1].v;      
      }

      for (let fi of facesByMat[matName]) {
         let f = mesh.data.face[fi];
         let fn = mesh.data.facetnorms[fi];

         let i0=f.vert[0]-1, i1=f.vert[1]-1, i2=f.vert[2]-1;
         part.positions.push(x[i0],y[i0],z[i0], x[i1],y[i1],z[i1], x[i2],y[i2],z[i2]); 

         part.normals.push(fn.i,fn.j,fn.k, fn.i,fn.j,fn.k, fn.i,fn.j,fn.k);

         let t0=f.textCoordsIndex[0]-1, t1=f.textCoordsIndex[1]-1, t2=f.textCoordsIndex[2]-1;
         if (t0>=0 && t1>=0 && t2>=0) {
            part.texcoords.push(xt[t0],yt[t0], xt[t1],yt[t1], xt[t2],yt[t2]);
         }
      }

      part.numVertices = part.positions.length / 3;

      // Parametri materiali
      let params = part.material.parameter;
      part.ambient   = params.get("Ka") || [0,0,0];
      part.diffuse   = params.get("Kd") || [1,1,1];
      part.specular  = params.get("Ks") || [0,0,0];
      part.emissive  = params.get("Ke") || [0,0,0];
      part.shininess = params.get("Ns") || 1;
      part.opacity   = params.get("Ni") || 1;

      // Salvo questo materiale nella lista
      mesh.part.push(part);
   }

   if(onLoad) onLoad();

}
