import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class TexturedRoundedPaddle {
  private _renderer: THREE.WebGLRenderer;
  private _scene: THREE.Scene;

  constructor(
    rendered: THREE.WebGLRenderer,
    scene: THREE.Scene,
    position?: THREE.Vector3
  ) {
    this._renderer = rendered;
    this._scene = scene;
    this.loadPaddle(
      "PulsatingRoundedPaddle",
      position ?? new THREE.Vector3(0, 0, 0)
    );
    this.setEnvironmentMap();
  }

  private loadPaddle(name: string, position: THREE.Vector3): void {
    new GLTFLoader().load(
      "/assets/models/rounded_paddle.glb",
      (gltf) => {
        // Find the original paddle mesh
        const originalMesh = gltf.scene.children.find(
          (child) => child.name === "Paddle"
        ) as THREE.Mesh;

        if (originalMesh && originalMesh.isObject3D) {
          const material = new THREE.MeshStandardMaterial({
            roughness: 0.5,
            metalness: 1.0,
            envMapIntensity: 1.0,
            color: new THREE.Color("#90BDC3"),
          });

          originalMesh.name = name;
          originalMesh.material = material;
          originalMesh.position.set(position.x, position.y, position.z);
          originalMesh.material.needsUpdate = true;
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

  private setEnvironmentMap() {
    if (!this.scene) {
      return;
    }
    // If you don't have an envmap, you can use this alternative:
    const envMap = new THREE.PMREMGenerator(this._renderer).fromScene(
      new THREE.Scene()
    ).texture;

    this.scene.environment = envMap;
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
}
