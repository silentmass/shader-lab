// materials/water/pool.ts
import * as THREE from "three";
import vertexShader from "../../glsl/water/pool/vertex_glsl3.glsl";
import fragmentShader from "../../glsl/water/pool/fragment_glsl3.glsl";

export class Pool {
  private _geometry: THREE.BufferGeometry;
  private _material: THREE.RawShaderMaterial;
  private _mesh: THREE.Mesh;
  constructor(light: THREE.Vector3, tiles: THREE.Texture) {
    this._geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1,
      1, 1, 1, -1, -1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1, 1, -1, -1, 1, 1,
      1, 1, -1, 1, 1, 1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, -1, 1,
      1, -1, 1, -1, 1, 1, 1, 1, 1,
    ]);
    const indices = new Uint32Array([
      0, 1, 2, 2, 1, 3, 4, 5, 6, 6, 5, 7, 12, 13, 14, 14, 13, 15, 16, 17, 18,
      18, 17, 19, 20, 21, 22, 22, 21, 23,
    ]);

    this._geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );
    this._geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    this._material = new THREE.RawShaderMaterial({
      uniforms: {
        light: { value: light },
        tiles: { value: tiles },
        water: { value: null },
        causticTex: { value: null },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      glslVersion: THREE.GLSL3,
    });

    this._material.side = THREE.FrontSide;

    this._mesh = new THREE.Mesh(this._geometry, this._material);
  }

  update(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    waterTexture: THREE.WebGLRenderTarget,
    causticsTexture: THREE.Texture
  ) {
    this._material.uniforms["water"].value = waterTexture;
    this._material.uniforms["causticTex"].value = causticsTexture;

    renderer.render(this._mesh, camera);
  }
}
