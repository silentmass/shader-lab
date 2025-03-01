#version 300 es

// Input attributes
in vec3 position;
in vec3 normal;
in vec2 uv;

// Uniform matrices required for 3D rendering
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;

// Outputs to fragment shader
out vec2 vUv;
out vec3 vNormal;
out vec3 vPosition;

void main() {
    // Pass UV coordinates to fragment shader
    vUv = uv;
    
    // Transform normal to world space
    vNormal = normalize(mat3(modelMatrix) * normal);
    
    // Calculate position with a simple animation
    vec3 pos = position;
    pos.y += sin(position.x * 5.0 + uTime) * 0.05;
    
    // Calculate world position for lighting
    vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    
    // Standard transformation from local to clip space
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
}