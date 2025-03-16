// materials/water/waterSimulation.ts
import * as THREE from "three";

import simulationVertexShader from "../../glsl/water/simulation/simulation.vert";
import dropFragmentShader from "../../glsl/water/simulation/drop.frag";
import normalFragmentShader from "../../glsl/water/simulation/normal.frag";
import updateFragmentShader from "../../glsl/water/simulation/update.frag";
import { stripVersion } from "../MaterialUtils";

export const DEFAULT_WATER_SIMULATION_UPDATE_UNIFORMS = {
  waterTexture: null,
  waveSpeed: 0.2,
  wavePersistence: 0.985,
  waveBaselineCorrection: 0.01,
};

interface WaterSimulationUpdateUniforms {
  waterTexture?: THREE.Texture | null;
  waveSpeed?: number;
  wavePersistence?: number;
  waveBaselineCorrection?: number;
}

interface WaterSimulationOptions {
  update?: { uniforms?: WaterSimulationUpdateUniforms };
}

export default class WaterSimulation {
  private _camera: THREE.OrthographicCamera;
  private _geometry: THREE.PlaneGeometry;
  private _textureA: THREE.WebGLRenderTarget;
  private _textureB: THREE.WebGLRenderTarget;
  private _renderTarget: THREE.WebGLRenderTarget;
  private _dropMesh: THREE.Mesh;
  private _normalMesh: THREE.Mesh;
  private _updateMesh: THREE.Mesh;

  private _waterTexture: THREE.Texture | null;
  private _waveSpeed: number;
  private _wavePersistence: number;
  private _waveBaselineCorrection: number;

  constructor(options: WaterSimulationOptions = {}) {
    this._camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 2000);
    this._geometry = new THREE.PlaneGeometry(2, 2);

    // Create render targets for ping-pong rendering
    this._textureA = new THREE.WebGLRenderTarget(256, 256, {
      type: THREE.FloatType,
    });
    this._textureB = new THREE.WebGLRenderTarget(256, 256, {
      type: THREE.FloatType,
    });
    this._renderTarget = this._textureA;

    const waterSimulationUpdateUniforms = options.update?.uniforms || {};

    this._waterTexture =
      waterSimulationUpdateUniforms.waterTexture ||
      DEFAULT_WATER_SIMULATION_UPDATE_UNIFORMS.waterTexture;
    this._waveSpeed =
      waterSimulationUpdateUniforms.waveSpeed ??
      DEFAULT_WATER_SIMULATION_UPDATE_UNIFORMS.waveSpeed;
    this._wavePersistence =
      waterSimulationUpdateUniforms.wavePersistence ??
      DEFAULT_WATER_SIMULATION_UPDATE_UNIFORMS.wavePersistence;
    this._waveBaselineCorrection =
      waterSimulationUpdateUniforms.waveBaselineCorrection ??
      DEFAULT_WATER_SIMULATION_UPDATE_UNIFORMS.waveBaselineCorrection;

