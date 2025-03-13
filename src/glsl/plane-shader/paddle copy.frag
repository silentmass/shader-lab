#version 300 es

// Fragment shaders must specify precision
precision highp float;

// Inputs from vertex shader
in vec2 vUv;
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
uniform float uBarRingCount;
uniform vec2 uSpeed;
uniform float uAngle;
uniform sampler2D uTexture;
uniform vec3 uGeometryCenter;
uniform vec3 uCameraPosition;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;

// Output color
out vec4 fragColor;

#include ../utils/utils;

float distributionGGX(vec3 N, vec3 H, float roughness) {
    float a2 = roughness * roughness;
    float NdotH = max(dot(N, H), 0.0);
    float denom = (NdotH * NdotH * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    return geometrySchlickGGX(max(dot(N, L), 0.0), roughness) * 
           geometrySchlickGGX(max(dot(N, V), 0.0), roughness);
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

void main() {
    float radius = length(vPosition - uGeometryCenter);
    
    // Time-based animation for expansion
    vec2 offset = 4.0 * -1.0 * uSpeed * uTime;

    // Do a single ring
    float nRings = 1.0;
    float pattern = normalizedSin(offset.x + radius * nRings * 2.0 * PI);
    
    vec3 ringsForegroundColor = vec3((1.0 - pattern)) * uBarRingForegroundColor;
    vec3 ringsBackgroundColor = vec3(pattern) * uBarRingBackgroundColor;
    vec3 patternColor = mix(uBaseColor,  ringsForegroundColor+ringsBackgroundColor, uBarRingOpacity);


    // Scale the radius to extend the wave's travel distance
    float maxRadius = 3.0; // Maximum radius the wave should travel to
    float scaledRadius = radius / maxRadius; // Normalize radius to [0,1] range

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

    

    // Use the scaled radius in your Gaussian function
    float slowWave = normalizedGaussian(scaledRadius, slowWaveCycle, 0.05);
    slowWave = slowWave + normalizedGaussian(scaledRadius, slowWaveCycle+0.05, 0.01);
    vec3 slowWaveColor = vec3(slowWave) * uBarRingBackgroundColor * symmetricPattern;

    float fastWaveSpeed = 1.0;
    float fastWavePeriod = 1.0/fastWaveSpeed;
    float fastWaveActive = step(0.0, slowWaveCycle) * step(slowWaveCycle, fastWavePeriod/slowWavePeriod);

    float fastWaveCycle = (uTime/fastWavePeriod) - floor(uTime/fastWavePeriod);
    float fastWave = fastWaveActive * normalizedGaussian(scaledRadius, fastWaveCycle, 0.01);
    fastWave = fastWave + normalizedGaussian(scaledRadius, fastWaveCycle+0.01, 0.01);

    vec3 fastWaveColor = uBaseColor * fastWave;

    vec3 wavesColor = slowWaveColor+fastWaveColor;
    

    // Set up our PBR variables
    vec3 albedo = patternColor + wavesColor;
    
    float metallic = 1.0;
    float roughness = 0.5; // Slightly smoother than before
    
    // Calculate the view and normal vectors
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCameraPosition - vPosition);
    
    // Ensure we have valid vectors
    if (length(N) < 0.5 || length(V) < 0.5) {
        fragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red to show error
        return;
    }
    
    // Light calculations
    vec3 L = normalize(uLightPosition - vPosition);
    vec3 H = normalize(V + L);
    float distance = length(uLightPosition - vPosition);
    float attenuation = 5000.0 / pow(distance, 2.0);
    vec3 radiance = uLightColor * attenuation;
    
    // Cook-Torrance BRDF
    vec3  F0 = mix (vec3 (0.04), pow(albedo, vec3 (2.2)), metallic);
    
    // Calculate all the terms
    float NDF = distributionGGX(N, H, roughness);
    float G = geometrySmith(N, V, L, roughness);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
    
    // Combine to get our specular component
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metallic;
    
    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0);
    vec3  specular    = numerator / max(denominator, 0.001);
    
    // Combine diffuse and specular
    float NdotL = max(dot(N, L), 0.0);
    vec3 Lo = (kD * albedo / PI + specular) * radiance * NdotL;
    
    vec3 color = Lo;

    // // Add emissive component to make the colors pop more
    // vec3 emissive = albedo * 0.3; // Add glow to the colors
    
    // // Add ambient light to prevent pure black in shadows
    // vec3 ambient = vec3(0.03) * albedo;
    // vec3 color = ambient + Lo + emissive;
    
    // HDR tonemapping and gamma correction
    color = color / (color + vec3(1.0)); // Simple Reinhard tone mapping
    // color = pow(color, vec3(1.0/2.2));   // Gamma correction
    
    // Add some variation based on position to make it more interesting
    float edge = smoothstep(0.8, 1.0, vDistanceToCenter);
    color = mix(color, color * 0.8, edge); // Darken edges slightly
    
    fragColor = vec4(color, 1.0);
}