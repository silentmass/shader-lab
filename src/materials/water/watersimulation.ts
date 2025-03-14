// materials/water/waterSimulation.ts
import * as THREE from "three";

import simulationVertexShader from "../../glsl/water/simulation/simulation.vert";
import dropFragmentShader from "../../glsl/water/simulation/drop.frag";
import normalFragmentShader from "../../glsl/water/simulation/normal.frag";
import updateFragmentShader from "../../glsl/water/simulation/update.frag";
import { stripVersion } from "../MaterialUtils";

export class WaterSimulation {
  private _camera: THREE.OrthographicCamera;
  private _geometry: THREE.PlaneGeometry;
  private _textureA: THREE.WebGLRenderTarget;
  private _textureB: THREE.WebGLRenderTarget;
  public texture: THREE.WebGLRenderTarget;
  private _dropMesh: THREE.Mesh;
  private _normalMesh: THREE.Mesh;
  private _updateMesh: THREE.Mesh;

  constructor() {
    this._camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 2000);
    this._geometry = new THREE.PlaneGeometry(2, 2);

    // Create render targets for ping-pong rendering
    this._textureA = new THREE.WebGLRenderTarget(256, 256, {
      type: THREE.FloatType,
    });
    this._textureB = new THREE.WebGLRenderTarget(256, 256, {
      type: THREE.FloatType,
    });
    this.texture = this._textureA;

    // Create drop shader - adds drops to water
    const dropMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        center: { value: new THREE.Vector2(0.0, 0.0) },
        radius: { value: 0.0 },
        strength: { value: 0.0 },
        mainTexture: { value: null },
      },
      vertexShader: stripVersion(simulationVertexShader),
      fragmentShader: stripVersion(dropFragmentShader),
      glslVersion: THREE.GLSL3,
    });

    // Normal shader - updates normals based on heights
    const normalMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        mainTexture: { value: null }, // Changed from 'water' to 'mainTexture'
      },
      vertexShader: stripVersion(simulationVertexShader),
      fragmentShader: stripVersion(normalFragmentShader),
      glslVersion: THREE.GLSL3,
    });

    // Update shader - propagates waves
    const updateMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        mainTexture: { value: null },
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
    const oldTexture = this.texture;
    const newTexture =
      this.texture === this._textureA ? this._textureB : this._textureA;

    // Check which uniform name is being used in this material
    const material = mesh.material as THREE.RawShaderMaterial;

    // Set the appropriate uniform - try both mainTexture and texture
    if (material.uniforms["mainTexture"] !== undefined) {
      material.uniforms["mainTexture"].value = oldTexture.texture;
    } else {
      // For debugging - check what uniforms are actually available
      console.error(
        "Uniform 'mainTexture' not found in material",
        material.uniforms,
        mesh
      );
    }

    const currentRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(newTexture);
    renderer.render(mesh, this._camera);
    renderer.setRenderTarget(currentRenderTarget);

    this.texture = newTexture;
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
