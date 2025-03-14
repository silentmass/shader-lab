#version 300 es
precision highp float;
precision highp int;

in vec3 position;

out vec3 vOldPos;
out vec3 vNewPos;
out vec3 vRay;

// Uniforms
uniform vec3 light;
uniform sampler2D water;

#include ../utils;

vec3 project(vec3 origin, vec3 ray, vec3 refractedLight) {
  vec2 tcube = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
  origin += ray * tcube.y;
  float tplane = (-origin.y - 1.0) / refractedLight.y;
  return origin + refractedLight * tplane;
}

void main() {
  // Use texture() instead of texture2D() in GLSL3
  vec4 info = texture(water, position.xy * 0.5 + 0.5);
  info.ba *= 0.5;
  vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);

  /* project the vertices along the refracted vertex ray */
  vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
  vRay = refract(-light, normal, IOR_AIR / IOR_WATER);
  vOldPos = project(position.xzy, refractedLight, refractedLight);
  vNewPos = project(position.xzy + vec3(0.0, info.r, 0.0), vRay, refractedLight);

  gl_Position = vec4(0.75 * (vNewPos.xz + refractedLight.xz / refractedLight.y), 0.0, 1.0);
}