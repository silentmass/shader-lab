#version 300 es
precision highp float;
precision highp int;

uniform vec3 light;
uniform sampler2D tiles;
uniform samplerCube sky;
uniform sampler2D water;
uniform sampler2D causticTex;
uniform float underwater;
uniform float impact;
uniform vec2 impactPosition;
uniform vec3 impactColor;
uniform vec2 resolution;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uBaseColor;
uniform vec3 uBarRingForegroundColor;
uniform vec3 uBarRingBackgroundColor;
uniform float uBarRingOpacity;
uniform int uEvent;
uniform float uEventIntensity;
uniform float uEventProgress;
uniform float uBarRingCount; // Number of stripes/rings
uniform vec2 uSpeed; // Speed of expansion (positive) or contraction (negative)
uniform float uAngle;
uniform sampler2D uTexture; // Declare the texture uniform
uniform vec3 uGeometryCenter;
uniform vec3 uCameraPosition;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;

uniform vec3 laserOrigin;      // Origin point of laser
uniform vec3 laserDirection;   // Direction of laser beam
uniform vec3 laserColor;       // Color of laser
uniform float laserIntensity;  // Intensity of laser
uniform float laserWidth;      // Width of the laser beam

uniform vec3 poolLights[4];         // Positions of pool lights
uniform vec3 poolLightColors[4];    // Colors of pool lights
uniform float poolLightIntensity;   // Overall intensity of pool lights
uniform float poolLightRadius;      // Radius of influence for each light

in vec3 vEye;
in vec3 vPos;

out vec4 fragColor;

#include ../utils;

vec3 calculatePoolLights(vec3 point) {
    vec3 totalLight = vec3(0.0);
    
    for(int i = 0; i < 4; i++) {
        float distance = length(point - poolLights[i]);
        
        // Quadratic attenuation
        float attenuation = 1.0 / (1.0 + distance * distance / (poolLightRadius * poolLightRadius));
        
        // Add contribution from this light
        totalLight += poolLightColors[i] * attenuation;
    }
    
    return totalLight * poolLightIntensity;
}

float calculateLaserContribution(vec3 point) {
    // Vector from laser origin to current point
    vec3 toPoint = point - laserOrigin;
    
    // Calculate closest point on laser ray to current point
    float t = dot(toPoint, laserDirection);
    vec3 closestPoint = laserOrigin + t * laserDirection;
    
    // Distance from point to laser beam
    float distance = length(point - closestPoint);
    
    // Attenuate based on distance from laser beam
    float attenuation = exp(-distance * distance / (laserWidth * laserWidth));
    
    // Additional attenuation through water
    float waterAttenuation = exp(-t * 0.5);
    
    return attenuation * waterAttenuation * laserIntensity;
}

float metalNoise(vec3 point) {
  // Simple cellular noise to create a subtle metallic texture
  float scale = 50.0;
  float x = fract(sin(point.x * scale) * 43758.5453);
  float y = fract(sin(point.y * scale) * 43758.5453);
  float z = fract(sin(point.z * scale) * 43758.5453);
  return mix(0.95, 1.05, fract(x * y * z)); // Subtle variation
}

