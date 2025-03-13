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

vec3 calculateImpactOrigin() {
    // Normalize uSpeed to ensure it's a unit vector in 2D
    vec2 normalizedSpeed = length(uSpeed) > 0.0 ? normalize(uSpeed) : vec2(0.0, 0.0);
    
    // The impact origin is in the opposite direction of the speed
    // For a sphere of radius 1, we need to map the 2D direction to a 3D point on the sphere surface
    
    // For the XY components, we negate the speed direction to get the impact point
    vec3 impactOrigin = vec3(-normalizedSpeed.x, -normalizedSpeed.y, 0.0);
    
    // For a unit sphere, if the impact is exactly on the XY plane 
    // (as your examples suggest), then we need the point to have length 1
    // and be on the XY plane (z=0)
    float xyLength = length(impactOrigin.xy);
    
    if (xyLength > 0.0) {
        // Scale the XY components to ensure the point is on the unit circle in the XY plane
        impactOrigin.x /= xyLength;
        impactOrigin.y /= xyLength;
    } else {
        // If speed is zero, default to a point on the sphere
        impactOrigin = vec3(1.0, 0.0, 0.0);
    }
    
    return impactOrigin;
}

// Function to calculate wave effects
vec3 calculateWaveEffects(float progress) {

    // TODO
    // Calculate impact origin from uSpeed
    // Set wave initial starting position to bottom of the geometry
    // Because we use THREE.js SphereGeometry, its origin is at the center

    vec3 impactOrigin = calculateImpactOrigin();

    // vec3 waveOrigin = uGeometryCenter - vec3(0.0, 0.5, 0.0);
    vec3 waveOrigin = uGeometryCenter - impactOrigin * 0.5;

    vec3 toPosition = vPosition - waveOrigin;
    vec3 direction = normalize(toPosition);
    float radius = length(toPosition);

    // Scale the radius to extend the wave's travel distance
    float maxRadius = 3.0; // Maximum radius the wave should travel to
    float scaledRadius = radius / maxRadius; // Normalize radius to [0,1] range
    
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

    // Slow wave
    
    float slowWaveSpeed = 3.0;
    float slowWavePeriod = 1.0/slowWaveSpeed;

    // Show wave only once, even if progress is not completed

    float slowWaveCycle;

    if (slowWavePeriod > progress) {
        slowWaveCycle = (progress/slowWavePeriod) - floor(progress/slowWavePeriod);
    } else {
        slowWaveCycle = scaledRadius;
    }
    
    float slowWave = 0.1 * generalSkewNormal(scaledRadius, slowWaveCycle, 0.1, -5.0);

    // Sample noise curve from texture
    vec2 sphereUV = vec2(azimuthalAngle / (2.0 * PI), elevationAngle / PI);
    float noise = texture(uTexture, sphereUV * 5.0 + vec2(uTime * 0.2, 0.0)).r;
    float noiseAmount = 0.2 + 0.15 * sin(uTime* 0.1);
    float noisyCurve = slowWave + noiseAmount * (noise - 0.5);

    // Add pointlight effect
    float waveRadius = slowWaveCycle + noisyCurve;
    vec3 curvePoint = toPosition * waveRadius + vec3(0.5);
    vec3 distToPoint = vPosition - curvePoint;
    float pointLightDecayFactor = 20.0;
    float pointlightFalloff = 1.0 / (1.0 + pointLightDecayFactor * dot(distToPoint, distToPoint));

    // Restrict noise and pointlight effect on trailing part of the wave
    float waveDistance = abs(scaledRadius - slowWaveCycle);
    float wavePresenceMask = smoothstep(0.2, 0.0, waveDistance);
    float trailingDistance = scaledRadius - slowWaveCycle;
    // Set edge1 to control noise doesn't go to black
    float trailingMask = smoothstep(0.0, -1.0, trailingDistance) * wavePresenceMask;

    // Add gradient
    // Keep the wave shape clean but add noise to the color
    float colorNoise = 1.0 + noiseAmount * (noise - 0.5);
    vec3 gradientColor = mix(uBaseColor, uBarRingBackgroundColor, slowWave) * colorNoise * trailingMask;

    // Combine the wave with pointlight and apply spherical symmetric pattern
    float noiseIntensity = 20.0;
    float combinedEffect = (noisyCurve * noiseIntensity + 0.5 * pointlightFalloff);

    vec3 slowWaveTrail = vec3(combinedEffect) * gradientColor;

    // Apply trailing effect to your slow wave
    float slowWaveIntensity = 20.0;
    vec3 slowWaveColor = slowWaveTrail * slowWaveIntensity;

    return slowWaveColor;
}

// Function to calculate PBR lighting
vec3 calculatePBR(vec3 albedo) {
    float metallic = 1.0;
    float roughness = 0.1;
    
    // Calculate the view and normal vectors
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCameraPosition - vPosition);
    
    // Ensure we have valid vectors
    if (length(N) < 0.5 || length(V) < 0.5) {
        return vec3(1.0, 0.0, 0.0); // Red to show error
    }
    
    // Light calculations
    vec3 L = normalize(uLightPosition - vPosition);
    vec3 H = normalize(V + L);
    float distance = length(uLightPosition - vPosition);
    float attenuation = 5000.0 / pow(distance, 2.0);
    vec3 radiance = uLightColor * attenuation;
    
    // Cook-Torrance BRDF
    vec3 F0 = mix(vec3(0.04), pow(albedo, vec3(2.2)), metallic);
    
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
    vec3 specular = numerator / max(denominator, 0.001);
    
    // Combine diffuse and specular
    float NdotL = max(dot(N, L), 0.0);
    vec3 Lo = (kD * albedo / PI + specular) * radiance * NdotL;
    
    // Add emissive component to make the colors pop more
    vec3 emissive = albedo * 0.3; // Add glow to the colors
    
    // Add ambient light to prevent pure black in shadows
    vec3 ambient = vec3(0.01) * albedo;
    vec3 color = ambient + Lo + emissive;
    
    // HDR tonemapping and gamma correction
    color = color / (color + vec3(1.0)); // Simple Reinhard tone mapping
    color = pow(color, vec3(1.0/2.2));   // Gamma correction
    
    // Add some variation based on position to make it more interesting
    float edge = smoothstep(0.8, 1.0, vDistanceToCenter);
    color = mix(color, color * 0.8, edge); // Darken edges slightly
    
    return color;
}

void main() {
    // Start with base color
    vec3 baseAlbedo = uBaseColor;
    
    // Always apply PBR lighting
    vec3 finalColor;
    
    
    // Check if we need to apply event color transformation
    if (uEvent == 1) {
        finalColor = calculatePBR(baseAlbedo);
        vec3 eventColor = calculatePBR(baseAlbedo + calculateWaveEffects(1.0 - (uEventProgress)));
        // Apply event intensity
        eventColor = mix(finalColor, eventColor, uEventIntensity);
        // Apply progress, where uEventProgress is 1.0 - progress
        finalColor = mix(finalColor, eventColor, uEventProgress);
        fragColor = vec4(finalColor, 1.0);
    } else {
        finalColor = calculatePBR(baseAlbedo);
        fragColor = vec4(finalColor, 1.0);
    }
    
}