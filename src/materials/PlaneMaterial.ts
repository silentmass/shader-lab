import * as THREE from "three";
import vertexShader from "../glsl/plane-shader/main.vert";
// import fragmentShader from "../glsl/plane-shader/main.frag";
// import fragmentShader from "../glsl/plane-shader/gaussian.frag";
// import fragmentShader from "../glsl/plane-shader/stripes.frag";
import fragmentShader from "../glsl/plane-shader/concentricCircles.frag";
import { stripVersion } from "./MaterialUtils";

export class PlaneMaterial extends THREE.RawShaderMaterial {
  private _clock: THREE.Clock;

  constructor() {
    super({
      uniforms: {
        uTime: { value: 1.0 },
        uColor: { value: new THREE.Color(0x00cccc) },
        uBaseColor: { value: new THREE.Color("grey") },
        uRingsForegroundColor: { value: new THREE.Color("black") },
        uRingsBackgroundColor: { value: new THREE.Color("white") },
        uEvent: { value: 1 },
        uEventIntensity: { value: 1.0 },
        uStripeCount: { value: 40.0 },
        uSpeed: { value: new THREE.Vector2(-1.0, 0.0) },
        uAngle: { value: Math.PI / 1.0 },
      },
      vertexShader: stripVersion(vertexShader),
      fragmentShader: stripVersion(fragmentShader),
      glslVersion: THREE.GLSL3,
      side: THREE.DoubleSide,
      transparent: true,
    });
    this._clock = new THREE.Clock();
    this._clock.start();
  }

  update() {
    this.uniforms.uTime.value = this._clock.getElapsedTime();
  }
}
