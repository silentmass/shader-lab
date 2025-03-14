#version 300 es
precision highp float;
precision highp int;

uniform sampler2D mainTexture;

in vec2 vCoord;

out vec4 fragColor;

void main() {
  /* get vertex info */
  vec4 info = texture(mainTexture, vCoord);
  vec2 delta = vec2(1.0/256.0, 1.0/256.0);

  /* calculate average neighbor height */
  vec2 dx = vec2(delta.x, 0.0);
  vec2 dy = vec2(0.0, delta.y);
  float average = (
    texture(mainTexture, vCoord - dx).r +
    texture(mainTexture, vCoord - dy).r +
    texture(mainTexture, vCoord + dx).r +
    texture(mainTexture, vCoord + dy).r
  ) * 0.25;

  /* change the velocity to move toward the average */
  info.g += (average - info.r) * 2.0;

  /* attenuate the velocity a little so waves do not last forever */
  info.g *= 0.995;

  /* move the vertex along the velocity */
  info.r += info.g;

  fragColor = info;
}
