import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { StatsManager } from "./StatsManager";
import { PlaneMaterial } from "./materials/PlaneMaterial";
import { GUIManager } from "./GUIManager";
import {
  MeshUniformsManager,
  MeshSpecificUniforms,
} from "./MeshUniformsManager";

import vertexShader from "./glsl/plane-shader/main.vert";
import stripesFragmentShader from "./glsl/plane-shader/stripes.frag";
import circlesFragmentShader from "./glsl/plane-shader/concentricCircles.frag";
import pulsatingRingFragmentShader from "./glsl/plane-shader/pulsatingRing.frag";
import sphereFragmentShader from "./glsl/plane-shader/sphere.frag";
import brickFragmentShader from "./glsl/plane-shader/brick.frag";
import { ShaderPlane } from "./entities/ShaderPlane";
import { PulsatingRoundedPaddle } from "./entities/PulsatingRoundedPaddle";
import { Sphere } from "./entities/Sphere";
import { Brick } from "./entities/Brick";

interface CustomShaderMaterial extends THREE.RawShaderMaterial, PlaneMaterial {
  update: (params?: any) => { updatedUniforms: string[] };
}

type GUIControlledMesh = THREE.Mesh<
  THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  PlaneMaterial | THREE.Material | THREE.Material[],
  THREE.Object3DEventMap
>;

export class ShaderLab {
  public _scene: THREE.Scene;
  private _renderer: THREE.WebGLRenderer;
  private _camera: THREE.PerspectiveCamera;
  private _statsManager: StatsManager;
  private _customMaterials: CustomShaderMaterial[] = [];
  private _guimanager: GUIManager;
  private _guiControlledMeshes: GUIControlledMesh[] = [];
  private _backgroundColor: THREE.Color = new THREE.Color(0x000000);

  private _meshUniformsManager: MeshUniformsManager;

  private _shaderPlanePosition: THREE.Vector3;

  private _activeMesh: GUIControlledMesh | null = null;

  private _controls: OrbitControls;

