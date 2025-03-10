import * as THREE from "three";
import { WebGLRenderer, Color, Vector2 } from "three";
import { PlaneMaterial } from "./materials/PlaneMaterial";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

const DEFAULT_MATERIAL_SETTINGS = {
  color: new THREE.Color("pink"),
  baseColor: new THREE.Color("gray"),
  barRingForegroundColor: new THREE.Color("black"),
  barRingBackgroundColor: new THREE.Color("yellow"),
  barRingOpacity: 1.0,
  event: 1,
  eventIntensity: 1.0,
  barRingCount: 10,
  barRingSpeed: new THREE.Vector2(1.0, 0.0),
  barRingAngle: 0.0,
  triggerTimedEvent: 0.0,
};

export class GUIManager {
  private _gui: GUI;
  private _parentRef: any; // Replace with your actual parent class type
  private _renderer: WebGLRenderer;

  private _planeMaterial: PlaneMaterial | null = null;
  private _planeControlsChanged: boolean = false;
  private _planeMaterials: Map<string, PlaneMaterial> = new Map();

  // Background settings
  private _mBackgroundColor: THREE.Color = new THREE.Color("#000000");

  // Material settings
  private _mColor: THREE.Color = DEFAULT_MATERIAL_SETTINGS.color.clone();
  private _mBaseColor: THREE.Color =
    DEFAULT_MATERIAL_SETTINGS.baseColor.clone();
  private _mBarRingForegroundColor: THREE.Color =
    DEFAULT_MATERIAL_SETTINGS.barRingForegroundColor.clone();
  private _mBarRingBackgroundColor: THREE.Color =
    DEFAULT_MATERIAL_SETTINGS.barRingBackgroundColor.clone();
  private _mBarRingOpacity: number = DEFAULT_MATERIAL_SETTINGS.barRingOpacity;
  private _mEvent: number = DEFAULT_MATERIAL_SETTINGS.event;
  private _mEventIntensity: number = DEFAULT_MATERIAL_SETTINGS.eventIntensity;
  private _mBarRingCount: number = DEFAULT_MATERIAL_SETTINGS.barRingCount;
  private _mBarRingSpeed: THREE.Vector2 =
    DEFAULT_MATERIAL_SETTINGS.barRingSpeed.clone();
  private _mBarRingAngle: number = DEFAULT_MATERIAL_SETTINGS.barRingAngle;
  private _mTriggerTimedEvent: number =
    DEFAULT_MATERIAL_SETTINGS.triggerTimedEvent;

  constructor(parentRef: any, renderer: WebGLRenderer) {
    this._gui = new GUI();
    this._parentRef = parentRef;
    this._renderer = renderer;
    this.planeControlsChanged = true;

    this.setupBackgroundFolder();
  }

  private setupBackgroundFolder(): void {
    const folderBackgroundPlane = this._gui.addFolder("Background");
    const thisRef = this; // Reference to the GUIManager instance

    const propsBackgroundPlane = {
      get backgroundColor() {
        return "#" + thisRef._mBackgroundColor.getHexString();
      },
      set backgroundColor(hexString: string) {
        thisRef._mBackgroundColor = new THREE.Color(hexString);
        // Update the parent's backgroundColor if available
        if (thisRef._parentRef.backgroundColor) {
          thisRef._parentRef.backgroundColor =
            thisRef._mBackgroundColor.clone();
        }
        thisRef.returnFocusToRenderer();
        thisRef.updateBackgrounds();
      },
      Mode: "Shader", // Default value
    };

    folderBackgroundPlane
      .addColor(propsBackgroundPlane, "backgroundColor")
      .name("Background Color");

    // Initialize the background color
    this.updateBackgrounds();
  }

  private updateBackgrounds(): void {
    // Update both the document body background and the THREE.js scene background
    const colorHex = "#" + this._mBackgroundColor.getHexString();

    // Update body background
    document.body.style.backgroundColor = colorHex;

    // Update THREE.js scene background if parent reference has access to the scene
    if (this._parentRef && this._parentRef._scene) {
      // Set the scene background color
      this._parentRef._scene.background = this._mBackgroundColor.clone();
    }
  }

  public get backgroundColor(): THREE.Color {
    return this._mBackgroundColor;
  }

