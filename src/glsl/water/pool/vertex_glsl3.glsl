// glsl/water/pool/vertex_glsl3.glsl
precision highp float;
precision highp int;

// Constants
const float poolHeight = 1.0;

// Uniforms
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

// Input attributes
in vec3 position;

// Output to fragment shader
out vec3 vPos;

void main() {
  vPos = position.xyz;
  vPos.y = ((1.0 - vPos.y) * (7.0 / 12.0) - 1.0) * poolHeight;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);
}