    // Create drop shader - adds drops to water
    const dropMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        center: { value: new THREE.Vector2(0.0, 0.0) },
        radius: { value: 0.0 },
        strength: { value: 0.0 },
        uWaterTexture: { value: null },
      },
      vertexShader: stripVersion(simulationVertexShader),
      fragmentShader: stripVersion(dropFragmentShader),
      glslVersion: THREE.GLSL3,
    });

    // Normal shader - updates normals based on heights
    const normalMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        uWaterTexture: { value: null },
      },
      vertexShader: stripVersion(simulationVertexShader),
      fragmentShader: stripVersion(normalFragmentShader),
      glslVersion: THREE.GLSL3,
    });

    // Update shader - propagates waves
    const updateMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        uWaterTexture: { value: this._waterTexture },
        uWaveSpeed: { value: this._waveSpeed },
        uWavePersistence: { value: this._wavePersistence },
        uWaveBaselineCorrection: { value: this._waveBaselineCorrection },
      },
      vertexShader: stripVersion(simulationVertexShader),
      fragmentShader: stripVersion(updateFragmentShader),
      glslVersion: THREE.GLSL3,
    });

    this._dropMesh = new THREE.Mesh(this._geometry, dropMaterial);
    this._normalMesh = new THREE.Mesh(this._geometry, normalMaterial);
    this._updateMesh = new THREE.Mesh(this._geometry, updateMaterial);

    // Initialize the height field with some random drops
    // This will be done later in the material
  }

  // Add a drop of water at the (x, y) coordinate (in the range [-1, 1])
  addDrop(
    renderer: THREE.WebGLRenderer,
    x: number,
    y: number,
    radius: number,
    strength: number
  ) {
    (this._dropMesh.material as THREE.ShaderMaterial).uniforms[
      "center"
    ].value.set(x, y);
    (this._dropMesh.material as THREE.ShaderMaterial).uniforms["radius"].value =
      radius;
    (this._dropMesh.material as THREE.ShaderMaterial).uniforms[
      "strength"
    ].value = strength;

    this._render(renderer, this._dropMesh);
  }

  stepSimulation(renderer: THREE.WebGLRenderer) {
    this._render(renderer, this._updateMesh);
  }

  updateNormals(renderer: THREE.WebGLRenderer) {
    this._render(renderer, this._normalMesh);
  }

  _render(renderer: THREE.WebGLRenderer, mesh: THREE.Mesh) {
    // Swap textures
    const oldTexture = this.renderTarget;
    const newTexture =
      this.renderTarget === this._textureA ? this._textureB : this._textureA;

    // Check which uniform name is being used in this material
    const material = mesh.material as THREE.RawShaderMaterial;

    // Set the appropriate uniform - try both mainTexture and texture
    material.uniforms["uWaterTexture"].value = oldTexture.texture;

    const currentRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(newTexture);
    renderer.render(mesh, this._camera);
    renderer.setRenderTarget(currentRenderTarget);

    this.renderTarget = newTexture;
  }

  private set renderTarget(target: THREE.WebGLRenderTarget) {
    this._renderTarget = target;
  }

  public get renderTarget(): THREE.WebGLRenderTarget {
    return this._renderTarget;
  }

  public get texture(): THREE.Texture {
    return this.renderTarget.texture;
  }

  /**
   * Sets the wave propagation speed
   * @param speed - Higher values make waves move faster across the surface
   */
  public setWaveSpeed(speed: number): void {
    this._waveSpeed = speed;
    const material = this._updateMesh.material as THREE.RawShaderMaterial;
    if (material.uniforms["uWaveSpeed"]) {
      material.uniforms["uWaveSpeed"].value = speed;
    }
  }

  /**
   * Sets how quickly waves lose amplitude (persistence)
   * @param persistence - Values close to 1.0 make waves last longer
   */
  public setWavePersistence(persistence: number): void {
    this._wavePersistence = persistence;
    const material = this._updateMesh.material as THREE.RawShaderMaterial;
    if (material.uniforms["uWavePersistence"]) {
      material.uniforms["uWavePersistence"].value = persistence;
    }
  }

  /**
   * Sets how quickly the water surface returns to a flat state
   * @param correction - Small values (0.0001-0.001) allow waves to persist longer
   */
  public setWaveBaselineCorrection(correction: number): void {
    this._waveBaselineCorrection = correction;
    const material = this._updateMesh.material as THREE.RawShaderMaterial;
    if (material.uniforms["uWaveBaselineCorrection"]) {
      material.uniforms["uWaveBaselineCorrection"].value = correction;
    }
  }

  dispose() {
    this._textureA.dispose();
    this._textureB.dispose();
    this._geometry.dispose();

    // Properly type-check and dispose of materials
    if (this._dropMesh.material instanceof THREE.Material) {
      this._dropMesh.material.dispose();
    } else if (Array.isArray(this._dropMesh.material)) {
      this._dropMesh.material.forEach((mat) => mat.dispose());
    }

    if (this._normalMesh.material instanceof THREE.Material) {
      this._normalMesh.material.dispose();
    } else if (Array.isArray(this._normalMesh.material)) {
      this._normalMesh.material.forEach((mat) => mat.dispose());
    }

    if (this._updateMesh.material instanceof THREE.Material) {
      this._updateMesh.material.dispose();
    } else if (Array.isArray(this._updateMesh.material)) {
      this._updateMesh.material.forEach((mat) => mat.dispose());
    }
  }
}
