#version 300 es
precision highp float;
precision highp int;

// Inputs from vertex shader
in vec3 vOldPos;
in vec3 vNewPos;
in vec3 vRay;

// Output color (required in GLSL3)
out vec4 fragColor;

// Uniforms
uniform vec3 light;

#include ../utils;

void main() {
  /* if the triangle gets smaller, it gets brighter, and vice versa */
  float oldArea = length(dFdx(vOldPos)) * length(dFdy(vOldPos));
  float newArea = length(dFdx(vNewPos)) * length(dFdy(vNewPos));
  fragColor = vec4(oldArea / newArea * 0.2, 1.0, 0.0, 0.0);

  vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);

  /* shadow for the rim of the pool */
  vec2 t = intersectCube(vNewPos, -refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
  fragColor.r *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (vNewPos.y - refractedLight.y * t.y - 2.0 / 12.0)));
}