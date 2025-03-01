import * as THREE from "three";
import vertexShader from "../glsl/test-shader/main2.vert";
import fragmentShader from "../glsl/test-shader/main2.frag";
import { stripVersion } from "./MaterialUtils";

export class TestMaterial extends THREE.RawShaderMaterial {
  private _clock: THREE.Clock;

  constructor() {
    super({
      uniforms: {
        uTime: { value: 1.0 },
        uColor: { value: new THREE.Color(0x00cccc) },
        // baseColor: { value: new THREE.Color("red") },
      },
      vertexShader: stripVersion(vertexShader),
      fragmentShader: stripVersion(fragmentShader),
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