vec3 getWallColor(vec3 point) {
  float scale = 0.5;

  vec3 wallColor;
  vec3 normal;
  
  if (abs(point.x) > 0.999) {
    // wallColor = texture(tiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
    // wallColor = vec3(0.8, 0.8, 0.85);
    wallColor = uColor;
    normal = vec3(-point.x, 0.0, 0.0);
  } else if (abs(point.z) > 0.999) {
    // wallColor = texture(tiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
    // wallColor = vec3(0.8, 0.8, 0.85);
    wallColor = uColor;
    normal = vec3(0.0, 0.0, -point.z);
  } else {
    // wallColor = texture(tiles, point.xz * 0.5 + 0.5).rgb;
    // wallColor = vec3(0.7, 0.7, 0.75);
    wallColor = uBaseColor;
    
    normal = vec3(0.0, 1.0, 0.0);
  }

  scale /= length(point); /* pool ambient occlusion */

  /* caustics */
  vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
  float diffuse = max(0.0, dot(refractedLight, normal));
  vec4 info = texture(water, point.xz * 0.5 + 0.5);

  // In water.frag, modify these parameters:
  float aoFactor = 0.4;  // Increase from 0.3 for stronger ambient occlusion
  // float diffuse = max(0.2, dot(refractedLight, normal));  // Lower minimum to allow darker areas
  float minBrightness = 0.25;  // Lower minimum brightness to allow more contrast
  
  if (point.y < info.r) {
    vec4 caustic = texture(causticTex, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
    scale += diffuse * caustic.r * 2.0 * caustic.g;
  } else {
    /* shadow for the rim of the pool */
    vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    diffuse *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));

    scale += diffuse * aoFactor;
  }

  scale = max(minBrightness, scale);

  wallColor *= metalNoise(point);

  // return wallColor * scale;

  // Calculate base wall color with standard lighting
  vec3 baseColor = wallColor * scale;
  
  // Add pool lights (only significant on the bottom)
  if(abs(point.y + poolHeight) < 0.01) {
      // We're on the bottom of the pool
      vec3 poolLightContribution = calculatePoolLights(point);
      baseColor += poolLightContribution;
      
      // Optional: make lights affect nearby walls too (for a glow effect)
      // This is most noticeable in corners
  } else if(abs(point.y + poolHeight) < 0.2) {
      // We're close to the bottom - apply reduced effect
      vec3 poolLightContribution = calculatePoolLights(point) * (0.2 - abs(point.y + poolHeight)) * 5.0;
      baseColor += poolLightContribution * 0.3;
  }
  
  return baseColor;
}

vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
  vec3 color;

  if (ray.y < 0.0) {
    // vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    // color = getWallColor(origin + ray * t.y);
    vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    vec3 hitPoint = origin + ray * t.y;
    
    // First get normal wall color (which includes pool lights)
    color = getWallColor(hitPoint);
    
    // Then add laser contribution
    float laserContrib = calculateLaserContribution(hitPoint);
    color += laserColor * laserContrib;
  } else {
    vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    vec3 hit = origin + ray * t.y;
    if (hit.y < 7.0 / 12.0) {
      color = getWallColor(hit);
    } else {
      color = texture(sky, ray).rgb;
      color += 0.01 * vec3(pow(max(0.0, dot(light, ray)), 20.0)) * vec3(10.0, 8.0, 6.0);
    }
  }

  if (ray.y < 0.0) color *= waterColor;

  return color;
}



void main() {
  vec2 coord = vPos.xz * 0.5 + 0.5;
  vec4 info = texture(water, coord);

  /* make water look more "peaked" */
  // for (int i = 0; i < 5; i++) {
  //   coord += info.ba * 0.005;
  //   info = texture(water, coord);
  // }

  /* make water look more "peaked" */
  for (int i = 0; i < 8; i++) { // Increase from 5 to 8 iterations
    coord += info.ba * 0.004; // Reduce from 0.005 to 0.004 for subtler effect
    info = texture(water, coord);
  }

  vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
  vec3 incomingRay = normalize(vPos - vEye);

  if (underwater > 0.5) {
    normal = -normal;
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);
    float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));

    vec3 reflectedColor = getSurfaceRayColor(vPos, reflectedRay, underwaterColor);
    vec3 refractedColor = getSurfaceRayColor(vPos, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);

    fragColor = vec4(mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay)), 1.0);
  } else {
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
    float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
    // float fresnel = mix(0.4, 1.0, pow(1.0 - dot(normal, -incomingRay), 5.0)); 

    vec3 reflectedColor = getSurfaceRayColor(vPos, reflectedRay, abovewaterColor);
    vec3 refractedColor = getSurfaceRayColor(vPos, refractedRay, abovewaterColor);

    fragColor = vec4(mix(refractedColor, reflectedColor, fresnel), 1.0);
  }
}