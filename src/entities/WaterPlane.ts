import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PlaneMaterial } from "../materials/PlaneMaterial";
import { MeshSpecificUniforms } from "../MeshUniformsManager";

export class WaterPlane {
  private _mesh: THREE.Mesh | null = null;
  private _renderer: THREE.WebGLRenderer;
  private _scene: THREE.Scene;
  private _geometry: THREE.PlaneGeometry | null = null;
  private _material: PlaneMaterial;
  private _position: THREE.Vector3;
  private _onMeshCreated: ((mesh: THREE.Mesh) => void) | null = null;
  private _meshSpecificUniforms: MeshSpecificUniforms;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    geometry: THREE.PlaneGeometry,
    material: PlaneMaterial,
    position: THREE.Vector3,
    onMeshCreated: ((mesh: THREE.Mesh) => void) | null = null,
    initialUniforms?: MeshSpecificUniforms // Add this parameter
  ) {
    this._renderer = renderer;
    this._scene = scene;
    this._geometry = geometry;
    this._material = material;
    this._position = position;
    this._onMeshCreated = onMeshCreated;

    // Pre-define mesh-specific uniforms that will be used both for registration
    // and for direct application to the material during initialization
    this._meshSpecificUniforms = {
      uGeometryCenter: position.clone(),
      uColor: new THREE.Color("darkslategray"),
      uBaseColor: new THREE.Color("darkslategray"),
      ...(initialUniforms || {}),
    };

    // Apply mesh-specific uniforms to the material right away
    this.applyUniformsToMaterial(material);

    this.initialize();
  }

  private initialize(): void {
    if (!this.geometry) {
      return;
    }
    // Create the mesh with the provided material
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.name = "WaterPlaneMesh";
    this.mesh.position.copy(this.position);

    // Rotate to lie flat on XZ plane (around X axis by 90 degrees)
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.rotation.z = Math.PI;

    // Add the mesh to the scene
    this.scene.add(this.mesh);

    // Call the onMeshCreated callback if provided
    if (this._onMeshCreated && this.mesh) {
      this._onMeshCreated(this.mesh);
    }
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

  public get geometry(): THREE.PlaneGeometry | null {
    return this._geometry;
  }

  public set geometry(geometry: THREE.PlaneGeometry | null) {
    this._geometry = geometry;
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
