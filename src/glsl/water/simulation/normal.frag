#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uWaterTexture;

in vec2 vCoord;

out vec4 fragColor;

void main() {
  /* get vertex info */
  vec4 info = texture(uWaterTexture, vCoord);
  vec2 delta = vec2(1.0/256.0, 1.0/256.0);

  /* update the normal */
  vec3 dx = vec3(delta.x, texture(uWaterTexture, vec2(vCoord.x + delta.x, vCoord.y)).r - info.r, 0.0);
  vec3 dy = vec3(0.0, texture(uWaterTexture, vec2(vCoord.x, vCoord.y + delta.y)).r - info.r, delta.y);
  info.ba = normalize(cross(dy, dx)).xz;

  fragColor = info;
}
