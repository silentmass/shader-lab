#version 300 es
precision highp float;
precision highp int;

in vec3 position;

out vec2 vCoord;

void main() {
  vCoord = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xyz, 1.0);
}
