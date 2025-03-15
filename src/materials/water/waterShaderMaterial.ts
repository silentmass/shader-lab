// Modified waterShaderMaterial.ts to extend PlaneMaterial

import * as THREE from "three";
import {
  GameEventType,
  type GameEventData,
  type IMaterialGameEvents,
} from "../IMaterialGameEvents.ts";
import waterWaterVertexShader from "../../glsl/water/water/water.vert";
import waterWaterFragmentShader from "../../glsl/water/water/water.frag";
import { Caustics } from "./caustics.ts";
import { WaterSimulation } from "./watersimulation.ts";
import { PlaneMaterial, Uniforms } from "../PlaneMaterial";
import { stripVersion } from "../MaterialUtils.ts";

// Define default water-specific values at the module level
const DEFAULT_WATER_UNIFORMS = {
  underwater: 0.0,
  poolHeight: 1.0,
  lasers: [
    {
      origin: new THREE.Vector3(1.0, 0.1, 0.0),
      direction: new THREE.Vector3(-1.0, -0.1, 0.0).normalize(),
      color: new THREE.Vector3(1.0, 0.2, 0.1), // Red
      intensity: 2.0,
      width: 0.02,
    },
    {
      origin: new THREE.Vector3(-1.0, 0.1, 0.0),
      direction: new THREE.Vector3(1.0, -0.1, 0.0).normalize(),
      color: new THREE.Vector3(0.1, 0.2, 1.0), // Blue
      intensity: 1.8,
      width: 0.015,
    },
    {
      origin: new THREE.Vector3(0.0, 0.1, 1.0),
      direction: new THREE.Vector3(0.0, -0.1, -1.0).normalize(),
      color: new THREE.Vector3(0.1, 1.0, 0.2), // Green
      intensity: 1.5,
      width: 0.018,
    },
  ],
  poolLights: [
    {
      position: new THREE.Vector3(-0.5, -1.0, -0.5), // Bottom left
      color: new THREE.Vector3(0.0, 0.5, 1.0), // Blue
    },
    {
      position: new THREE.Vector3(0.5, -1.0, -0.5), // Bottom right
      color: new THREE.Vector3(0.0, 1.0, 0.5), // Green-cyan
    },
    {
      position: new THREE.Vector3(-0.5, -1.0, 0.5), // Top left
      color: new THREE.Vector3(1.0, 0.5, 0.0), // Orange
    },
    {
      position: new THREE.Vector3(0.5, -1.0, 0.5), // Top right
      color: new THREE.Vector3(0.8, 0.0, 0.8), // Purple
    },
  ],
  poolLightIntensity: 1.5,
  poolLightRadius: 0.4,
};

// Define interfaces for the water-specific options
interface LaserOptions {
  origin?: THREE.Vector3;
  direction?: THREE.Vector3;
  color?: THREE.Vector3 | THREE.Color;
  intensity?: number;
  width?: number;
}

interface PoolLightOptions {
  position?: THREE.Vector3;
  color?: THREE.Vector3 | THREE.Color;
}

interface WaterUniforms {
  underwater?: number;
  poolHeight?: number;
  lasers?: LaserOptions[];
  poolLights?: PoolLightOptions[];
  poolLightIntensity?: number;
  poolLightRadius?: number;
}

interface WaterShaderOptions {
  width?: number;
  height?: number;
  geometry?: THREE.BufferGeometry;
  uniforms?: WaterUniforms & Uniforms; // Combine with PlaneMaterial uniforms
}

/**
 * WaterShaderMaterial - A THREE.js material that simulates dynamic water
 * Uses multiple render passes to create realistic water effect
 * Extends PlaneMaterial to be compatible with ShaderLab
 */
