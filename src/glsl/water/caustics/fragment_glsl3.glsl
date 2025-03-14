// Fragment shader for caustics - WebGL2 compatible without #version directive
// glsl/water/caustics/fragment_glsl3.glsl

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

// Constants
const float IOR_AIR = 1.0;
const float IOR_WATER = 1.333;
const float poolHeight = 1.0;

// Function declarations
vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
  vec3 tMin = (cubeMin - origin) / ray;
  vec3 tMax = (cubeMax - origin) / ray;
  vec3 t1 = min(tMin, tMax);
  vec3 t2 = max(tMin, tMax);
  float tNear = max(max(t1.x, t1.y), t1.z);
  float tFar = min(min(t2.x, t2.y), t2.z);
  return vec2(tNear, tFar);
}

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