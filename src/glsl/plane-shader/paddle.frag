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
uniform vec3 uGeometryCenter;

// Output color
out vec4 fragColor;

#include ../utils/utils;

void main() {
    vec4 texColor = texture(uTexture, vUv);

    float radius = length(vPosition - uGeometryCenter);
    
    // Time-based animation for expansion
    vec2 offset = 4.0 * -1.0 * uSpeed * uTime;

    float pattern = normalizedSin(offset.x + radius * 1.0 * 2.0 * PI);
    
    // Create sharper rings with step function
    float rings = pattern;

    vec3 ringsForegroundColor = vec3((1.0 - rings)) * uBarRingForegroundColor;
    vec3 ringsBackgroundColor = vec3(rings) * uBarRingBackgroundColor;

    // Normalized light direction (pointing downward and to the side)
    vec3 lightDir = normalize(uGeometryCenter);
    
    // Simple diffuse lighting
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    
    // Compute view direction and reflection for specular
    vec3 viewDir = normalize(-vPosition);
    vec3 reflectDir = reflect(-lightDir, vNormal);
    float specular = pow(max(dot(viewDir, reflectDir), 0.5), 16.0);

    vec3 color = mix(uBaseColor,  ringsForegroundColor+ringsBackgroundColor, uBarRingOpacity);
    // Combine diffuse and specular lighting
    vec3 ambient = color * 0.2;
    vec3 diffuseColor = color * diffuse * 0.6;
    vec3 specularColor = vec3(1.0) * specular * 0.4;

    vec3 finalColor = ambient + diffuseColor + specularColor;
    
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