// materials/water/debug.ts
import * as THREE from "three";
import vertexShader from "../../glsl/water/debug/vertex.glsl";
import fragmentShader from "../../glsl/water/debug/fragment.glsl";
import { stripVersion } from "../MaterialUtils";

export class Debug {
  private _camera: THREE.OrthographicCamera;
  private _geometry: THREE.PlaneGeometry;
  private _material: THREE.RawShaderMaterial;
  private _mesh: THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.RawShaderMaterial,
    THREE.Object3DEventMap
  >;

  constructor() {
    this._camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 1);
    this._geometry = new THREE.PlaneGeometry();

    this._material = new THREE.RawShaderMaterial({
      uniforms: {
        mainTexture: { value: null },
      },
      vertexShader: stripVersion(vertexShader),
      fragmentShader: stripVersion(fragmentShader),
      glslVersion: THREE.GLSL3, // Explicitly use GLSL3 for WebGL2
    });

    this._mesh = new THREE.Mesh(this._geometry, this._material);
  }

  draw(
    renderer: THREE.WebGLRenderer,
    texture: THREE.WebGLRenderTarget<THREE.Texture>
  ) {
    this._material.uniforms["mainTexture"].value = texture;

    renderer.setRenderTarget(null);
    renderer.render(this._mesh, this._camera);
  }
}
