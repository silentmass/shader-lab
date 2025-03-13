import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PlaneMaterial } from "../materials/PlaneMaterial";
import { MeshSpecificUniforms } from "../MeshUniformsManager";

export class Brick {
  private _mesh: THREE.Mesh | null = null;
  private _renderer: THREE.WebGLRenderer;
  private _scene: THREE.Scene;
  private _material: PlaneMaterial;
  private _position: THREE.Vector3;
  private _onMeshCreated: ((mesh: THREE.Mesh) => void) | null = null;
  private _meshSpecificUniforms: MeshSpecificUniforms;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    material: PlaneMaterial,
    position: THREE.Vector3,
    onMeshCreated: ((mesh: THREE.Mesh) => void) | null = null,
    initialUniforms?: MeshSpecificUniforms // Add this parameter
  ) {
    this._renderer = renderer;
    this._scene = scene;
    this._material = material;
    this._position = position;
    this._onMeshCreated = onMeshCreated;

    // Pre-define mesh-specific uniforms that will be used both for registration
    // and for direct application to the material during initialization
    this._meshSpecificUniforms = {
      uGeometryCenter: position.clone().add(new THREE.Vector3(0.0, 0.5, 0.5)),
      uBarRingForegroundColor: new THREE.Color("#6A452F"),
      uBarRingBackgroundColor: new THREE.Color("#90BDC3"),
      uBaseColor: new THREE.Color("#2F646A"),
      ...(initialUniforms || {}),
    };

    // Apply mesh-specific uniforms to the material right away
    this.applyUniformsToMaterial(material);

    this.initialize();
  }

  private initialize(): void {
    new GLTFLoader().load(
      "/assets/models/brick.glb",
      (gltf) => {
        // Find the original paddle mesh
        const originalMesh = gltf.scene.children.find(
          (child) => child.name === "Brick"
        ) as THREE.Mesh;

        if (originalMesh && originalMesh.isObject3D) {
          this.mesh = originalMesh;
          this.mesh.name = "BrickMesh";
          this.mesh.position.copy(this.position);

          // Apply the material with the mesh-specific uniforms already set
          this.mesh.material = this.material;
          this.mesh.material.needsUpdate = true;
          this.scene.add(this.mesh);

          if (this._onMeshCreated && this.mesh) {
            // Pass the mesh to the callback for registration in the MeshUniformsManager
            this._onMeshCreated(this.mesh);
          }
        } else {
          console.error("Original brick mesh not found or not a mesh");
        }
      },
      undefined,
      (error) => {
        console.error("Couldn't load model", error);
      }
    );
  }

  /**
   * Directly apply the mesh-specific uniforms to the material
   */
  private applyUniformsToMaterial(material: PlaneMaterial): void {
    // Apply each uniform directly to the material
    if (this._meshSpecificUniforms.uGeometryCenter) {
      material.setGeometryCenter(this._meshSpecificUniforms.uGeometryCenter);
    }

    if (this._meshSpecificUniforms.uBarRingForegroundColor) {
      material.setBarRingForegroundColor(
        this._meshSpecificUniforms.uBarRingForegroundColor
      );
    }

    if (this._meshSpecificUniforms.uBarRingBackgroundColor) {
      material.setBarRingBackgroundColor(
        this._meshSpecificUniforms.uBarRingBackgroundColor
      );
    }

    if (this._meshSpecificUniforms.uBaseColor) {
      material.setBaseColor(this._meshSpecificUniforms.uBaseColor);
    }

    // Update the material to ensure the changes are applied
    material.update();
  }

  // Getters and setters remain the same
  public get renderer() {
    return this._renderer;
  }

  public set renderer(renderer: THREE.WebGLRenderer) {
    this._renderer = renderer;
  }

  public get mesh(): THREE.Mesh | null {
    return this._mesh;
  }

  public set mesh(mesh: THREE.Mesh | null) {
    this._mesh = mesh;
  }

  public get material(): PlaneMaterial {
    return this._material;
  }

  public set material(material: PlaneMaterial) {
    this._material = material;

    // When material changes, reapply the mesh-specific uniforms
    this.applyUniformsToMaterial(material);
  }

  public get scene() {
    return this._scene;
  }

  public set scene(scene: THREE.Scene) {
    this._scene = scene;
  }

  public get position() {
    return this._position;
  }

  public set position(position: THREE.Vector3) {
    this._position = position;
  }

  public get meshSpecificUniforms(): MeshSpecificUniforms {
    return this._meshSpecificUniforms;
  }
}
