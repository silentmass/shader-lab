#version 300 es
precision highp float;
precision highp int;

// Inputs from vertex shader
in vec3 vOldPos;
in vec3 vNewPos;
in vec3 vRay;

// Output color (required in GLSL3)
out vec4 fragColor;

#define MAX_LASERS 3  // Define the maximum number of lasers

// Uniforms
uniform vec3 laserOrigins[MAX_LASERS];
uniform vec3 laserDirections[MAX_LASERS];
uniform int activeLasers;
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

  // Add laser caustics
  for(int i = 0; i < MAX_LASERS; i++) {
    if(i >= activeLasers) break;
    
    vec3 laserRefracted = refract(-laserDirections[i], vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    
    // Calculate distance from this point to the laser beam
    vec3 toPoint = vNewPos - laserOrigins[i];
    float t = dot(toPoint, laserRefracted);
    vec3 closestPoint = laserOrigins[i] + t * laserRefracted;
    float distance = length(vNewPos - closestPoint);
    
    // Calculate caustic intensity for this laser - stronger closer to beam
    float laserFactor = 0.3; // Adjust strength of laser caustics
    float distanceFactor = exp(-distance * distance / 0.1); // Gaussian falloff
    
    // Add to the red channel which controls caustic intensity
    fragColor.r += laserFactor * distanceFactor;
    
    // Optional: add some color variation to the green channel
    fragColor.g += 0.2 * laserFactor * distanceFactor;
  }
}