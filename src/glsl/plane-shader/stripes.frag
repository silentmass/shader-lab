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
uniform int uEvent;
uniform float uEventIntensity;
uniform float uStripeCount;
uniform vec2 uSpeed; // Speed in stripes per second (x, y)
uniform float uAngle;

// Output color
out vec4 fragColor;

#include ../utils/utils;

void main() {
    
    float initialPhase = 0.0;

    
    // Apply rotation to texture coordinates
    vec2 center = vec2(0.5, 0.5);
    vec2 uv = vUv - center;
    vec2 rotatedUv;
    rotatedUv.x = uv.x * cos(uAngle) - uv.y * sin(uAngle);
    rotatedUv.y = uv.x * sin(uAngle) + uv.y * cos(uAngle);
    rotatedUv += center;
    
    // Calculate speed-based offset
    // uSpeed is in stripes per second, so we multiply by time directly
    vec2 offset = uSpeed * uTime;

    vec2 localSpeed = 1.0 / uStripeCount * offset;
    
    // Apply pattern using the stripeCount to control frequency
    // and offset for movement at the defined speed
    float pattern = step(0.5, normalizedSin(initialPhase + 
                                 (rotatedUv.x + localSpeed.x) * uStripeCount * 2.0 * PI));
    
    fragColor = vec4(getFloatColor(pattern), 1.0);
}