#version 300 es

// Fragment shaders must specify precision
precision highp float;

// Inputs from vertex shader
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

// Uniforms for appearance customization
uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uRingsForegroundColor;
uniform vec3 uRingsBackgroundColor;
uniform int uEvent;
uniform float uEventIntensity;
uniform float uStripeCount; // Number of stripes/rings
uniform vec2 uSpeed; // Speed of expansion (positive) or contraction (negative)

// Output color
out vec4 fragColor;

#include ../utils/utils;

void main() {
    // Center of the concentric circles
    vec2 center = vec2(0.5, 0.5);
    
    // Calculate distance from center (radius)
    vec2 uv = vUv - center;
    float radius = length(uv);
    
    // Time-based animation for expansion
    vec2 offset = 4.0 * -1.0 * uSpeed * uTime;

    float pattern = normalizedSin(offset.x + radius * uStripeCount * 2.0 * PI);
    
    // Create sharper rings with step function
    float rings = step(0.5, pattern);

    float g = clamp(600.0 * normalizedGaussian(radius, 0.0, 0.1), 0.0, 1.0);
    vec3 gColor = vec3(1.0-g) * uBaseColor;
    vec3 ringsForegroundColor = vec3((1.0 - rings)) * uRingsForegroundColor;
    vec3 ringsBackgroundColor = vec3(rings) * uRingsBackgroundColor;


    // vec3 finalColor = mix(uBaseColor, gColor + vec3(g*rings), uEventIntensity);
    vec3 finalColor = mix(uBaseColor, gColor + g*(ringsForegroundColor+ringsBackgroundColor), uEventIntensity);
    
    fragColor = vec4(finalColor, 1.0);
}