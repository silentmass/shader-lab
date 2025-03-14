import * as THREE from "three";

import vertexShader from "../../glsl/water/water/vertex_glsl3.glsl";
import fragmentShader from "../../glsl/water/water/fragment_glsl3.glsl";

export class Water {
  private renderer: THREE.WebGLRenderer;
  private _geometry: THREE.BufferGeometry;
  private _sky: THREE.CubeTexture;
  private _light: THREE.Vector3;
  private _underwater: boolean = false;
  private _side: number;
  public waterMesh: THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.RawShaderMaterial,
    THREE.Object3DEventMap
  >;
  private _clock: THREE.Clock;
  constructor(
    renderer: THREE.WebGLRenderer,
    geometry: THREE.BufferGeometry,
    light: THREE.Vector3,
    tiles: THREE.Texture
  ) {
    this.renderer = renderer;

    this._geometry = geometry.clone();
    const sky = new THREE.CubeTextureLoader().load([
      "assets/images/water/xpos.jpg",
      "assets/images/water/xneg.jpg",
      "assets/images/water/ypos.jpg",
      "assets/images/water/yneg.jpg",
      "assets/images/water/zpos.jpg",
      "assets/images/water/zneg.jpg",
    ]);
    const side = THREE.BackSide;
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        light: { value: light },
        tiles: { value: tiles },
        sky: { value: sky },
        water: { value: null },
        causticTex: { value: null },
        underwater: { value: 0.0 },
        uTime: { value: 0.0 },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      glslVersion: THREE.GLSL3,
      side: side,
    });

    this.waterMesh = new THREE.Mesh(this._geometry, material);

    this._sky = sky;
    this._light = light;
    this._side = side;
    this._clock = new THREE.Clock();
  }

  public update(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    waterSimulationTexture: THREE.Texture,
    causticsTexture: THREE.Texture
  ): void {
    this.waterMesh.material.uniforms.uTime.value = this._clock.getElapsedTime();
    this.waterMesh.material.uniforms.water.value = waterSimulationTexture;
    this.waterMesh.material.uniforms.causticTex.value = causticsTexture;

    // const currentRenderTarget = renderer.getRenderTarget();
    // const currentClearColor = renderer.getClearColor(new THREE.Color());
    // const currentClearAlpha = renderer.getClearAlpha();

    // renderer.setRenderTarget(this.texture);
    // renderer.setClearColor(0x000000, 0);
    // renderer.clear();
    // renderer.render(this.waterMesh, camera);

    // renderer.setRenderTarget(currentRenderTarget);
    // renderer.setClearColor(currentClearColor, currentClearAlpha);
  }

  /**
   * Toggle between underwater and above-water view
   */
  public setUnderwater(underwater: boolean): void {
    this._underwater = underwater;
    this.waterMesh.material.uniforms.underwater.value = underwater ? 1.0 : 0.0;
    this._side = underwater ? THREE.FrontSide : THREE.BackSide;
  }

  /**
   * Get whether currently in underwater mode
   */
  public isUnderwater(): boolean {
    return this._underwater;
  }

  dispose() {
    // this.texture.dispose();
    this._geometry.dispose();

    // Properly type-check and dispose of material
    if (this.waterMesh.material instanceof THREE.Material) {
      this.waterMesh.material.dispose();
    }
  }
}
