#version 300 es
precision highp float;
precision highp int;

uniform vec3 light;
uniform sampler2D tiles;
uniform samplerCube sky;
uniform sampler2D water;
uniform sampler2D causticTex;
uniform float underwater;
uniform float uTime;
uniform float impact;
uniform vec2 impactPosition;
uniform vec3 impactColor;
uniform vec2 resolution;

in vec3 vEye;
in vec3 vPos;

out vec4 fragColor;

#include ../utils;

vec3 getWallColor(vec3 point) {
  float scale = 0.5;

  vec3 wallColor;
  vec3 normal;
  
  if (abs(point.x) > 0.999) {
    // wallColor = texture(tiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
    wallColor = vec3(0.0, 1.0, 0.0);
    normal = vec3(-point.x, 0.0, 0.0);
  } else if (abs(point.z) > 0.999) {
    // wallColor = texture(tiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
    wallColor = vec3(1.0, 0.0, 0.0);
    normal = vec3(0.0, 0.0, -point.z);
  } else {
    // wallColor = texture(tiles, point.xz * 0.5 + 0.5).rgb;
    wallColor = vec3(0.0, 0.0, 1.0);
    
    normal = vec3(0.0, 1.0, 0.0);
  }

  scale /= length(point); /* pool ambient occlusion */

  /* caustics */
  vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
  float diffuse = max(0.0, dot(refractedLight, normal));
  vec4 info = texture(water, point.xz * 0.5 + 0.5);
  
  if (point.y < info.r) {
    vec4 caustic = texture(causticTex, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
    scale += diffuse * caustic.r * 2.0 * caustic.g;
  } else {
    /* shadow for the rim of the pool */
    vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    diffuse *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));

    scale += diffuse * 0.5;
  }

  float ambientLevel = 0.3;
  scale = max(ambientLevel, scale);

  return wallColor * scale;
}

vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
  vec3 color;

  if (ray.y < 0.0) {
    vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    color = getWallColor(origin + ray * t.y);
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
  for (int i = 0; i < 5; i++) {
    coord += info.ba * 0.005;
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

    vec3 reflectedColor = getSurfaceRayColor(vPos, reflectedRay, abovewaterColor);
    vec3 refractedColor = getSurfaceRayColor(vPos, refractedRay, abovewaterColor);

    fragColor = vec4(mix(refractedColor, reflectedColor, fresnel), 1.0);
  }
}