export class WaterShaderMaterial
  extends PlaneMaterial
  implements IMaterialGameEvents
{
  private _renderer: THREE.WebGLRenderer;
  private _camera: THREE.PerspectiveCamera;
  private _waterSimulation: WaterSimulation;
  private _caustics: Caustics;
  private _light: THREE.Vector3;
  private _gameWidth: number;
  private _gameHeight: number;
  private _water: THREE.Texture | null = null;
  private _causticTex: THREE.Texture | null = null;
  private _tiles: THREE.Texture;
  private _poolHeight: number;
  private _underwater: number;
  private _poolLightIntensity: number;
  private _poolLightRadius: number;

  /**
   * Create a new water shader material
   */
  constructor(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    options: WaterShaderOptions = {}
  ) {
    // Store game dimensions for coordinate conversion
    const gameWidth = options.width || window.innerWidth;
    const gameHeight = options.height || window.innerHeight;

    // Get water-specific uniform options with defaults
    const waterUniforms = options.uniforms || {};

    // Set up light direction
    const light = new THREE.Vector3(0.0, 0.9, 0.0).normalize();

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const cubeTextureLoader = new THREE.CubeTextureLoader();

    const tiles = textureLoader.load("assets/images/water/tiles.jpg");
    const sky = cubeTextureLoader.load([
      "assets/images/water/xpos.jpg",
      "assets/images/water/xneg.jpg",
      "assets/images/water/ypos.jpg",
      "assets/images/water/yneg.jpg",
      "assets/images/water/zpos.jpg",
      "assets/images/water/zneg.jpg",
    ]);

    // Initialize PlaneMaterial with our water shaders
    super(
      stripVersion(waterWaterVertexShader),
      stripVersion(waterWaterFragmentShader),
      { uniforms: options.uniforms }
    );

    // Store instance properties
    this._renderer = renderer;
    this._camera = camera;
    this._light = light;
    this._gameWidth = gameWidth;
    this._gameHeight = gameHeight;
    this._tiles = tiles;
    this._poolHeight =
      waterUniforms.poolHeight || DEFAULT_WATER_UNIFORMS.poolHeight;
    this._underwater =
      waterUniforms.underwater || DEFAULT_WATER_UNIFORMS.underwater;
    this._poolLightIntensity =
      waterUniforms.poolLightIntensity ||
      DEFAULT_WATER_UNIFORMS.poolLightIntensity;
    this._poolLightRadius =
      waterUniforms.poolLightRadius || DEFAULT_WATER_UNIFORMS.poolLightRadius;

    // Override some material properties
    this.side = THREE.BackSide;

    // Process laser data
    const defaultLasers = DEFAULT_WATER_UNIFORMS.lasers;
    const laserData = waterUniforms.lasers || defaultLasers;

    // Process and validate laser data
    const processedLasers = laserData.map((laser, index) => {
      const defaultLaser = defaultLasers[index] || defaultLasers[0];

      // Handle color conversion from THREE.Color to THREE.Vector3 if needed
      let laserColor: THREE.Vector3;
      if (laser.color instanceof THREE.Color) {
        laserColor = new THREE.Vector3(
          laser.color.r,
          laser.color.g,
          laser.color.b
        );
      } else {
        laserColor = laser.color || defaultLaser.color;
      }

      return {
        origin: laser.origin || defaultLaser.origin,
        direction: (laser.direction || defaultLaser.direction)
          .clone()
          .normalize(),
        color: laserColor,
        intensity: laser.intensity || defaultLaser.intensity,
        width: laser.width || defaultLaser.width,
      };
    });

    // Process pool lights
    const defaultPoolLights = DEFAULT_WATER_UNIFORMS.poolLights;
    const poolLightData = waterUniforms.poolLights || defaultPoolLights;

    // Process pool light positions and colors
    const poolLightPositions: THREE.Vector3[] = [];
    const poolLightColors: THREE.Vector3[] = [];

    poolLightData.forEach((light, index) => {
      const defaultLight = defaultPoolLights[index] || defaultPoolLights[0];

      // Add position
      poolLightPositions.push(light.position || defaultLight.position);

      // Handle color conversion if needed
      if (light.color instanceof THREE.Color) {
        poolLightColors.push(
          new THREE.Vector3(light.color.r, light.color.g, light.color.b)
        );
      } else {
        poolLightColors.push(light.color || defaultLight.color);
      }
    });

    // Add water-specific uniforms
    this.uniforms.light = { value: light };
    this.uniforms.tiles = { value: tiles };
    this.uniforms.sky = { value: sky };
    this.uniforms.water = { value: null };
    this.uniforms.causticTex = { value: null };
    this.uniforms.underwater = { value: this._underwater };

    // Add laser uniforms
    this.uniforms.laserOrigins = {
      value: processedLasers.map((laser) => laser.origin),
    };
    this.uniforms.laserDirections = {
      value: processedLasers.map((laser) => laser.direction),
    };
    this.uniforms.laserColors = {
      value: processedLasers.map((laser) => laser.color),
    };
    this.uniforms.laserIntensities = {
      value: processedLasers.map((laser) => laser.intensity),
    };
    this.uniforms.laserWidths = {
      value: processedLasers.map((laser) => laser.width),
    };
    this.uniforms.activeLasers = { value: processedLasers.length };

    // Add pool light uniforms
    this.uniforms.poolLights = { value: poolLightPositions };
    this.uniforms.poolLightColors = { value: poolLightColors };
    this.uniforms.poolLightIntensity = { value: this._poolLightIntensity };
    this.uniforms.poolLightRadius = { value: this._poolLightRadius };

    // Create water simulation
    this._waterSimulation = new WaterSimulation();

    // Create caustics
    const geometry =
      options.geometry || new THREE.PlaneGeometry(2, 2, 200, 200);
    this._caustics = new Caustics(geometry, this._light);

    // Add initial drops
    this._initializeWater();
  }

  /**
   * Initialize water with some random drops
   */
  private _initializeWater(): void {
    // Add some random drops to initialize the water
    for (let i = 0; i < 15; i++) {
      this._waterSimulation.addDrop(
        this._renderer,
        Math.random() * 2 - 1, // x in [-1,1]
        Math.random() * 2 - 1, // y in [-1,1]
        0.03, // radius
        i & 1 ? 0.02 : -0.02 // alternate positive/negative drops
      );
    }

    // Update the simulation a few times to get waves going
    for (let i = 0; i < 10; i++) {
      this._waterSimulation.stepSimulation(this._renderer);
    }
    this._waterSimulation.updateNormals(this._renderer);

    // Generate initial caustics
    // In _initializeWater method, after creating the caustics
    this._caustics.update(this._renderer, this._waterSimulation.texture);

    // Safely set the laser uniforms
    this._caustics.setLaserUniforms(
      this.uniforms.laserOrigins?.value || [],
      this.uniforms.laserDirections?.value || [],
      this.uniforms.activeLasers?.value || 0
    );

    // Set initial textures
    this._water = this._waterSimulation.texture.texture;
    this._causticTex = this._caustics.texture.texture;
    this.uniforms.water.value = this._water;
    this.uniforms.causticTex.value = this._causticTex;
  }

  /**
   * Convert world coordinates to UV coordinates (0-1 range)
   */
  private _worldToUV(x: number, y: number): THREE.Vector2 {
    // Convert from game world coordinates to UV space
    const ndcX = x / (this._gameWidth / 2); // -1 to 1 range
    const ndcY = y / (this._gameHeight / 2); // -1 to 1 range

    return new THREE.Vector2(
      (ndcX + 1.0) * 0.5, // Convert -1,1 to 0,1
      (ndcY + 1.0) * 0.5 // Convert -1,1 to 0,1 (no flipping)
    );
  }

  /**
   * Add a drop to the water simulation
   */
  public addDrop(
    x: number,
    y: number,
    radius: number = 0.03,
    strength: number = 0.01
  ): void {
    this._waterSimulation.addDrop(this._renderer, x, y, radius, strength);
  }

  /**
   * Add multiple concentric ring waves at a specified position
   *
   * @param x - X position in normalized coordinates (-1 to 1)
   * @param y - Y position in normalized coordinates (-1 to 1)
   * @param numRings - Number of concentric rings to create
   * @param baseRadius - Starting radius for the innermost ring
   * @param radiusStep - How much to increase the radius for each ring
   * @param baseStrength - Strength of the innermost ring
   * @param strengthDecay - How much to reduce strength for each outer ring (0-1)
   * @param delayBetweenRings - Optional delay in milliseconds between ring creation
   */
  public addRingWaves(
    x: number,
    y: number,
    numRings: number = 5,
    baseRadius: number = 0.03,
    radiusStep: number = 0.04,
    baseStrength: number = 0.04,
    strengthDecay: number = 0.2,
    delayBetweenRings: number = 0
  ): void {
    // If no delay, create all rings immediately
    if (delayBetweenRings <= 0) {
      for (let i = 0; i < numRings; i++) {
        // Calculate ring parameters with decay
        const radius = baseRadius + radiusStep * i;
        const strength = baseStrength * Math.pow(1 - strengthDecay, i);

        // Create the ring as a water drop with calculated parameters
        this.addDrop(x, y, radius, strength);
      }
    } else {
      // Create rings with delay between them
      for (let i = 0; i < numRings; i++) {
        setTimeout(() => {
          // Calculate ring parameters with decay
          const radius = baseRadius + radiusStep * i;
          const strength = baseStrength * Math.pow(1 - strengthDecay, i);

          // Create the ring as a water drop
          this.addDrop(x, y, radius, strength);
        }, i * delayBetweenRings);
      }
    }
  }

  /**
   * Creates an expanding ring effect that starts small and grows over time
   *
   * @param x - X position in normalized coordinates (-1 to 1)
   * @param y - Y position in normalized coordinates (-1 to 1)
   * @param duration - Duration of the effect in milliseconds
   * @param finalRadius - Maximum radius the ring will reach
   * @param strength - Strength of the ring wave
   * @param framesPerSecond - How many ring updates per second
   */
  public addExpandingRingWave(
    x: number,
    y: number,
    duration: number = 1000,
    finalRadius: number = 0.5,
    strength: number = 0.03,
    framesPerSecond: number = 30
  ): void {
    const totalFrames = (duration / 1000) * framesPerSecond;
    const radiusStep = finalRadius / totalFrames;
    const frameDuration = 1000 / framesPerSecond;

    let currentRadius = 0.01; // Start with a small radius
    let frameCount = 0;

    // Create expanding ring using intervals
    const intervalId = setInterval(() => {
      // Add a ring with current radius
      this.addDrop(x, y, currentRadius, strength);

      // Increase radius for next frame
      currentRadius += radiusStep;
      frameCount++;

      // Stop when we reach the desired duration
      if (frameCount >= totalFrames) {
        clearInterval(intervalId);
      }
    }, frameDuration);
  }

  /**
   * Creates multiple sets of concentric waves across the surface
   * Useful for rain effects or multiple impact points
   *
   * @param count - Number of wave sets to create
   * @param ringsPerSet - Number of rings in each set
   * @param baseRadius - Starting radius for rings
   * @param baseStrength - Strength of the waves
   */
  public addRandomWaveSets(
    count: number = 5,
    ringsPerSet: number = 3,
    baseRadius: number = 0.03,
    baseStrength: number = 0.02
  ): void {
    for (let i = 0; i < count; i++) {
      // Create random positions across the surface (-1 to 1)
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;

      // Random variations for each set
      const radiusVariation = 0.5 + Math.random(); // 0.5 to 1.5
      const strengthVariation = 0.5 + Math.random(); // 0.5 to 1.5

      // Create a set of rings at this position
      this.addRingWaves(
        x,
        y,
        ringsPerSet,
        baseRadius * radiusVariation,
        baseRadius * 1.5,
        baseStrength * strengthVariation,
        0.2,
        0 // No delay between rings in the same set
      );
    }
  }

  /**
   * Creates a wave pattern like the one shown in the reference image
   * with multiple concentric rings that have varying intensities
   *
   * @param x - X position in normalized coordinates (-1 to 1)
   * @param y - Y position in normalized coordinates (-1 to 1)
   * @param pattern - Pattern type (1-5 corresponding to different patterns)
   */
  public addPatternedWaves(x: number, y: number, pattern: number = 1): void {
    // Different patterns matching the 5 examples in the image
    switch (pattern) {
      case 1: // Smooth concentric circles
        this.addRingWaves(x, y, 8, 0.03, 0.04, 0.03, 0.1);
        break;

      case 2: // Increasing density rings
        for (let i = 0; i < 10; i++) {
          const radius = 0.02 + i * i * 0.003;
          const strength = 0.03 * (1 - i * 0.08);
          this.addDrop(x, y, radius, strength);
        }
        break;

      case 3: // Ripple pattern
        for (let i = 0; i < 15; i++) {
          const radius = 0.02 + i * 0.03;
          // Alternate positive and negative to create ripple effect
          const strength = (i % 2 === 0 ? 0.03 : -0.03) * (1 - i * 0.05);
          this.addDrop(x, y, radius, strength);
        }
        break;

      case 4: // Chaotic/noise pattern
        for (let i = 0; i < 30; i++) {
          // Random points near the center position
          const offsetX = Math.random() * 0.4 - 0.2;
          const offsetY = Math.random() * 0.4 - 0.2;
          const radius = 0.01 + Math.random() * 0.04;
          const strength = Math.random() > 0.5 ? 0.02 : -0.02;
          this.addDrop(x + offsetX, y + offsetY, radius, strength);
        }
        break;

      case 5: // Smooth outward pattern
        // Start with a large negative drop to create a depression
        this.addDrop(x, y, 0.1, -0.05);

        // Then add progressively smaller positive rings
        for (let i = 0; i < 8; i++) {
          const radius = 0.15 + i * 0.05;
          const strength = 0.02 * Math.pow(0.85, i);
          this.addDrop(x, y, radius, strength);
        }
        break;

      default:
        // Default to simple concentric circles
        this.addRingWaves(x, y, 5, 0.03, 0.05, 0.04, 0.15);
    }
  }

  /**
   * Updates the resolution uniform if the canvas size changes
   */
  public updateResolution(width: number, height: number): void {
    this._gameWidth = width;
    this._gameHeight = height;
  }

  /**
   * Handle game events by creating water effects
   */
  public handleGameEvent(event: GameEventData): boolean {
    if (!event.position) return false;

    // Convert from game coordinates to [-1,1] range
    const x = event.position.x / this._gameWidth / 2;
    const y = event.position.y / this._gameHeight / 2;

    switch (event.type) {
      case GameEventType.BALL_COLLISION:
        // Use a patterned wave for ball collision
        this.addPatternedWaves(x, y, 1);
        return true;

      case GameEventType.BRICK_DESTROYED:
        // Use expanding ring for brick destruction
        this.addExpandingRingWave(x, y, 1000, 0.2, 0.05);
        return true;

      case GameEventType.PADDLE_HIT:
        // Use multiple rings for paddle hit
        this.addRingWaves(x, y, 8, 0.03, 0.04, 0.04, 0.1);
        return true;

      default:
        return false;
    }
  }

  /**
   * Check if this material can handle the specified event type
   */
  public canHandleEvent(): boolean {
    return true; // Can handle any event type
  }

  /**
   * Override the update method from PlaneMaterial to include water simulation and handle events
   */
  public override update(params?: any): { updatedUniforms: string[] } {
    // First call parent update method to handle standard PlaneMaterial uniforms
    const result = super.update(params);

    // Handle water-specific parameters
    if (params) {
      // Update multiple laser parameters
      if (params.laserIntensities !== undefined) {
        this.uniforms.laserIntensities.value = params.laserIntensities;
        result.updatedUniforms.push("laserIntensities");
      }

      if (params.laserWidths !== undefined) {
        this.uniforms.laserWidths.value = params.laserWidths;
        result.updatedUniforms.push("laserWidths");
      }

      if (params.laserColors !== undefined) {
        // Convert from THREE.Color array to Vector3 array
        this.uniforms.laserColors.value = params.laserColors.map(
          (color: THREE.Color) => new THREE.Vector3(color.r, color.g, color.b)
        );
        result.updatedUniforms.push("laserColors");
      }

      if (params.laserOrigins !== undefined) {
        this.uniforms.laserOrigins.value = params.laserOrigins.map(
          (origin: THREE.Vector3) => origin.clone()
        );
        result.updatedUniforms.push("laserOrigins");
      }

      if (params.laserDirections !== undefined) {
        this.uniforms.laserDirections.value = params.laserDirections.map(
          (dir: THREE.Vector3) => dir.clone().normalize()
        );
        result.updatedUniforms.push("laserDirections");
      }

      if (params.activeLasers !== undefined) {
        this.uniforms.activeLasers.value = params.activeLasers;
        result.updatedUniforms.push("activeLasers");
      }

      // Pool light parameters remain the same
      if (params.poolLightIntensity !== undefined) {
        this.uniforms.poolLightIntensity.value = params.poolLightIntensity;
        result.updatedUniforms.push("poolLightIntensity");
      }

      if (params.poolLightRadius !== undefined) {
        this.uniforms.poolLightRadius.value = params.poolLightRadius;
        result.updatedUniforms.push("poolLightRadius");
      }
    }

    // Check if a timed event was triggered via the GUI
    if (params && params.triggerTimedEvent && params.triggerTimedEvent > 0) {
      // Create a splash pattern of drops when event is triggered
      console.log("Water event triggered! Creating drops...");

      // Create a ring of smaller drops around it
      const numDrops = 8; // Number of drops in the ring
      const radius = 0.2; // Distance from center

      // for (let i = 0; i < numDrops; i++) {
      //   const angle = (i / numDrops) * Math.PI * 2;
      //   const x = Math.cos(angle) * radius;
      //   const y = Math.sin(angle) * radius;
      //   this.addDrop(x, y, 0.03, 0.54);
      // }

      // this.addDrop(0, 0, 0.06, 0.84);

      // Add some random drops as well
      // for (let i = 0; i < 5; i++) {
      //   const x = (Math.random() * 2 - 1) * 0.5; // Random position in [-0.5, 0.5]
      //   const y = (Math.random() * 2 - 1) * 0.5; // Random position in [-0.5, 0.5]
      //   const size = 0.02 + Math.random() * 0.02; // Random size between 0.02 and 0.04
      //   const strength =
      //     (Math.random() > 0.5 ? 1 : -1) * (0.01 + Math.random() * 0.02); // Random strength
      //   this.addDrop(x, y, size, strength);
      // }
      console.log(params.event);
      this.addPatternedWaves(0, 0, params.event);
      // switch (params.event) {
      //   case 1:
      //     this.handleGameEvent({
      //       type: GameEventType.BALL_COLLISION,
      //       position: { x: 0.0, y: 0.0 },
      //     });
      //     break;

      //   case 2:
      //     this.handleGameEvent({
      //       type: GameEventType.BRICK_DESTROYED,
      //       position: { x: 0.0, y: 0.0 },
      //     });
      //     break;

      //   case 3:
      //     this.handleGameEvent({
      //       type: GameEventType.PADDLE_HIT,
      //       position: { x: 0.0, y: 0.0 },
      //     });
      //     break;
      // }
    }

    // Then update water simulation
    this.updateWaterSimulation();

    // Add water-specific updated uniforms
    result.updatedUniforms.push("water", "causticTex");

    return result;
  }

  /**
   * Update the water simulation for the current frame
   */
  private updateWaterSimulation(): void {
    // Step the water simulation
    this._waterSimulation.stepSimulation(this._renderer);
    this._waterSimulation.updateNormals(this._renderer);

    this._caustics.update(this._renderer, this._waterSimulation.texture);

    // Safely set the laser uniforms
    this._caustics.setLaserUniforms(
      this.uniforms.laserOrigins?.value || [],
      this.uniforms.laserDirections?.value || [],
      this.uniforms.activeLasers?.value || 0
    );

    // Update the uniforms
    this._water = this._waterSimulation.texture.texture;
    this._causticTex = this._caustics.texture.texture;
    this.uniforms.water.value = this._water;
    this.uniforms.causticTex.value = this._causticTex;
  }

  /**
   * Clean up resources
   */
  public override dispose(): void {
    super.dispose();
    this._waterSimulation.dispose();
    this._caustics.dispose();
  }
}
