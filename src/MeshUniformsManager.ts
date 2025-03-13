import * as THREE from "three";
import { PlaneMaterial } from "./materials/PlaneMaterial";

// Define types for mesh-specific uniforms
export interface MeshSpecificUniforms {
  uGeometryCenter?: THREE.Vector3;
  uBarRingForegroundColor?: THREE.Color;
  uBarRingBackgroundColor?: THREE.Color;
  uBaseColor?: THREE.Color;
  uBarRingCount?: number;
  uBarRingOpacity?: number;
  uSpeed?: THREE.Vector2;
  uAngle?: number;
  uEvent?: number;
  uEventIntensity?: number;
  [key: string]: any; // Allow for additional custom uniforms
}

export class MeshUniformsManager {
  private _meshUniforms: Map<string, MeshSpecificUniforms> = new Map();

  /**
   * Register default uniforms for a specific mesh
   * @param meshId Unique identifier for the mesh (can be mesh.uuid)
   * @param defaultUniforms The default uniforms for this mesh
   */
  public registerMesh(
    meshId: string,
    defaultUniforms: MeshSpecificUniforms
  ): void {
    // Store a deep copy of the uniforms to prevent reference issues
    const uniformsCopy: MeshSpecificUniforms = {};

    // Clone each uniform value properly based on its type
    Object.entries(defaultUniforms).forEach(([key, value]) => {
      if (value instanceof THREE.Vector3) {
        uniformsCopy[key] = value.clone();
      } else if (value instanceof THREE.Color) {
        uniformsCopy[key] = value.clone();
      } else if (value instanceof THREE.Vector2) {
        uniformsCopy[key] = value.clone();
      } else {
        // For primitive values like numbers
        uniformsCopy[key] = value;
      }
    });

    this._meshUniforms.set(meshId, uniformsCopy);
  }

  /**
   * Get the default uniforms for a specific mesh
   * @param meshId Unique identifier for the mesh
   * @returns The mesh's default uniforms or null if not found
   */
  public getMeshUniforms(meshId: string): MeshSpecificUniforms | null {
    const uniforms = this._meshUniforms.get(meshId);
    if (!uniforms) return null;

    // Return a deep copy to prevent modifications to the stored defaults
    const uniformsCopy: MeshSpecificUniforms = {};

    Object.entries(uniforms).forEach(([key, value]) => {
      if (value instanceof THREE.Vector3) {
        uniformsCopy[key] = value.clone();
      } else if (value instanceof THREE.Color) {
        uniformsCopy[key] = value.clone();
      } else if (value instanceof THREE.Vector2) {
        uniformsCopy[key] = value.clone();
      } else {
        uniformsCopy[key] = value;
      }
    });

    return uniformsCopy;
  }

  /**
   * Apply mesh-specific uniforms to a material
   * @param material The material to update
   * @param meshId The mesh identifier
   * @returns True if uniforms were applied, false if mesh not found
   */
  public applyUniformsToMaterial(
    material: PlaneMaterial,
    meshId: string
  ): boolean {
    const uniforms = this._meshUniforms.get(meshId);
    if (!uniforms) return false;

    // Apply each uniform to the material
    Object.entries(uniforms).forEach(([key, value]) => {
      // Handle uniform naming conversion (e.g., uGeometryCenter → geometryCenter)
      const propName = key.startsWith("u")
        ? key.charAt(1).toLowerCase() + key.slice(2)
        : key;

      const setterMethod = `set${
        propName.charAt(0).toUpperCase() + propName.slice(1)
      }`;

      // Use type assertion to avoid TypeScript error
      const setter = material[
        setterMethod as keyof PlaneMaterial
      ] as unknown as Function;

      // Use the appropriate setter method if it exists
      if (typeof setter === "function") {
        if (
          value instanceof THREE.Vector3 ||
          value instanceof THREE.Color ||
          value instanceof THREE.Vector2
        ) {
          setter.call(material, value.clone());
        } else {
          setter.call(material, value);
        }
      }
    });

    // Force update to ensure all uniforms are applied
    material.update();

    return true;
  }

  /**
   * Check if a mesh has registered uniforms
   * @param meshId The mesh identifier to check
   * @returns True if the mesh has registered uniforms
   */
  public hasMeshUniforms(meshId: string): boolean {
    return this._meshUniforms.has(meshId);
  }

  /**
   * Update specific uniforms for a mesh
   * @param meshId The mesh identifier
   * @param updatedUniforms Object containing the uniforms to update
   * @returns True if the update was successful
   */
  public updateMeshUniforms(
    meshId: string,
    updatedUniforms: Partial<MeshSpecificUniforms>
  ): boolean {
    const existingUniforms = this._meshUniforms.get(meshId);
    if (!existingUniforms) return false;

    // Update each provided uniform
    Object.entries(updatedUniforms).forEach(([key, value]) => {
      if (value instanceof THREE.Vector3) {
        existingUniforms[key] = value.clone();
      } else if (value instanceof THREE.Color) {
        existingUniforms[key] = value.clone();
      } else if (value instanceof THREE.Vector2) {
        existingUniforms[key] = value.clone();
      } else {
        existingUniforms[key] = value;
      }
    });

    return true;
  }

  /**
   * Remove a mesh's registered uniforms
   * @param meshId The mesh identifier to remove
   * @returns True if the mesh was found and removed
   */
  public unregisterMesh(meshId: string): boolean {
    return this._meshUniforms.delete(meshId);
  }
}
