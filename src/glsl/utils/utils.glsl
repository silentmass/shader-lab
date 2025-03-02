float normalizedGaussian(float x, float mean, float std_dev) {
    float variance = pow(std_dev, 2.0);
    
    // Standard Gaussian formula
    float g = exp(-pow(x - mean, 2.0) / (2.0 * variance));
    
    // Normalize to [0,1] by dividing by the maximum value
    // The maximum value of exp(-z²/2) is 1.0 when z=0
    return g;
}

vec3 getFloatColor(float x) {
    return vec3(x, x, x);
}

float getDistanceFromPlaneCenter(vec2 uv) {
    vec2 planeCenter = vec2(0.5, 0.5);
    vec2 distance = vec2(uv.x - planeCenter.x, uv.y - planeCenter.y);
    return sqrt(distance.x*distance.x + distance.y*distance.y);
}

float normalizedSin(float x) {
    return 0.5 * (1.0 + sin(x));
}

vec3 cBlack = vec3(0.0, 0.0, 0.0);
vec3 cWhite = vec3(1.0, 1.0, 1.0);
vec3 cRed = vec3(1.0, 0.0, 0.0);
vec3 cGreen = vec3(0.0, 1.0, 0.0);
vec3 cBlue = vec3(0.0, 0.0, 1.0);

const float PI = 3.14159265359;