  public set backgroundColor(v: string) {
    this._mBackgroundColor = new THREE.Color(v);
    this.updateBackgrounds();
  }

  public get planeControlsChanged() {
    const changed = this._planeControlsChanged;
    this._planeControlsChanged = false;
    return changed;
  }

  public set planeControlsChanged(v: boolean) {
    this._planeControlsChanged = v;
  }

  public get color(): THREE.Color {
    return this._mColor;
  }

  public set color(v: string) {
    this._mColor = new THREE.Color(v);
  }

  public get baseColor(): THREE.Color {
    return this._mBaseColor;
  }

  public set baseColor(v: string) {
    this._mBaseColor = new THREE.Color(v);
  }

  public get barRingForegroundColor(): THREE.Color {
    return this._mBarRingForegroundColor;
  }

  public set barRingForegroundColor(v: string) {
    this._mBarRingForegroundColor = new THREE.Color(v);
  }

  public get barRingBackgroundColor(): THREE.Color {
    return this._mBarRingBackgroundColor;
  }

  public set barRingBackgroundColor(v: string) {
    this._mBarRingBackgroundColor = new THREE.Color(v);
  }

  public get barRingOpacity(): number {
    return this._mBarRingOpacity;
  }

  public set barRingOpacity(v: number) {
    this._mBarRingOpacity = v;
  }

  public get event(): number {
    return this._mEvent;
  }

  public set event(v: number) {
    this._mEvent = v;
  }

  public get eventIntensity(): number {
    return this._mEventIntensity;
  }

  public set eventIntensity(v: number) {
    this._mEventIntensity = v;
  }

  public get barRingCount(): number {
    return this._mBarRingCount;
  }

  public set barRingCount(v: number) {
    this._mBarRingCount = v;
  }

  public get barRingSpeed(): THREE.Vector2 {
    return this._mBarRingSpeed;
  }

  public set barRingSpeed(v: THREE.Vector2) {
    this._mBarRingSpeed = v;
  }

  public get barRingAngle(): number {
    return this._mBarRingAngle;
  }

  public set barRingAngle(v: number) {
    this._mBarRingAngle = v;
  }

  public get triggerTimedEvent(): number {
    const eventDuration = this._mTriggerTimedEvent;
    this.triggerTimedEvent = 0.0;
    return eventDuration;
  }

  public set triggerTimedEvent(v: number) {
    this._mTriggerTimedEvent = v;
  }

