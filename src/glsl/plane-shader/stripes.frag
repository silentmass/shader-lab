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
uniform vec3 uRingBarForegroundColor;
uniform vec3 uRingBarBackgroundColor;
uniform int uEvent;
uniform float uEventIntensity;
uniform float uStripeCount; // Number of stripes/rings
uniform vec2 uSpeed; // Speed of expansion (positive) or contraction (negative)
uniform float uAngle;
uniform sampler2D uTexture; // Declare the texture uniform

// Output color
out vec4 fragColor;

#include ../utils/utils;

void main() {
    vec4 texColor = texture(uTexture, vUv);
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

    vec3 ringsForegroundColor = vec3((1.0 - pattern)) * uRingBarForegroundColor;
    vec3 ringsBackgroundColor = vec3(pattern) * uRingBarBackgroundColor;


    vec3 finalColor = mix(uBaseColor,  (ringsForegroundColor+ringsBackgroundColor), uEventIntensity);
    
    if (uEvent == 1) {
        fragColor = vec4(mix(mix(uBaseColor, cBlack, uEventIntensity), uBaseColor, texColor.x), 1.0);
    } else {
        fragColor = vec4(finalColor, 1.0);
    }
}