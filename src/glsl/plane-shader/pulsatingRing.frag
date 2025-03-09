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

    // vec3 finalColor = color;

    // Get vector from center to current position (3D)
    vec3 toPosition = vPosition.xyz - uGeometryCenter.xyz;

    vec3 direction = normalize(toPosition);
    
    // Calculate polar angle (azimuthal angle in spherical coordinates)
    float azimuthalAngle = atan(direction.y, direction.x);
    // Convert to [0, 2π] range
    azimuthalAngle = azimuthalAngle < 0.0 ? azimuthalAngle + 2.0 * PI : azimuthalAngle;
    
    // Calculate elevation angle (polar angle in spherical coordinates)
    float r = length(toPosition);
    float elevationAngle = acos(toPosition.z / r);
    
    // Add symmetry
    int azimuthalFolds = 8;
    float symmetricAzimuthal = mod(azimuthalAngle, 2.0 * PI / float(azimuthalFolds));
    
    int elevationFolds = 4;
    float symmetricElevation = mod(elevationAngle, PI / float(elevationFolds));
    
    // Combined symmetric pattern
    float symmetricPattern = normalizedSin(symmetricAzimuthal * 72.0) * normalizedSin(symmetricElevation * 72.0);

    // Rest of your code remains the same
    float slowWaveSpeed = 0.5;
    float slowWavePeriod = 1.0/slowWaveSpeed;
    float slowWaveCycle = (uTime/slowWavePeriod) - floor(uTime/slowWavePeriod);
    float slowWave = normalizedGaussian(radius, slowWaveCycle, 0.05);
    slowWave = slowWave + normalizedGaussian(radius, slowWaveCycle+0.05, 0.01);
    vec3 slowWaveColor = vec3(slowWave) * uBarRingBackgroundColor * symmetricPattern;

    float fastWaveSpeed = 1.0;
    float fastWavePeriod = 1.0/fastWaveSpeed;
    float fastWaveActive = step(0.0, slowWaveCycle) * step(slowWaveCycle, fastWavePeriod/slowWavePeriod);

    float fastWaveCycle = (uTime/fastWavePeriod) - floor(uTime/fastWavePeriod);
    float fastWave = fastWaveActive * normalizedGaussian(radius, fastWaveCycle, 0.01);
    vec3 fastWaveColor = uBaseColor * fastWave;

    vec3 finalColor = slowWaveColor+fastWaveColor;

    
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