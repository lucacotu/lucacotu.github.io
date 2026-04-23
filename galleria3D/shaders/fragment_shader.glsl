precision mediump float;

varying vec3 v_normal;
varying vec2 v_texcoord;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform sampler2D u_texture;
uniform vec4 u_color;
uniform float u_shininess;
uniform vec3 u_lightColor;
uniform vec3 u_specularColor;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 surfaceToLightDir = normalize(v_surfaceToLight);
    vec3 surfaceToViewDir = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDir + surfaceToViewDir);

    float light = max(dot(normal, surfaceToLightDir), 0.0);
    float specular = 0.0;
    if (light > 0.0) {
        specular = pow(max(dot(normal, halfVector), 0.0), u_shininess);
    }

    vec4 texColor = texture2D(u_texture, v_texcoord) * u_color;
    gl_FragColor = vec4(
        texColor.rgb * light * u_lightColor +
        specular * u_specularColor,
        texColor.a
    );
}
