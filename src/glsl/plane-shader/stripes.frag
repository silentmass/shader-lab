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

    vec2 localSpeed = 1.0 / uBarRingCount * offset;
    
    // Apply pattern using the stripeCount to control frequency
    // and offset for movement at the defined speed
    float pattern = step(0.5, normalizedSin(initialPhase + 
                                 (rotatedUv.x + localSpeed.x) * uBarRingCount * 2.0 * PI));

    vec3 barForegroundColor = vec3((1.0 - pattern)) * uBarRingForegroundColor;
    vec3 barBackgroundColor = vec3(pattern) * uBarRingBackgroundColor;


    vec3 finalColor = mix(uBaseColor,  (barForegroundColor+barBackgroundColor), uBarRingOpacity);
    
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