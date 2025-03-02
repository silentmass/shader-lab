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

float gaussian(float x, float mean, float std_dev) {
    float variance = std_dev * std_dev;
    return (1.0 / sqrt(2.0 * 3.14159 * variance)) * exp(-pow(x - mean, 2.0) / (2.0 * variance));
}

void main() {
    vec2 planeCenter = vec2(0.5, 0.5);
    float uDistanceFromPlaneCenter = vUv.x - planeCenter.x;
    float vDistanceFromPlaneCenter = vUv.y - planeCenter.y;
    float absDistanceFromPlaneCenter = sqrt(uDistanceFromPlaneCenter*uDistanceFromPlaneCenter + vDistanceFromPlaneCenter*vDistanceFromPlaneCenter);
    vec3 black = vec3(0.0, 0.0, 0.0);
    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 red = vec3(1.0, 0.0, 0.0);
    vec3 green = vec3(0.0, 1.0, 0.0);
    vec3 blue = vec3(0.0, 0.0, 1.0);
    
    // float threshold = 0.5 * (1.0 + sin(uTime));
    float period = 5.0; // 3 seconds per cycle
    float t = mod(uTime, period) / period; // Normalize time to [0, 1] range
    float threshold = t;
    
    float bgChangePeriod = 2.0;
    float t2 = mod(uTime, bgChangePeriod * period) / (bgChangePeriod * period); // Normalize time to [0, 1] range
    t2 = 0.5 * (1.0 + sin(t2 * 3.14 * 2.0));


    vec3 expandingColor = red;
    vec3 bgColor = black;

    // bgColor = mix(black, red, t2);
    // if (t2 < 0.5) {
    //     bgColor = black;
    //     expandingColor = red;
    // } else {
    //     bgColor = red;
    //     expandingColor = black;
    // }


    vec3 eventColor = vec3(1.0, 0.0, 0.0);
    switch (uEvent) {
    case 0:
        eventColor = vec3(1.0, 0.0, 0.0);
        break;
    case 1:
        eventColor = vec3(0.0, 1.0, 0.0);
        break;
    }
    // vec3 finalColor = mix(uBaseColor, eventColor, uEventIntensity);
    // fragColor = vec4(finalColor, 1.0);
    // fragColor = vec4(absDistanceFromPlaneCenter, absDistanceFromPlaneCenter, absDistanceFromPlaneCenter, 1.0);
    // if (absDistanceFromPlaneCenter > 1.0) {
    //     fragColor = vec4(0.0, 0.0, 1.0, 1.0);
    // } else {
    //     fragColor = vec4(absDistanceFromPlaneCenter, 0.0, 0.0, 1.0);
    // }
    // fragColor = vec4(vUv.x, vUv.x, vUv.x, 1.0);
    float borderWidth = 0.2;
    if (absDistanceFromPlaneCenter > threshold - borderWidth && absDistanceFromPlaneCenter < threshold) {
        float relDistanceFromBorderStart = (absDistanceFromPlaneCenter - (threshold - borderWidth)) / borderWidth;
        expandingColor = mix(expandingColor, bgColor, 2.0 * abs(relDistanceFromBorderStart - 0.5));
        float g = gaussian(2.0 * abs(relDistanceFromBorderStart - 0.5), 0.5, 0.1);

        fragColor = vec4(expandingColor, 1.0);
        // fragColor = vec4((1.0 - relDistanceFromBorderCenter), 0.0, 0.0, 1.0);
    } else {
        fragColor = vec4(bgColor, 1.0);
    }
}   