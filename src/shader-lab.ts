import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { StatsManager } from "./statsmanager";
import { PlaneMaterial } from "./materials/PlaneMaterial";
import { GUIManager } from "./guimanager";

import vertexShader from "./glsl/plane-shader/main.vert";
// import fragmentShader from "../glsl/plane-shader/main.frag";
// import fragmentShader from "../glsl/plane-shader/gaussian.frag";
import paddleFragmentShader from "./glsl/plane-shader/paddle.frag";
import stripesFragmentShader from "./glsl/plane-shader/stripes.frag";
import circlesFragmentShader from "./glsl/plane-shader/concentricCircles.frag";
import pulsatingRingFragmentShader from "./glsl/plane-shader/pulsatingRing.frag";
import { TexturedRoundedPaddle } from "./entities/TexturedRoundedPaddle";
import { ShaderPlane } from "./entities/ShaderPlane";
import { PulsatingRoundedPaddle } from "./entities/PulsatingRoundedPaddle";

interface CustomShaderMaterial extends THREE.RawShaderMaterial, PlaneMaterial {
  update: (params?: any) => { updatedUniforms: string[] };
}

type GUIControlledMesh = THREE.Mesh<
  THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  PlaneMaterial | THREE.Material | THREE.Material[],
  THREE.Object3DEventMap
>;

export class ShaderLab {
  // Make scene accessible to GUIManager
  public _scene: THREE.Scene;
  private _renderer: THREE.WebGLRenderer;
  private _camera: THREE.PerspectiveCamera;
  private _statsManager: StatsManager;
  private _customMaterials: CustomShaderMaterial[] = []; // Array to track custom materials for updates
  private _guimanager: GUIManager;
  private _guiControlledMeshes: GUIControlledMesh[] = [];
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

    const light = new THREE.AmbientLight(0x404040, 2.0 * Math.PI); // soft white light
    this._scene.add(light);

    // White directional light at half intensity shining from the top.
    const directionalLight = new THREE.DirectionalLight(
      0xffffff,
      1.0 * Math.PI
    );
    directionalLight.position.set(1, 1, 1);
    this._scene.add(directionalLight);

    //   Use for testing plane
    // this._camera.position.set(-3.0, 0.5, 0.7);

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

    // Textured paddle

    const texturedAluminumPaddle = new TexturedRoundedPaddle(
      this._renderer,
      this._scene
    );

    // Pulsating aluminum shader paddle

    const pulsatingAluminumPaddlePosition = new THREE.Vector3(4, 0, 0);

    const pulsatingAluminumPaddleMaterial = new PlaneMaterial(
      vertexShader,
      paddleFragmentShader,
      {
        uniforms: {
          uGeometryCenter: pulsatingAluminumPaddlePosition
            .clone()
            .add(new THREE.Vector3(0.0, 0.5, 1.0)),
          uBarRingForegroundColor: new THREE.Color("pink"),
          uBarRingBackgroundColor: new THREE.Color("#90BDC3"),
        },
      }
    );

    this._customMaterials.push(pulsatingAluminumPaddleMaterial);

    const pulsatingAluminumPaddle = new PulsatingRoundedPaddle(
      this._renderer,
      this._scene,
      pulsatingAluminumPaddleMaterial,
      pulsatingAluminumPaddlePosition
    );

    // Pulsating shader paddle

    const pulsatingPaddlePosition = new THREE.Vector3(8, 0, 0);

    const pulsatingPaddleMaterial = new PlaneMaterial(
      vertexShader,
      pulsatingRingFragmentShader,
      {
        uniforms: {
          uGeometryCenter: pulsatingPaddlePosition
            .clone()
            .add(new THREE.Vector3(0.0, 0.5, 1.0)),
          uBarRingForegroundColor: new THREE.Color("pink"),
          uBarRingBackgroundColor: new THREE.Color("#90BDC3"),
        },
      }
    );

    this._customMaterials.push(pulsatingPaddleMaterial);

    const pulsatingPaddle = new PulsatingRoundedPaddle(
      this._renderer,
      this._scene,
      pulsatingPaddleMaterial,
      pulsatingPaddlePosition,
      (mesh: THREE.Mesh): void => {
        this.guiControlledMeshes.push(mesh);
      }
    );

    // Set shader plane

    const shaderPlanePosition = new THREE.Vector3(-3, 0.5, 0);

    const initialShaderPlaneMaterial = new PlaneMaterial(
      vertexShader,
      pulsatingRingFragmentShader,
      {
        uniforms: {
          uGeometryCenter: shaderPlanePosition
            .clone()
            .add(new THREE.Vector3(0.0, 0.0, 0.0)),
          // uBarRingForegroundColor: new THREE.Color("pink"),
          uBarRingForegroundColor: new THREE.Color("#2F646A"),
          uBarRingBackgroundColor: new THREE.Color("#90BDC3"),
          uBaseColor: new THREE.Color("#6A452F"),
        },
      }
    );

    this._customMaterials.push(initialShaderPlaneMaterial);

    const shaderPlane = new ShaderPlane(
      this._renderer,
      this._scene,
      initialShaderPlaneMaterial,
      shaderPlanePosition
    );

    if (shaderPlane.plane) {
      this.guiControlledMeshes.push(shaderPlane.plane);
    }

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

  public setGUIControlledMeshesMaterial(material: PlaneMaterial | null) {
    if (!material) {
      return;
    }
    console.log(this.guiControlledMeshes);
    for (let i = 0; i < this.guiControlledMeshes.length; i++) {
      if (this.guiControlledMeshes[i]) {
        console.log("Mesh", this.guiControlledMeshes[i].name);
        this.guiControlledMeshes[i].material = material;
      }
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
}
