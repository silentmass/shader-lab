import * as THREE from "three";
import vertexShader from "../glsl/test-shader/main2flash.vert";
import fragmentShader from "../glsl/test-shader/main2flash.frag";

export class TestMaterialFlash extends THREE.RawShaderMaterial {
  private _clock: THREE.Clock;

  constructor() {
    super({
      uniforms: {
        uTime: { value: 1.0 },
        uColor: { value: new THREE.Color(0x00cccc) },
        // baseColor: { value: new THREE.Color("red") },
      },
      vertexShader,
      fragmentShader,
      glslVersion: THREE.GLSL3,
      side: THREE.DoubleSide, // Render both sides
      transparent: true,
    });
    this._clock = new THREE.Clock();
    this._clock.start();
  }

  update() {
    this.uniforms.uTime.value = this._clock.getElapsedTime();
  }
}
