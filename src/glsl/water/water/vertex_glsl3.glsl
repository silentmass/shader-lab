// glsl/water/water/vertex_glsl3.glsl
precision highp float;
precision highp int;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform sampler2D water;

// Input attributes
in vec3 position;

// Output to fragment shader
out vec3 vEye;
out vec3 vPos;

void main() {
  vec4 info = texture(water, position.xy * 0.5 + 0.5);
  vPos = position.xzy;
  vPos.y += info.r;

  vec3 axis_x = vec3(modelViewMatrix[0].x, modelViewMatrix[0].y, modelViewMatrix[0].z);
  vec3 axis_y = vec3(modelViewMatrix[1].x, modelViewMatrix[1].y, modelViewMatrix[1].z);
  vec3 axis_z = vec3(modelViewMatrix[2].x, modelViewMatrix[2].y, modelViewMatrix[2].z);
  vec3 offset = vec3(modelViewMatrix[3].x, modelViewMatrix[3].y, modelViewMatrix[3].z);

  vEye = vec3(dot(-offset, axis_x), dot(-offset, axis_y), dot(-offset, axis_z));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);
}