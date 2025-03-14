// glsl/water/debug/vertex_glsl3.glsl
precision highp float;
precision highp int;

uniform sampler2D mainTexture;

// Input attributes
in vec3 position;

// Output to fragment shader
out vec2 vCoord;

void main() {
  vCoord = position.xy + 0.5;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}