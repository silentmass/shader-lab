// glsl/water/simulation/vertex_glsl3.glsl
precision highp float;
precision highp int;

// Input attributes
in vec3 position;

// Output to fragment shader
out vec2 vCoord;

void main() {
  vCoord = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xyz, 1.0);
}
