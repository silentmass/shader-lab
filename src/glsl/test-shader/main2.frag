#version 300 es

precision highp float;

// Inputs from vertex shader
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;
in vec3 vWorldPosition;
in vec3 vViewDirection;

// Uniforms
uniform float uTime;
uniform vec3 uColor;

// Output
out vec4 fragColor;

// Hash function for noise
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// Noise function for metal variation
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    // Smooth interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    // Mix 4 corners
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// FBM (Fractal Brownian Motion) for layered noise
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 3.0;
    
    // Add several octaves of noise
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    
    return value;
}

void main() {
    // Calculate metal base color with subtle variations
    vec3 baseColor = uColor;
    
    // Compute noise pattern for metal streaks and variation
    vec2 noiseCoord = vWorldPosition.xy * 2.0 + vWorldPosition.yz * 1.5 + uTime * 0.05;
    float noisePattern = fbm(noiseCoord);
    
    // Adjust the noise pattern to create subtle color shifts
    vec3 noiseColor = mix(baseColor * 0.8, baseColor * 1.2, noisePattern);
    
    // Basic lighting
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diffuse = max(dot(vNormal, lightDir), 0.1);
    
    // Specular reflection
    vec3 reflectDir = reflect(-lightDir, vNormal);
    float specular = pow(max(dot(vViewDirection, reflectDir), 0.0), 32.0);
    
    // Add subtle sparkles for metallic effect
    float sparkle = pow(noise(vWorldPosition.xy * 40.0 + uTime * 2.0), 16.0) * 0.5;
    
    // Metal streaks based on position and normal
    float streaks = fbm((vWorldPosition.xy + vWorldPosition.yz) * 5.0) * 0.1;
    
    // Combine all effects
    vec3 finalColor = noiseColor * diffuse;
    finalColor += vec3(1.0) * specular * (0.5 + streaks);
    finalColor += vec3(1.0) * sparkle;
    
    // Output with full opacity
    fragColor = vec4(finalColor, 1.0);
}