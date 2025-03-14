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
import { PlaneMaterial } from "../PlaneMaterial";
import { stripVersion } from "../MaterialUtils.ts";

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

  /**
   * Create a new water shader material
   */
  constructor(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    options: {
      width?: number;
      height?: number;
      geometry?: THREE.BufferGeometry;
    } = {}
  ) {
    // Store game dimensions for coordinate conversion
    const gameWidth = options.width || window.innerWidth;
    const gameHeight = options.height || window.innerHeight;

    // Light direction
    // const light = new THREE.Vector3(
    //   // -0.7559289460184544,
    //   // 0.0,
    //   // 0.7559289460184544,
    //   0.0,
    //   0.9,
    //   // -0.3779644730092272
    //   0.0
    // );

    // In waterShaderMaterial.ts
    // In your waterShaderMaterial.ts:
    const light = new THREE.Vector3(
      0.0,
      0.9, // Higher y value for more top-down lighting
      0.0
    ).normalize();

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
      stripVersion(waterWaterFragmentShader)
    );

    const defaultLasers = [
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
    ];

    // Override some material properties
    this.side = THREE.BackSide;

    // Store renderer and resources
    this._renderer = renderer;
    this._camera = camera;
    this._light = light;
    this._gameWidth = gameWidth;
    this._gameHeight = gameHeight;
    this._tiles = tiles;

    // Add water-specific uniforms after calling super()
    this.uniforms.light = { value: light };
    this.uniforms.tiles = { value: tiles };
    this.uniforms.sky = { value: sky };
    this.uniforms.water = { value: null };
    this.uniforms.causticTex = { value: null };
    this.uniforms.underwater = { value: 0.0 };

    // In waterShaderMaterial.ts, add new uniforms:
    this.uniforms.laserOrigins = {
      value: defaultLasers.map((laser) => laser.origin),
    };
    this.uniforms.laserDirections = {
      value: defaultLasers.map((laser) => laser.direction),
    };
    this.uniforms.laserColors = {
      value: defaultLasers.map((laser) => laser.color),
    };
    this.uniforms.laserIntensities = {
      value: defaultLasers.map((laser) => laser.intensity),
    };
    this.uniforms.laserWidths = {
      value: defaultLasers.map((laser) => laser.width),
    };
    this.uniforms.activeLasers = { value: defaultLasers.length };

    const poolHeight = 1.0;
    // const poolHeight = 0.1;

    // In waterShaderMaterial.ts, add new uniforms:
    this.uniforms.poolLights = {
      value: [
        new THREE.Vector3(-0.5, -poolHeight, -0.5), // Bottom left
        new THREE.Vector3(0.5, -poolHeight, -0.5), // Bottom right
        new THREE.Vector3(-0.5, -poolHeight, 0.5), // Top left
        new THREE.Vector3(0.5, -poolHeight, 0.5), // Top right
      ],
    };

    this.uniforms.poolLightColors = {
      value: [
        new THREE.Vector3(0.0, 0.5, 1.0), // Blue
        new THREE.Vector3(0.0, 1.0, 0.5), // Green-cyan
        new THREE.Vector3(1.0, 0.5, 0.0), // Orange
        new THREE.Vector3(0.8, 0.0, 0.8), // Purple
      ],
    };

    this.uniforms.poolLightIntensity = { value: 1.5 };
    this.uniforms.poolLightRadius = { value: 0.4 };

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
    this._caustics.update(this._renderer, this._waterSimulation.texture);

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
        // Single drop for ball collision
        this.addDrop(x, y, 0.03, 0.04);
        return true;

      case GameEventType.BRICK_DESTROYED:
        // Multiple drops for brick destruction
        this.addDrop(x, y, 0.05, 0.08);
        // Add smaller drops around it
        const dropDistance = 0.05;
        this.addDrop(x + dropDistance, y, 0.02, 0.03);
        this.addDrop(x - dropDistance, y, 0.02, 0.03);
        this.addDrop(x, y + dropDistance, 0.02, 0.03);
        this.addDrop(x, y - dropDistance, 0.02, 0.03);
        return true;

      case GameEventType.PADDLE_HIT:
        // Wide ripple for paddle
        this.addDrop(x, y, 0.08, 0.03);
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

      this.addDrop(0, 0, 0.06, 0.84);

      // Add some random drops as well
      // for (let i = 0; i < 5; i++) {
      //   const x = (Math.random() * 2 - 1) * 0.5; // Random position in [-0.5, 0.5]
      //   const y = (Math.random() * 2 - 1) * 0.5; // Random position in [-0.5, 0.5]
      //   const size = 0.02 + Math.random() * 0.02; // Random size between 0.02 and 0.04
      //   const strength =
      //     (Math.random() > 0.5 ? 1 : -1) * (0.01 + Math.random() * 0.02); // Random strength
      //   this.addDrop(x, y, size, strength);
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

    // Update the caustics
    this._caustics.update(this._renderer, this._waterSimulation.texture);

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
