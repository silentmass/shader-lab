#version 300 es

// Fragment shaders must specify precision
precision highp float;

// Inputs from vertex shader
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;
in float vDistanceToCenter;

// Uniforms for appearance customization
uniform float uTime;
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

// Output color
out vec4 fragColor;

#include ../utils/utils;

void main() {
    vec4 texColor = texture(uTexture, vUv);

    // Center of the concentric circles
    vec2 center = vec2(0.5, 0.5);
    
    // Calculate distance from center (radius)
    vec2 uv = vUv - center;
    float radius = length(uv);
    
    // Time-based animation for expansion
    vec2 offset = 4.0 * -1.0 * uSpeed * uTime;

    float pattern = normalizedSin(offset.x + radius * uBarRingCount * 2.0 * PI);
    
    // Create sharper rings with step function
    float rings = step(0.5, pattern);

    float g = clamp(600.0 * normalizedGaussian(radius, 0.0, 0.1), 0.0, 1.0);
    // vec3 gZeroColor = vec3(1.0-g) * uBaseColor;
    vec3 gZeroColor = mix(uBaseColor, vec3(1.0), g);
    vec3 ringsForegroundColor = vec3((1.0 - rings)) * uBarRingForegroundColor;
    vec3 ringsBackgroundColor = vec3(rings) * uBarRingBackgroundColor;


    // vec3 finalColor = mix(uBaseColor,  gZeroColor + g*(ringsForegroundColor+ringsBackgroundColor-gZeroColor), uEventIntensity);
    vec3 finalColor = mix(uBaseColor,  gZeroColor + mix(uBaseColor, ringsForegroundColor+ringsBackgroundColor-gZeroColor, g), uBarRingOpacity);
    
    if (uEvent == 1) {
        // Keep text black and change texture white to base color
        vec3 textPlane = mix(cBlack, uBaseColor, texColor.x);
        // Apply event intensity
        textPlane = mix(uBaseColor, textPlane, uEventIntensity);
        // Apply progress, where uEventProgress is 1.0 - progress
        fragColor = vec4(mix(finalColor,textPlane,  uEventProgress), 1.0);
    } else {
        fragColor = vec4(finalColor, 1.0);
    }
}