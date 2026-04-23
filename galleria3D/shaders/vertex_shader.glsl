attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;
uniform mat4 u_world;
uniform mat4 u_worldInverseTranspose;

varying vec3 v_normal;
varying vec2 v_texcoord;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec3 u_lightWorldPosition;
uniform vec3 u_viewWorldPosition;

void main() {
    gl_Position = u_matrix * a_position;

    v_texcoord = a_texcoord;

    vec3 surfaceWorldPosition = (u_world * a_position).xyz;
    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
    v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;

    v_normal = mat3(u_worldInverseTranspose) * a_normal;
}
