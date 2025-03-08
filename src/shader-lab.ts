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
import paddleFragmentShader from "./glsl/plane-shader/paddle.frag";
import stripesFragmentShader from "./glsl/plane-shader/stripes.frag";
import circlesFragmentShader from "./glsl/plane-shader/concentricCircles.frag";
import { TexturedRoundedPaddle } from "./entities/TexturedRoundedPaddle";
import { ShaderPlane } from "./entities/ShaderPlane";
import { PulsatingRoundedPaddle } from "./entities/PulsatingRoundedPaddle";

interface CustomShaderMaterial extends THREE.RawShaderMaterial, PlaneMaterial {
  update: (params?: any) => { updatedUniforms: string[] };
}

type Plane = THREE.Mesh<
  THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  PlaneMaterial | THREE.Material | THREE.Material[],
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
  private _mesh: Plane = null;
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
    // this._camera.position.set(0.0, 0.0, 0.7);

    // Use for testing objects
    this._camera.position.set(8, 5, 5);
    const controls = new OrbitControls(this._camera, this._renderer.domElement);
    controls.update();

    const axesHelper = new THREE.AxesHelper(5);
    this._scene.add(axesHelper);

    this._guimanager = new GUIManager(this, this._renderer);
    this._statsManager = new StatsManager();

    this.createGUIControlledMaterials();
    this._customMaterials = [
      ...this._customMaterials,
      ...Array.from(this._guimanager.planeMaterials.values()),
    ];

    const texturedPaddle = new TexturedRoundedPaddle(
      this._renderer,
      this._scene
    );

    const pulsatingRoundedPaddleMaterial = new PlaneMaterial(
      vertexShader,
      paddleFragmentShader,
      {
        uniforms: {
          uGeometryCenter: new THREE.Vector3(-4, 0.5, 1.0),
          uBarRingForegroundColor: new THREE.Color("pink"),
          uBarRingBackgroundColor: new THREE.Color("#90BDC3"),
        },
      }
    );
    this._customMaterials.push(pulsatingRoundedPaddleMaterial);

    const pulsatingRoundedPaddle = new PulsatingRoundedPaddle(
      this._renderer,
      this._scene,
      pulsatingRoundedPaddleMaterial,
      new THREE.Vector3(-4, 0, 0)
    );

    const shaderPlane = new ShaderPlane(
      this._renderer,
      this._scene,
      this._customMaterials[0],
      new THREE.Vector3(5, 0.5, 0)
    );

    this.mesh = shaderPlane.plane;

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

  public get mesh(): Plane {
    return this._mesh;
  }

  public set mesh(v: Plane) {
    this._mesh = v;
  }

  public getMeshMaterial(): PlaneMaterial | null {
    if (!this.mesh) {
      return null;
    }
    return this.mesh.material;
  }

  public setMeshMaterial(material: PlaneMaterial | null) {
    if (this.mesh && material) {
      console.log("Changing mesh material", material);
      this.mesh.material = material;
    }
  }

  // Method to update scene background color
  public updateSceneBackground(color: THREE.Color): void {
    this._backgroundColor = color;
    this._scene.background = this._backgroundColor;
  }

  private createGUIControlledMaterials() {
    // Create plane materials
    const paddle = new PlaneMaterial(vertexShader, paddleFragmentShader);
    const stripes = new PlaneMaterial(vertexShader, stripesFragmentShader, {
      uniforms: {
        uBarRingForegroundColor: new THREE.Color("black"),
        uBarRingBackgroundColor: new THREE.Color("white"),
      },
    });
    const circles = new PlaneMaterial(vertexShader, circlesFragmentShader);

    this._guimanager.addPlaneMaterial(paddle, "paddle");
    this._guimanager.addPlaneMaterial(stripes, "stripes");
    this._guimanager.addPlaneMaterial(circles, "circles");
    this._guimanager.setupPlaneMaterialFolder();
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
