import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { StatsManager } from "./statsmanager";
import { TestMaterial } from "./materials/TestMaterial";
import { TestMaterialFlash } from "./materials/TestMaterialFlash";
import { PlaneMaterial } from "./materials/PlaneMaterial";
import { color } from "three/tsl";
import { GUIManager } from "./guimanager";

import vertexShader from "./glsl/plane-shader/main.vert";
// import fragmentShader from "../glsl/plane-shader/main.frag";
// import fragmentShader from "../glsl/plane-shader/gaussian.frag";
import stripesFragmentShader from "./glsl/plane-shader/stripes.frag";
import circlesFragmentShader from "./glsl/plane-shader/concentricCircles.frag";

interface CustomShaderMaterial extends THREE.RawShaderMaterial {
  update: (params?: any) => { updatedUniforms: string[] };
}

type Plane = THREE.Mesh<
  THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  PlaneMaterial,
  THREE.Object3DEventMap
> | null;

export class ShaderLab {
  // Make scene accessible to GUIManager
  public _scene: THREE.Scene;
  private _renderer: THREE.WebGLRenderer;
  private _camera: THREE.PerspectiveCamera;
  private _statsManager: StatsManager;
  private _customMaterials: CustomShaderMaterial[] = []; // Array to track custom materials for updates
  private _guimanager: GUIManager;
  private _plane: Plane = null;
  private _backgroundColor: THREE.Color = new THREE.Color(0x000000);

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

    const light = new THREE.AmbientLight(0x404040, 5.0); // soft white light
    this._scene.add(light);

    // White directional light at half intensity shining from the top.
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(-5, 4, 2);
    this._scene.add(directionalLight);

    //   Use for testing plane
    this._camera.position.set(0.0, 0.0, 0.7);
    console.log(this._camera.rotation);

    // Use for testing objects
    // this._camera.position.set(8, 5, 5);
    // const controls = new OrbitControls(this._camera, this._renderer.domElement);
    // controls.update();

    // Load the models
    // this.loadModelAndCreateClone();
    // this.loadModelAndAddTextures();

    const axesHelper = new THREE.AxesHelper(5);
    this._scene.add(axesHelper);

    this._guimanager = new GUIManager(this, this._renderer);
    this._statsManager = new StatsManager();

    this.createPlane();

