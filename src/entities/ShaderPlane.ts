import * as THREE from "three";
import { PlaneMaterial } from "../materials/PlaneMaterial";

export class ShaderPlane {
  private _renderer: THREE.WebGLRenderer;
  private _scene: THREE.Scene;
  private _plane: THREE.Mesh | null = null;

  constructor(
    rendered: THREE.WebGLRenderer,
    scene: THREE.Scene,
    material: PlaneMaterial,
    position?: THREE.Vector3
  ) {
    this._renderer = rendered;
    this._scene = scene;
    this.setupPlane(
      "ShaderPlane",
      material,
      position ?? new THREE.Vector3(0, 0, 0)
    );
  }

  private setupPlane(
    name: string,
    material: PlaneMaterial,
    position: THREE.Vector3
  ): void {
    const geometry = new THREE.PlaneGeometry(1, 1);
    this.plane = new THREE.Mesh(geometry, material);
    this.plane.name = name;
    this.plane.position.set(position.x, position.y, position.z);
    this.scene.add(this.plane);
  }

  public get renderer() {
    return this._renderer;
  }

  public set renderer(renderer: THREE.WebGLRenderer) {
    this._renderer = renderer;
  }

  public get scene() {
    return this._scene;
  }

  public set scene(scene: THREE.Scene) {
    this._scene = scene;
  }

  public get plane() {
    return this._plane;
  }

  public set plane(plane: THREE.Mesh | null) {
    this._plane = plane;
  }
}