  constructor(canvas: HTMLCanvasElement) {
    this._meshUniformsManager = new MeshUniformsManager();

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

    const light = new THREE.AmbientLight(0x404040, 2.0 * Math.PI); // soft white light
    this._scene.add(light);

    // White directional light at half intensity shining from the top.
    const directionalLight = new THREE.DirectionalLight(
      0xffffff,
      1.0 * Math.PI
    );
    directionalLight.position.set(1, 1, 1);
    this._scene.add(directionalLight);

    this._shaderPlanePosition = new THREE.Vector3(-3, 0.5, 0);

    // Set up camera for general view
    this._camera.position.set(8, 5, 5);
    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.update();

    const axesHelper = new THREE.AxesHelper(5);
    this._scene.add(axesHelper);

    this._guimanager = new GUIManager(this, this._renderer);
    this._statsManager = new StatsManager();

    this.createGUIControlledMaterials();
    this._customMaterials = [
      ...this._customMaterials,
      ...Array.from(this._guimanager.planeMaterials.values()),
    ];

    console.log("GUIControlledMeshes", this.guiControlledMeshes);

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

  private focusCameraOnMesh(mesh: THREE.Mesh): void {
    // Disable controls temporarily
    this._controls.enabled = false;

    // Get the mesh position
    const meshPosition = mesh.position.clone();

    // Different camera positions based on mesh type
    if (mesh.name === "ShaderPlaneMesh") {
      // For the shader plane, position the camera to look at it from a specific angle
      this._camera.position.set(
        meshPosition.x,
        meshPosition.y,
        meshPosition.z + 0.7
      );
      this._camera.lookAt(meshPosition);
    } else {
      // For other meshes, use a default viewing angle
      this._camera.position.set(
        meshPosition.x + 3,
        meshPosition.y + 2,
        meshPosition.z + 3
      );
      this._camera.lookAt(meshPosition);
    }

    // Update the controls target to match the mesh position
    this._controls.target.copy(meshPosition);

    // Re-enable controls after a short delay to allow the camera to move
    setTimeout(() => {
      this._controls.enabled = true;
      this._controls.update();
    }, 1000);
  }

  public setActiveMesh(mesh: GUIControlledMesh): void {
    console.log("Setting active mesh:", mesh.name);

    // Hide all meshes
    for (const guiMesh of this.guiControlledMeshes) {
      console.log(
        `Setting visibility of ${guiMesh.name} to ${guiMesh === mesh}`
      );
      guiMesh.visible = guiMesh === mesh;
    }

    this._activeMesh = mesh;

    // Apply the currently selected material from the GUI to this mesh
    if (this._guimanager.planeMaterial) {
      mesh.material = this._guimanager.planeMaterial;

      // Apply mesh-specific uniforms after setting the material
      if (this._meshUniformsManager.hasMeshUniforms(mesh.uuid)) {
        console.log(`Applying mesh-specific uniforms for: ${mesh.name}`);
        this._meshUniformsManager.applyUniformsToMaterial(
          this._guimanager.planeMaterial,
          mesh.uuid
        );
      }
    }

    // Focus the camera on the active mesh
    this.focusCameraOnMesh(mesh);

    // Log the current geometry center for debugging
    if (mesh.material instanceof PlaneMaterial) {
      console.log(
        `Active mesh geometry center: `,
        (mesh.material as PlaneMaterial).geometryCenter
      );
    }
  }

  public registerMeshUniforms(
    mesh: THREE.Mesh,
    defaultUniforms: MeshSpecificUniforms
  ): void {
    this._meshUniformsManager.registerMesh(mesh.uuid, defaultUniforms);
  }

  public setGUIControlledMeshesMaterial(material: PlaneMaterial | null) {
    if (!material || !this._activeMesh) {
      return;
    }

    console.log(`Setting material for active mesh: ${this._activeMesh.name}`);

    // Set the material on the active mesh
    this._activeMesh.material = material;

    // Apply mesh-specific uniforms to the new material
    if (this._meshUniformsManager.hasMeshUniforms(this._activeMesh.uuid)) {
      console.log(
        `Applying mesh-specific uniforms for: ${this._activeMesh.name}`
      );
      this._meshUniformsManager.applyUniformsToMaterial(
        material,
        this._activeMesh.uuid
      );
    }
  }

  private createGUIControlledMaterials() {
    // Create materials

    const sphereMaterial = new PlaneMaterial(
      vertexShader,
      sphereFragmentShader
    );
    const brickMaterial = new PlaneMaterial(vertexShader, brickFragmentShader);
    const pulsatingPaddleMaterial = new PlaneMaterial(
      vertexShader,
      pulsatingRingFragmentShader
    );
    const stripes = new PlaneMaterial(vertexShader, stripesFragmentShader);
    const circles = new PlaneMaterial(vertexShader, circlesFragmentShader);

    this._guimanager.addPlaneMaterial(sphereMaterial, "sphere");
    this._guimanager.addPlaneMaterial(brickMaterial, "brick");
    this._guimanager.addPlaneMaterial(pulsatingPaddleMaterial, "paddle");
    this._guimanager.addPlaneMaterial(stripes, "stripes");
    this._guimanager.addPlaneMaterial(circles, "circles");
    this._guimanager.setupPlaneMaterialFolder();

    // Create meshes

    // Sphere

    const spherePosition = new THREE.Vector3(0, 0, 0);

    new Sphere(
      this._renderer,
      this._scene,
      pulsatingPaddleMaterial,
      spherePosition,
      (mesh: THREE.Mesh): void => {
        this.guiControlledMeshes.push(mesh);

        // Register mesh-specific uniforms for MeshUniformsManager
        this.registerMeshUniforms(mesh, {
          uGeometryCenter: spherePosition.clone(),
          uBarRingForegroundColor: new THREE.Color("#6A452F"),
          uBarRingBackgroundColor: new THREE.Color("#90BDC3"),
          uBaseColor: new THREE.Color("silver"),
        });

        // Hide this mesh until we're ready to show it
        mesh.visible = false;
      }
    );

    // Plane

    const shaderPlaneUniforms: MeshSpecificUniforms = {
      uGeometryCenter: this._shaderPlanePosition.clone(),
      uBarRingForegroundColor: new THREE.Color("#6A452F"),
      uBarRingBackgroundColor: new THREE.Color("#90BDC3"),
      uBaseColor: new THREE.Color("#2F646A"),
    };

    new ShaderPlane(
      this._renderer,
      this._scene,
      pulsatingPaddleMaterial,
      this._shaderPlanePosition,
      (mesh: THREE.Mesh): void => {
        this.guiControlledMeshes.push(mesh);
        this.registerMeshUniforms(mesh, shaderPlaneUniforms);
        // Hide this mesh until we're ready to show it
        mesh.visible = false;
      },
      shaderPlaneUniforms // Pass the uniforms here
    );

    // Brick

    const brickPosition = new THREE.Vector3(0, 0, 0);

    const brickUniforms: MeshSpecificUniforms = {
      uGeometryCenter: brickPosition
        .clone()
        .add(new THREE.Vector3(0.0, 0.5, 0.5)),
      uBarRingForegroundColor: new THREE.Color("#6A452F"),
      uBarRingBackgroundColor: new THREE.Color("#90BDC3"),
      uBaseColor: new THREE.Color("#2F646A"),
    };

    new Brick(
      this._renderer,
      this._scene,
      pulsatingPaddleMaterial,
      brickPosition,
      (mesh: THREE.Mesh): void => {
        this.guiControlledMeshes.push(mesh);

        // Register mesh-specific uniforms for MeshUniformsManager
        // The actual uniforms are defined and applied inside the PulsatingRoundedPaddle class
        this.registerMeshUniforms(mesh, brickUniforms);

        // Hide this mesh until we're ready to show it
        mesh.visible = false;
      },
      brickUniforms
    );

    // Paddle

    const pulsatingRoundedPaddlePosition = new THREE.Vector3(0, 0, 0);

    const pulsatingRoundedPaddleUniforms: MeshSpecificUniforms = {
      uGeometryCenter: pulsatingRoundedPaddlePosition
        .clone()
        .add(new THREE.Vector3(0.0, 0.5, 1.0)),
      uBarRingForegroundColor: new THREE.Color("#6A452F"),
      uBarRingBackgroundColor: new THREE.Color("#90BDC3"),
      uBaseColor: new THREE.Color("#2F646A"),
    };

    // Create the pulsating paddle - it will now apply mesh-specific uniforms directly in its constructor
    new PulsatingRoundedPaddle(
      this._renderer,
      this._scene,
      pulsatingPaddleMaterial,
      pulsatingRoundedPaddlePosition,
      (mesh: THREE.Mesh): void => {
        this.guiControlledMeshes.push(mesh);

        // Register mesh-specific uniforms for MeshUniformsManager
        // The actual uniforms are defined and applied inside the PulsatingRoundedPaddle class
        this.registerMeshUniforms(mesh, pulsatingRoundedPaddleUniforms);

        // Hide this mesh until we're ready to show it
        mesh.visible = false;

        // Now that both meshes are created, set up the GUI and activate the first mesh
        this.setupMeshGUI();
      },
      pulsatingRoundedPaddleUniforms
    );
  }

  private setupMeshGUI() {
    // Setup the mesh selector in the GUI after all meshes are loaded
    this._guimanager.setupMeshSelector();

    // Set the first mesh as active if available
    if (this.guiControlledMeshes.length > 0) {
      this.setActiveMesh(this.guiControlledMeshes[1]);
    }
  }

  public updateSceneBackground(color: THREE.Color): void {
    this._backgroundColor = color;
    this._scene.background = this._backgroundColor;
  }

  private animate() {
    // If GUI controls have changed, we can log the changes or perform specific actions
    if (this.guimanager.planeControlsChanged) {
      console.log("GUI controls for plane material have been updated");
      // You can add specific reactions to control changes here if needed
      this.guimanager.update();
    }

    // Update all custom shader materials
    for (const material of this._customMaterials) {
      const updateResult = material.update({
        cameraPosition: this._camera.position,
      });
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

  public get guiControlledMeshes(): GUIControlledMesh[] {
    return this._guiControlledMeshes;
  }

  public set guiControlledMeshes(v: GUIControlledMesh[]) {
    this._guiControlledMeshes = v;
  }

  public get guimanager(): GUIManager {
    return this._guimanager;
  }

  public set guimanager(v: GUIManager) {
    this._guimanager = v;
  }

  public get meshUniformsManager(): MeshUniformsManager {
    return this._meshUniformsManager;
  }

  public set meshUniformsManager(v: MeshUniformsManager) {
    this._meshUniformsManager = v;
  }

  public get activeMesh(): GUIControlledMesh | null {
    return this._activeMesh;
  }

  public set activeMesh(v: GUIControlledMesh | null) {
    this._activeMesh = v;
  }
}
