#version 300 es

// Fragment shaders must specify precision
precision highp float;

// Inputs from vertex shader
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

// Uniforms for appearance customization
uniform float uTime;
uniform vec3 uColor;
uniform vec3 baseColor;
uniform sampler2D diffuseMap;

// Output color
out vec4 fragColor;

void main() {
    // Normalized light direction (pointing downward and to the side)
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
    
    // Simple diffuse lighting
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    
    // Compute view direction and reflection for specular
    vec3 viewDir = normalize(-vPosition);
    vec3 reflectDir = reflect(-lightDir, vNormal);
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
    
    // Create a checkerboard pattern based on UV coordinates
    float checkSize = 8.0;
    float checkerPattern = mod(floor(vUv.x * checkSize) + floor(vUv.y * checkSize), 2.0);
    vec3 checkerColor = mix(baseColor, baseColor * 0.8, checkerPattern);
    
    // Add color variation with time
    vec3 color = checkerColor * (0.9 + sin(uTime) * 0.1);
    
    // Combine diffuse and specular lighting
    vec3 ambient = color * 0.2;
    vec3 diffuseColor = color * diffuse * 0.6;
    vec3 specularColor = vec3(1.0) * specular * 0.4;
    
    // Final color combines ambient, diffuse and specular components
    vec3 finalColor = ambient + diffuseColor + specularColor;
    
    // Output with full opacity
    fragColor = vec4(finalColor, 1.0);
}