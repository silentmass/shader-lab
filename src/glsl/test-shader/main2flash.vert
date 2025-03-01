// #version 300 es

// Input attributes - these must match Three.js attribute names
in vec3 position;
in vec3 normal;
in vec2 uv;

// Uniforms
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;

// Outputs to fragment shader
out vec2 vUv;
out vec3 vNormal;
out vec3 vPosition;
out vec3 vWorldPosition;
out vec3 vViewDirection;

void main() {
    // Pass data to fragment shader
    vUv = uv;
    
    // Transform normal to world space
    vNormal = normalize(mat3(modelMatrix) * normal);
    
    // Calculate world position for lighting
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Calculate view direction
    vec3 cameraPosition = (inverse(viewMatrix) * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    
    // Full transformation pipeline
    mat4 modelViewMatrix = viewMatrix * modelMatrix;
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}