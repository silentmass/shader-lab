import * as THREE from "three";
import { PlaneMaterial } from "../materials/PlaneMaterial";
import { MeshSpecificUniforms } from "../MeshUniformsManager";

export class ShaderPlane {
  private _mesh: THREE.Mesh | null = null;
  private _renderer: THREE.WebGLRenderer;
  private _scene: THREE.Scene;
  private _material: PlaneMaterial;
  private _position: THREE.Vector3;
  private _onMeshCreated: ((mesh: THREE.Mesh) => void) | null = null;
  private _meshSpecificUniforms: MeshSpecificUniforms;

  // Updated ShaderPlane constructor
  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    material: PlaneMaterial,
    position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    onMeshCreated: ((mesh: THREE.Mesh) => void) | null = null,
    initialUniforms?: MeshSpecificUniforms // Add this parameter
  ) {
    this._renderer = renderer;
    this._scene = scene;
    this._material = material;
    this._position = position;
    this._onMeshCreated = onMeshCreated;

    // Use the provided uniforms or create default ones
    this._meshSpecificUniforms = initialUniforms || {
      uGeometryCenter: position.clone(),
      uBarRingForegroundColor: new THREE.Color("#6A452F"),
      uBarRingBackgroundColor: new THREE.Color("#90BDC3"),
      uBaseColor: new THREE.Color("#2F646A"),
    };

    // Apply uniforms to the material immediately
    this.applyUniformsToMaterial(material);

    this.initialize();
  }

  private initialize(): void {
    // Create your mesh geometry
    const geometry = new THREE.PlaneGeometry(1, 1);

    // Create the mesh with the provided material
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = "ShaderPlaneMesh";
    this.mesh.position.copy(this.position);

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
