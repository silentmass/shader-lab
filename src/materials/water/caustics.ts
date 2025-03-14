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

    // Change ShaderMaterial to RawShaderMaterial and fix the shaders
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        light: { value: light },
        water: { value: null },
      },
      vertexShader: stripVersion(causticsVertexShader),
      fragmentShader: stripVersion(causticsFragmentShader),
      glslVersion: THREE.GLSL3,
    });

    this._causticMesh = new THREE.Mesh(this._geometry, material);
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
