import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { StatsManager } from "./statsmanager";
import { TestMaterial } from "./materials/TestMaterial";
import { TestMaterialFlash } from "./materials/TestMaterialFlash";

interface CustomShaderMaterial extends THREE.RawShaderMaterial {
  update: () => void;
}

export class ShaderLab {
  private _renderer: THREE.WebGLRenderer;
  private _scene: THREE.Scene;
  private _camera: THREE.PerspectiveCamera;
  private _statsManager: StatsManager;
  private _customMaterials: CustomShaderMaterial[] = []; // Array to track custom materials for updates

  constructor(canvas: HTMLCanvasElement) {
    // Get WebGL2 context - THREE.js r163+ requires WebGL2
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });

    // Check if WebGL2 is supported
    if (!gl) {
      console.error("WebGL2 not supported in this browser");
      alert(
        "Your browser doesn't support WebGL2, which is required for this game."
      );
    }

    console.log("Canvas WebGL2 extensions:", gl?.getSupportedExtensions());

    // Create THREE.js renderer using the existing WebGL2 context
    this._renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      context: gl || undefined,
      antialias: true,
      alpha: true,
    });

    // After creating the renderer
    console.log(
      "Is WebGL2:",
      this._renderer.getContext() instanceof WebGL2RenderingContext
    );
    this._renderer.setSize(window.innerWidth, window.innerHeight);

    this._scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._camera.position.set(8, 5, 8);
    controls.update();

    const axesHelper = new THREE.AxesHelper(5);
    this._scene.add(axesHelper);

    const light = new THREE.AmbientLight(0x404040, 5.0); // soft white light
    this._scene.add(light);

    // White directional light at half intensity shining from the top.
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    this._scene.add(directionalLight);

    // Load the model
    this.loadModelAndCreateClone();

    // Handle window resize
    window.addEventListener("resize", () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this._camera.aspect = width / height;
      this._camera.updateProjectionMatrix();

      this._renderer.setSize(width, height);
    });

    this._statsManager = new StatsManager();
    this.animate();
  }

  private loadModelAndCreateClone() {
    const loader = new GLTFLoader();

    loader.load(
      "/assets/models/paddle_turqoise_metal.glb",
      (gltf) => {
        // Find the original paddle mesh
        const originalMesh = gltf.scene.children.find(
          (child) => child.name === "Paddle"
        ) as THREE.Mesh;

        if (originalMesh && originalMesh.isObject3D) {
          // Add the original to the scene
          this._scene.add(originalMesh);

          // Create a new mesh with the same geometry but our custom material
          const testMaterial = new TestMaterial();
          this._customMaterials.push(testMaterial);

          const testMaterialFlash = new TestMaterialFlash();
          this._customMaterials.push(testMaterialFlash);

          // Clone the mesh
          this.createShaderClone(originalMesh, testMaterial);

          this.createShaderClone(
            originalMesh,
            testMaterialFlash,
            new THREE.Vector3(5, 0, 5)
          );
        } else {
          console.error("Original paddle mesh not found or not a mesh");
        }
      },
      undefined,
      (error) => console.error("Couldn't load model", error)
    );
  }

  private createShaderClone(
    originalMesh: THREE.Mesh,
    material: THREE.RawShaderMaterial,
    position?: THREE.Vector3
  ) {
    // Make sure we have a valid mesh to clone
    if (!originalMesh.geometry) {
      console.error("Original mesh has no geometry", originalMesh);
      return;
    }

    // Clone the geometry
    const clonedGeometry = originalMesh.geometry.clone();

    // Create the new mesh
    const clonedMesh = new THREE.Mesh(clonedGeometry, material);
    clonedMesh.name = "PaddleShaderClone";

    // Position the clone next to the original
    clonedMesh.position.copy(originalMesh.position);
    clonedMesh.position.set(
      ...(position?.toArray() ||
        clonedMesh.position.add(new THREE.Vector3(5, 0, 0)).toArray())
    ); // Offset to the right

    // Copy rotation and scale
    clonedMesh.rotation.copy(originalMesh.rotation);
    clonedMesh.scale.copy(originalMesh.scale);

    // Add to scene
    this._scene.add(clonedMesh);
    console.log("Created shader clone of the paddle", clonedMesh);
  }

  private animate() {
    this._statsManager.begin();

    // Update all custom shader materials
    for (const material of this._customMaterials) {
      material.update();
    }

    this._renderer.render(this._scene, this._camera);
    this._statsManager.end();

    requestAnimationFrame(() => this.animate());
  }
}
