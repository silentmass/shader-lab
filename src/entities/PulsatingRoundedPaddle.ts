import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PlaneMaterial } from "../materials/PlaneMaterial";

export class PulsatingRoundedPaddle {
  private _renderer: THREE.WebGLRenderer;
  private _scene: THREE.Scene;
  private _paddle: THREE.Mesh | null = null;

  constructor(
    rendered: THREE.WebGLRenderer,
    scene: THREE.Scene,
    material: PlaneMaterial,
    position?: THREE.Vector3
  ) {
    this._renderer = rendered;
    this._scene = scene;
    this.setupPaddle(
      "PulsatingRoundedPaddle",
      material,
      position ?? new THREE.Vector3(0, 0, 0)
    );
  }

  private setupPaddle(
    name: string,
    material: PlaneMaterial,
    position: THREE.Vector3
  ): void {
    new GLTFLoader().load(
      "/assets/models/rounded_paddle.glb",
      (gltf) => {
        // Find the original paddle mesh
        const originalMesh = gltf.scene.children.find(
          (child) => child.name === "Paddle"
        ) as THREE.Mesh;

        if (originalMesh && originalMesh.isObject3D) {
          originalMesh.name = name;
          originalMesh.material = material;
          originalMesh.position.set(position.x, position.y, position.z);
          originalMesh.material.needsUpdate = true;
          this.paddle = originalMesh;
          this.scene.add(originalMesh);
        } else {
          console.error("Original paddle mesh not found or not a mesh");
        }
      },
      undefined,
      (error) => {
        console.error("Couldn't load model", error);
      }
    );
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

  public get paddle() {
    return this._paddle;
  }

  public set paddle(paddle: THREE.Mesh | null) {
    this._paddle = paddle;
  }
}
