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
    
    // Calculate position with a simple animation
    vec3 pos = position;
    
    // Calculate world position for lighting
    vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    
    // Standard transformation from local to clip space
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
}