  public setupPlaneMaterialFolder(): void {
    const folderPlaneMaterial = this._gui.addFolder("Plane Material");
    const thisRef = this;

    const [defaultMaterialName, defaultMaterial] = Array.from(
      this._planeMaterials.entries()
    )[0];

    this.planeMaterial = defaultMaterial;

    const planeMaterialProps = {
      material: defaultMaterialName,
      // Color controls
      get color() {
        return thisRef._mBaseColor.getHexString();
      },
      set color(hexString: string) {
        thisRef.color = hexString;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get baseColor() {
        return thisRef.baseColor.getHexString();
      },
      set baseColor(hexString: string) {
        thisRef.baseColor = hexString;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get barRingForegroundColor() {
        return thisRef.barRingForegroundColor.getHexString();
      },
      set barRingForegroundColor(hexString: string) {
        thisRef.barRingForegroundColor = hexString;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get barRingBackgroundColor() {
        return thisRef.barRingBackgroundColor.getHexString();
      },
      set barRingBackgroundColor(hexString: string) {
        thisRef.barRingBackgroundColor = hexString;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      // Numeric controls
      get barRingOpacity() {
        return thisRef.barRingOpacity;
      },
      set barRingOpacity(value: number) {
        thisRef.barRingOpacity = value;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get event() {
        return thisRef.event;
      },
      set event(value: number) {
        thisRef.event = value;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get eventIntensity() {
        return thisRef.eventIntensity;
      },
      set eventIntensity(value: number) {
        thisRef.eventIntensity = value;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get barRingCount() {
        return thisRef.barRingCount;
      },
      set barRingCount(value: number) {
        thisRef.barRingCount = value;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      // Vector controls - represented as separate X and Y inputs
      get barRingSpeedX() {
        return thisRef.barRingSpeed.x;
      },
      set barRingSpeedX(value: number) {
        thisRef.barRingSpeed.x = value;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get barRingSpeedY() {
        return thisRef.barRingSpeed.y;
      },
      set barRingSpeedY(value: number) {
        thisRef.barRingSpeed.y = value;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      // Angle as multiples of PI
      get barRingAngle() {
        return thisRef.barRingAngle;
      },
      set barRingAngle(value: number) {
        thisRef.barRingAngle = value;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      // Actions
      "Trigger Event": function () {
        thisRef.triggerTimedEvent = 2.0;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },
    };

    // Add color controls with color pickers
    folderPlaneMaterial
      .add(
        planeMaterialProps,
        "material",
        Array.from(this._planeMaterials.keys())
      )
      .name("Material")
      .onChange((materialName) => {
        console.log(materialName);
        const material = this._planeMaterials.get(materialName);
        if (material) {
          console.log(material);
          this.planeMaterial = material;
          thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      });
    folderPlaneMaterial
      .addColor(planeMaterialProps, "color")
      .name("Main Color");
    folderPlaneMaterial
      .addColor(planeMaterialProps, "baseColor")
      .name("Base Color");
    folderPlaneMaterial
      .addColor(planeMaterialProps, "barRingForegroundColor")
      .name("Ring Foreground");
    folderPlaneMaterial
      .addColor(planeMaterialProps, "barRingBackgroundColor")
      .name("Ring Background");

    // Add numeric sliders
    folderPlaneMaterial
      .add(planeMaterialProps, "barRingOpacity", 0.0, 1.0)
      .name("Ring and Bar Opacity")
      .step(0.01);
    folderPlaneMaterial
      .add(planeMaterialProps, "event", 0, 1)
      .name("Event")
      .step(1.0);
    folderPlaneMaterial
      .add(planeMaterialProps, "eventIntensity", 0, 1)
      .name("Event Intensity")
      .step(0.01);
    folderPlaneMaterial
      .add(planeMaterialProps, "barRingCount", 1, 100)
      .name("Bar/Ring Count")
      .step(1);

    // // Add vector controls
    const speedFolder = folderPlaneMaterial.addFolder("Speed Vector");
    speedFolder
      .add(planeMaterialProps, "barRingSpeedX", -5, 5)
      .name("X")
      .step(0.01);
    speedFolder
      .add(planeMaterialProps, "barRingSpeedY", -5, 5)
      .name("Y")
      .step(0.01);

    // Add angle control
    folderPlaneMaterial
      .add(planeMaterialProps, "barRingAngle", 0, 2)
      .name("Angle (× π)")
      .step(0.125);

    // Add action button
    folderPlaneMaterial.add(planeMaterialProps, "Trigger Event");

    // Initially open the folder
    folderPlaneMaterial.open();
  }

  public get planeMaterial(): PlaneMaterial | null {
    return this._planeMaterial;
  }

  public set planeMaterial(material: PlaneMaterial | null) {
    this._planeMaterial = material;

    // Change parent mesh material
    this._parentRef.setGUIControlledMeshesMaterial(material);
  }

  public get planeMaterials(): Map<string, PlaneMaterial> {
    return this._planeMaterials;
  }

  public addPlaneMaterial(material: PlaneMaterial, name: string): void {
    this._planeMaterials.set(name, material);
  }

  public listPlaneMaterials(): void {
    console.log(Array.from(this._planeMaterials));
  }

  private returnFocusToRenderer(): void {
    setTimeout(() => {
      this._renderer.domElement.focus();
    }, 0);
  }

  public update(): void {
    this.planeMaterial?.update({
      color: this.color,
      baseColor: this.baseColor,
      barRingForegroundColor: this.barRingForegroundColor,
      barRingBackgroundColor: this.barRingBackgroundColor,
      barRingOpacity: this.barRingOpacity,
      barRingCount: this.barRingCount,
      event: this.event,
      eventIntensity: this.eventIntensity,
      speed: this.barRingSpeed,
      angle: this.barRingAngle * Math.PI,
      triggerTimedEvent: this.triggerTimedEvent,
    });
  }

  // Public methods for external control
  public dispose(): void {
    if (this._gui) {
      this._gui.destroy();
    }
  }
}
