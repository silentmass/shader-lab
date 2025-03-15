// materials/water/caustics.ts
import * as THREE from "three";
import causticsVertexShader from "../../glsl/water/caustics/caustics.vert";
import causticsFragmentShader from "../../glsl/water/caustics/caustics.frag";
import { stripVersion } from "../MaterialUtils";

export class Caustics {
  private _camera: THREE.OrthographicCamera;
  private _geometry: THREE.BufferGeometry;
  public texture: THREE.WebGLRenderTarget;
  private _causticMesh: THREE.Mesh;

  constructor(geometry: THREE.BufferGeometry, light: THREE.Vector3) {
    this._camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 2000);
    this._geometry = geometry.clone();

    this.texture = new THREE.WebGLRenderTarget(1024, 1024);

    // Properly initialize all uniforms
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        light: { value: light },
        water: { value: null },
        // For laser caustics
        laserOrigins: {
          value: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
          ],
        },
        laserDirections: {
          value: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
          ],
        },
        activeLasers: { value: 0 },
      },
      vertexShader: stripVersion(causticsVertexShader),
      fragmentShader: stripVersion(causticsFragmentShader),
      glslVersion: THREE.GLSL3,
    });

    this._causticMesh = new THREE.Mesh(this._geometry, material);
  }

  // Add this method to your Caustics class
  public setLaserUniforms(
    origins?: any[],
    directions?: any[],
    active?: number
  ) {
    const material = this._causticMesh.material as THREE.RawShaderMaterial;

    // Safely set the origins
    if (origins && Array.isArray(origins) && origins.length > 0) {
      // Make sure all items are Vector3 objects
      material.uniforms.laserOrigins.value = origins.map((origin) =>
        origin instanceof THREE.Vector3 ? origin : new THREE.Vector3(0, 0, 0)
      );
    }

    // Safely set the directions
    if (directions && Array.isArray(directions) && directions.length > 0) {
      // Make sure all items are Vector3 objects
      material.uniforms.laserDirections.value = directions.map((dir) =>
        dir instanceof THREE.Vector3 ? dir : new THREE.Vector3(0, 0, 0)
      );
    }

    // Safely set active lasers count
    if (typeof active === "number") {
      material.uniforms.activeLasers.value = active;
    }
  }

  update(renderer: THREE.WebGLRenderer, waterTexture: THREE.WebGLRenderTarget) {
    (this._causticMesh.material as THREE.RawShaderMaterial).uniforms[
      "water"
    ].value = waterTexture.texture;

    const currentRenderTarget = renderer.getRenderTarget();
    const currentClearColor = renderer.getClearColor(new THREE.Color());
    const currentClearAlpha = renderer.getClearAlpha();

    renderer.setRenderTarget(this.texture);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(this._causticMesh, this._camera);

    renderer.setRenderTarget(currentRenderTarget);
    renderer.setClearColor(currentClearColor, currentClearAlpha);
  }

  dispose() {
    this.texture.dispose();
    this._geometry.dispose();

    // Properly type-check and dispose of material
    if (this._causticMesh.material instanceof THREE.Material) {
      this._causticMesh.material.dispose();
    } else if (Array.isArray(this._causticMesh.material)) {
      this._causticMesh.material.forEach((mat) => mat.dispose());
    }
  }
}
