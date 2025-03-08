#version 300 es

// Fragment shaders must specify precision
precision highp float;

// Inputs from vertex shader
in vec2 vUv;
in vec2 TexCoords;
in vec3 vNormal;
in vec3 vPosition;
in float vDistanceToCenter;
in vec2 vScreen;

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
uniform vec3 uGeometryCenter;
uniform vec3 uCameraPosition;

// Output color
out vec4 fragColor;

#include ../utils/utils;


void main() {
    // Pulsating ring wave from COM
    vec4 texColor = texture(uTexture, vUv);

    float radius = length(vPosition - uGeometryCenter);
    
    // Time-based animation for expansion
    vec2 offset = 4.0 * -1.0 * uSpeed * uTime;
    float nRings = 1.0;

    float rings = normalizedSin(offset.x + radius * nRings * 2.0 * PI);
    
    vec3 ringsForegroundColor = vec3((1.0 - rings)) * uBarRingForegroundColor;
    vec3 ringsBackgroundColor = vec3(rings) * uBarRingBackgroundColor;

    vec3 color = mix(uBaseColor,  ringsForegroundColor+ringsBackgroundColor, uBarRingOpacity);

    vec3 finalColor = color;

    
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