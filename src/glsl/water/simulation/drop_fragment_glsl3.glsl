// glsl/water/simulation/drop_fragment_glsl3.glsl
precision highp float;
precision highp int;

const float PI = 3.141592653589793;

uniform vec2 center;
uniform float radius;
uniform float strength;
uniform sampler2D mainTexture;

// Input from vertex shader
in vec2 vCoord;

// Output
out vec4 fragColor;

void main() {
  /* Get vertex info */
  vec4 info = texture(mainTexture, vCoord);

  /* Add the drop to the height */
  float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - vCoord) / radius);
  drop = 0.5 - cos(drop * PI) * 0.5;
  info.r += drop * strength;

  fragColor = info;
}