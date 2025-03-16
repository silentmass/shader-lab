#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uWaterTexture;
uniform float uWaveSpeed;
uniform float uWavePersistence;
uniform float uWaveBaselineCorrection;

in vec2 vCoord;

out vec4 fragColor;

void main() {
  /* get vertex info */
  vec4 info = texture(uWaterTexture, vCoord);
  vec2 delta = vec2(1.0/256.0, 1.0/256.0);

  /* calculate average neighbor height */
  vec2 dx = vec2(delta.x, 0.0);
  vec2 dy = vec2(0.0, delta.y);
  float average = (
    texture(uWaterTexture, vCoord - dx).r +
    texture(uWaterTexture, vCoord - dy).r +
    texture(uWaterTexture, vCoord + dx).r +
    texture(uWaterTexture, vCoord + dy).r
  ) * 0.25;

  /* change the velocity to move toward the average */
  info.g += (average - info.r) * uWaveSpeed;

  /* attenuate the velocity a little so waves do not last forever */
  info.g *= uWavePersistence;

  /* move the vertex along the velocity */
  info.r += info.g;

  /* Add a small baseline correction factor to ensure water returns to zero */
  info.r = mix(info.r, 0.0, uWaveBaselineCorrection);

  fragColor = info;
}
