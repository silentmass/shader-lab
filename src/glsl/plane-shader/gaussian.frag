#version 300 es

// Fragment shaders must specify precision
precision highp float;

// Inputs from vertex shader
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

// Uniforms for appearance customization
uniform float uTime;
uniform vec3 uBaseColor;
uniform int uEvent;
uniform float uEventIntensity;

// Output color
out vec4 fragColor;

#include ../utils/utils;


void main() {
    float distanceFromCenter = getDistanceFromPlaneCenter(vUv);
    
    
    float g = normalizedGaussian(distanceFromCenter, 0.0, 0.1);

    fragColor = vec4(getFloatColor(g), 1.0);
}   