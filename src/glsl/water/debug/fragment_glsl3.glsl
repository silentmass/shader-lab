// glsl/water/debug/fragment_glsl3.glsl
precision highp float;
precision highp int;

uniform sampler2D mainTexture;

// Input from vertex shader
in vec2 vCoord;

// Output
out vec4 fragColor;

void main() {
  vec4 color = texture(mainTexture, vCoord);
  fragColor = vec4(color.x, color.y, color.z, 1.0);
}