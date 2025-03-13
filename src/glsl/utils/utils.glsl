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

// Function to create a continuous trailing wave effect
float createContinuousTrail(
    float radius,         // Distance from center
    float time,           // Current time
    float waveSpeed,      // Wave speed
    float trailLength,    // How long the trail extends behind the wave
    float mainWidth,      // Width of the main wave front
    float symmetryFactor  // How much to apply symmetry (0.0-1.0)
) {
    // Calculate wave position (0 to 1 cycle)
    float wavePeriod = 1.0 / waveSpeed;
    float waveCycle = mod(time / wavePeriod, 1.0);
    
    // Main wave position (expands outward with time)
    float wavePosition = waveCycle;
    
    // Create a sharp leading edge/main wave using exponential falloff
    float mainWave = 0.0;
    if (radius > wavePosition - mainWidth && radius < wavePosition + mainWidth) {
        // Calculate distance from the wave front
        float distFromWaveFront = abs(radius - wavePosition);
        
        // Create sharper falloff at the front edge, gentler behind
        float falloffFactor = (radius > wavePosition) ? 8.0 : 3.0;
        
        // Calculate wave intensity with exponential falloff
        mainWave = exp(-falloffFactor * distFromWaveFront * distFromWaveFront / (mainWidth * mainWidth));
    }
    
    // Create a continuous trail behind the main wave
    float trail = 0.0;
    if (radius < wavePosition) {
        // Calculate how far behind the main wave (0 = at wave, 1 = far behind)
        float trailFactor = (wavePosition - radius) / trailLength;
        
        // Ensure we're within the trail length
        if (trailFactor <= 1.0) {
            // Linear falloff for basic trail
            float basicTrail = 1.0 - trailFactor;
            
            // Apply exponential falloff for more realistic effect
            // This creates a smooth transition from main wave to trail
            float expFalloff = exp(-3.0 * trailFactor);
            
            // Combine for final trail effect
            trail = basicTrail * expFalloff;
            
            // Add some variation to the trail (optional)
            // Can use sin() to create dotted/dashed pattern
            float variation = 0.7 + 0.3 * sin(trailFactor * 20.0);
            trail *= variation;
        }
    }
    
    // Combine main wave and trail, ensuring they blend smoothly
    // The main wave will be stronger than the trail
    float result = max(mainWave, trail * 0.7);
    
    // Apply radial falloff to the entire effect
    // This helps create multiple rings that fade with distance
    float radialFalloff = exp(-0.5 * radius * radius);
    result *= mix(1.0, radialFalloff, 0.3);
    
    return result;
}