    // Handle window resize
    window.addEventListener("resize", () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this._camera.aspect = width / height;
      this._camera.updateProjectionMatrix();

      this._renderer.setSize(width, height);
    });

    this.animate();
  }

  public get plane(): Plane {
    return this._plane;
  }

  public set plane(v: Plane) {
    this._plane = v;
  }

  public getPlaneMaterial(): PlaneMaterial | null {
    if (!this.plane) {
      return null;
    }
    return this.plane.material;
  }

  public setPlaneMaterial(material: PlaneMaterial | null) {
    if (this.plane && material) {
      console.log("Changing plane material", material);
      this.plane.material = material;
    }
  }

  // Method to update scene background color
  public updateSceneBackground(color: THREE.Color): void {
    this._backgroundColor = color;
    this._scene.background = this._backgroundColor;
  }

  private createPlane() {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const stripes = new PlaneMaterial(vertexShader, stripesFragmentShader, {
      uniforms: {
        uBarRingForegroundColor: new THREE.Color("black"),
        uBarRingBackgroundColor: new THREE.Color("white"),
      },
    });
    const circles = new PlaneMaterial(vertexShader, circlesFragmentShader);

    // Register the material for updates
    this._customMaterials.push(stripes);
    this._customMaterials.push(circles);

    // Create and add the plane to the scene
    this.plane = new THREE.Mesh(geometry, stripes);
    this.plane.position.set(0, 0, 0);
    this._scene.add(this.plane);

    this._guimanager.addPlaneMaterial(stripes, "stripes");
    this._guimanager.addPlaneMaterial(circles, "circles");
    this._guimanager.setupPlaneMaterialFolder();
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

  private loadModelAndAddTextures() {
    const loader = new GLTFLoader();

    // Pre-load textures
    const textureLoader = new THREE.TextureLoader();

    const map = textureLoader.load(
      "/assets/maps/MetalNoise4Diffuse.png",
      (tex) => {
        tex.name = "MetalNoise4Diffuse";
        console.log("Loading texture", tex);
      },
      undefined,
      (error) => console.error("Error loading diffuse texture", error)
    );
    const roughnessMap = textureLoader.load(
      "/assets/maps/MetalNoise4Roughness.png",
      (tex) => {
        tex.name = "MetalNoise4Roughness";
        console.log("Loading texture", tex);
      },
      undefined,
      (error) => console.error("Error loading roughness texture", error)
    );
    const metalnessMap = textureLoader.load(
      "/assets/maps/MetalNoise4Metalness.png",
      (tex) => {
        tex.name = "MetalNoise4Metalness";
        console.log("Loading texture", tex);
      },
      undefined,
      (error) => console.error("Error loading metalness texture", error)
    );

    // Configure texture properties
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1, 1); // Adjust repeating as needed
    map.rotation = Math.PI / 2;

    // Also configure roughness texture
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(1, 1);
    roughnessMap.rotation = Math.PI / 2;

    metalnessMap.wrapS = THREE.RepeatWrapping;
    metalnessMap.wrapT = THREE.RepeatWrapping;
    metalnessMap.repeat.set(1, 1);
    metalnessMap.rotation = Math.PI / 2;

    loader.load(
      "/assets/models/paddle_turqoise_metal_noise4.glb",
      (gltf) => {
        // Find the original paddle mesh
        const originalMesh = gltf.scene.children.find(
          (child) => child.name === "Paddle"
        ) as THREE.Mesh;

        if (originalMesh && originalMesh.isObject3D) {
          // Option 2: MeshStandardMaterial (PBR with lighting)
          const material = new THREE.MeshStandardMaterial({
            map,
            roughnessMap,
            metalnessMap,
            // roughness: 0.5,
            // metalness: 0.8,
            envMapIntensity: 1.0,
          });

          originalMesh.name = "PaddleShaderWithTexture";
          originalMesh.material = material;
          originalMesh.position.set(0, 0, 3);
          originalMesh.material.needsUpdate = true;

          // Create an environment map for better metal reflections
          //   const envMapLoader = new THREE.CubeTextureLoader();
          //   const envMap = envMapLoader.load([
          //     '/assets/envmap/px.jpg', '/assets/envmap/nx.jpg',
          //     '/assets/envmap/py.jpg', '/assets/envmap/ny.jpg',
          //     '/assets/envmap/pz.jpg', '/assets/envmap/nz.jpg'
          //   ]);

          // If you don't have an envmap, you can use this alternative:
          const envMap = new THREE.PMREMGenerator(this._renderer).fromScene(
            new THREE.Scene()
          ).texture;

          this._scene.environment = envMap;

          // Make sure UVs are properly set up
          if (!originalMesh.geometry.attributes.uv) {
            console.warn("Mesh has no UV coordinates, generating them");
            originalMesh.geometry.setAttribute(
              "uv",
              new THREE.BufferAttribute(
                this.generateBasicUVs(originalMesh.geometry),
                2
              )
            );
          }

          this._scene.add(originalMesh);
        } else {
          console.error("Original paddle mesh not found or not a mesh");
        }
      },
      undefined,
      (error) => console.error("Couldn't load model", error)
    );
  }

  // Method to generate basic UVs if the mesh doesn't have them
  private generateBasicUVs(geometry: THREE.BufferGeometry): Float32Array {
    const positionAttribute = geometry.getAttribute("position");
    const count = positionAttribute.count;
    const uvs = new Float32Array(count * 2);

    // Generate simple planar UVs based on position
    for (let i = 0; i < count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);

      uvs[i * 2] = (x + 1) / 2; // U: map from [-1,1] to [0,1]
      uvs[i * 2 + 1] = (y + 1) / 2; // V: map from [-1,1] to [0,1]
    }

    return uvs;
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
    // Check if GUI controls have been changed
    const guiControlsChanged = this._guimanager.planeControlsChanged;

    // If GUI controls have changed, we can log the changes or perform specific actions
    if (guiControlsChanged) {
      console.log("GUI controls for plane material have been updated");
      // You can add specific reactions to control changes here if needed
      this._guimanager.update();
    }

    // Update all custom shader materials
    for (const material of this._customMaterials) {
      const updateResult = material.update();
      // We can check if any uniforms were updated during this frame
      if (updateResult.updatedUniforms.length > 0) {
        // Log or react to specific uniform updates if needed
        // console.log("Updated uniforms:", updateResult.updatedUniforms);
      }
    }

    this._statsManager.begin();
    this._renderer.render(this._scene, this._camera);
    this._statsManager.end();

    requestAnimationFrame(() => this.animate());
  }

  public get backgroundColor(): THREE.Color {
    return this._backgroundColor;
  }

  public set backgroundColor(color: THREE.Color) {
    this._backgroundColor = color;
  }
}