// Function to create a noise-based trailing wave effect inspired by the Starship shader
float createNoisyTrail(
    float radius,         // Distance from center
    vec2 uv,              // UV coordinates for noise sampling
    vec3 position,        // Position vector (from center)
    vec3 center,          // Center point
    float time,           // Current time
    float waveSpeed,      // Wave speed
    float trailLength,    // Trail length
    float mainWidth,      // Width of main wave
    sampler2D noiseTex    // Noise texture
) {
    // Calculate base wave properties
    float wavePeriod = 1.0 / waveSpeed;
    float waveCycle = mod(time / wavePeriod, 1.0);
    float wavePosition = waveCycle;
    
    // Create main wave pulse
    float mainWave = 0.0;
    if (radius > wavePosition - mainWidth && radius < wavePosition + mainWidth) {
        float distFromWaveFront = abs(radius - wavePosition);
        float falloffFactor = (radius > wavePosition) ? 8.0 : 3.0;
        mainWave = exp(-falloffFactor * distFromWaveFront * distFromWaveFront / (mainWidth * mainWidth));
    }
    
    // Create noise-based trail behind the wave
    float trail = 0.0;
    if (radius < wavePosition) {
        // How far we are behind the main wave (0-1 range)
        float trailFactor = (wavePosition - radius) / trailLength;
        
        if (trailFactor <= 1.0) {
            // Direction from center (normalized)
            vec3 direction = normalize(position - center);
            
            // Create basis for trail coordinate system
            // This creates a space where we can stretch the trail along the radial direction
            float azimuthalAngle = atan(direction.y, direction.x);
            float elevationAngle = acos(direction.z / radius);
            
            // Sample noise texture multiple times for organic look
            // First noise layer - base trail pattern
            vec2 noiseCoord1 = vec2(
                radius * 8.0 + time * 0.1,
                azimuthalAngle * 2.0
            );
            float noise1 = texture(noiseTex, noiseCoord1).r;
            
            // Second noise layer - trail variation
            vec2 noiseCoord2 = vec2(
                radius * 12.0 - time * 0.2, 
                azimuthalAngle * 4.0 + time * 0.3
            );
            float noise2 = texture(noiseTex, noiseCoord2).g;
            
            // Third noise layer - small detail
            vec2 noiseCoord3 = vec2(
                radius * 20.0 + trailFactor * 10.0,
                azimuthalAngle * 8.0 + elevationAngle * 4.0
            );
            float noise3 = texture(noiseTex, noiseCoord3).b;
            
            // Combine noise layers
            float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
            
            // Create base trail with exponential falloff
            float baseTrail = exp(-2.0 * trailFactor);
            
            // Modulate trail with noise
            // This creates the cloudy, streaky effect similar to the Starship shader
            trail = baseTrail * (0.4 + 0.6 * combinedNoise);
            
            // Add variation based on angle for streaks/wisps
            float angleVariation = 0.6 + 0.4 * sin(azimuthalAngle * 8.0 + time);
            trail *= angleVariation;
            
            // Add flashing effect (like in the Starship shader)
            // Different frequencies based on position
            float flash = exp(sin(radius * 10.0 + time * 0.5));
            trail *= mix(0.7, flash, 0.3);
            
            // The Starship shader uses point light falloff for trails
            // We can simulate a similar effect
            float falloff = 2.0 / (1.0 + trailFactor * 5.0);
            trail *= falloff;
        }
    }
    
    // Starship-like trail effect - stretching in the radial direction
    // This simulates the "max(p, p / vec2(...))" part from the Starship shader
    float stretchFactor = 1.0;
    if (radius < wavePosition) {
        // Calculate stretch factor based on noise
        vec2 stretchCoord = uv * 2.0 + time * 0.05;
        float noiseStretch = texture(noiseTex, stretchCoord).r;
        
        // Apply non-uniform scaling (longer in radial direction)
        // This creates the stretched, flowing trails
        stretchFactor = 1.0 + (wavePosition - radius) * noiseStretch * 2.0;
        trail *= stretchFactor;
    }
    
    // Combine main wave and trail
    float result = max(mainWave, trail * 0.7);
    
    return result;
}

vec3 cBlack = vec3(0.0, 0.0, 0.0);
vec3 cWhite = vec3(1.0, 1.0, 1.0);
vec3 cRed = vec3(1.0, 0.0, 0.0);
vec3 cGreen = vec3(0.0, 1.0, 0.0);
vec3 cBlue = vec3(0.0, 0.0, 1.0);

const float PI = 3.14159265359;
const float SQRT2 = 1.41421356237;

// Standard normal PDF (probability density function)
// φ(x) = (1/sqrt(2π)) * e^(-x²/2)
float normalPDF(float x) {
  return (1.0 / sqrt(2.0 * PI)) * exp(-0.5 * x * x);
}

// Approximation of the error function (erf)
// This is a good approximation for fragment shaders
float erf(float x) {
  // Parameters for approximation
  float sign = sign(x);
  float a = 0.140012;
  x = abs(x);
  
  // Approximation formula for erf
  float x2 = x * x;
  float erfApprox = sqrt(1.0 - exp(-x2 * (4.0/PI + a * x2) / (1.0 + a * x2)));
  return sign * erfApprox;
}

// Standard normal CDF (cumulative distribution function)
// Φ(x) = (1/2) * [1 + erf(x/sqrt(2))]
float normalCDF(float x) {
  return 0.5 * (1.0 + erf(x / SQRT2));
}

// Skew-normal PDF with parameter α
// f(x) = 2 * φ(x) * Φ(α*x)
float skewNormalPDF(float x, float alpha) {
  return 2.0 * normalPDF(x) * normalCDF(alpha * x);
}

// Function to convert from standard skew-normal to a general form with location, scale, and shape
float generalSkewNormal(float x, float location, float scale, float alpha) {
  // Standardize x
  float z = (x - location) / scale;
  
  // Apply the skew-normal formula and scale appropriately
  return (1.0 / scale) * skewNormalPDF(z, alpha);
}