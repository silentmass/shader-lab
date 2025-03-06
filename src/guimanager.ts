import * as THREE from "three";
import { WebGLRenderer, Color, Vector2 } from "three";
import { PlaneMaterial } from "./materials/PlaneMaterial";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export class GUIManager {
  private _gui: GUI;
  private _parentRef: any; // Replace with your actual parent class type
  private _renderer: WebGLRenderer;

  private _planeMaterial: PlaneMaterial | null = null;
  private _planeControlsChanged: boolean = false;
  private _planeMaterials: Map<string, PlaneMaterial> = new Map();

  // Material settings
  private _mColor: THREE.Color = new THREE.Color("pink");
  private _mBaseColor: THREE.Color = new THREE.Color("gray");
  private _mRingBarForegroundColor: THREE.Color = new THREE.Color("black");
  private _mRingBarBackgroundColor: THREE.Color = new THREE.Color("white");
  private _mRingBarOpacity: number = 1.0;
  private _mEvent: number = 0;
  private _mEventIntensity: number = 1.0;
  private _mBarRingCount: number = 10;
  private _mBarRingSpeed: THREE.Vector2 = new THREE.Vector2(1.0, 0.0);
  private _mBarRingAngle: number = 0.0;
  private _mTriggerTimedEvent: number = 0.0;

  constructor(parentRef: any, renderer: WebGLRenderer) {
    this._gui = new GUI();
    this._parentRef = parentRef;
    this._renderer = renderer;

    this.setupBackgroundFolder();
  }

  private setupBackgroundFolder(): void {
    const folderBackgroundPlane = this._gui.addFolder("Background");
    const thisRef = this; // Reference to the GUIManager instance

    const propsBackgroundPlane = {
      get Black() {
        return thisRef._parentRef.isBackgroundBlack;
      },
      set Black(v: boolean) {
        thisRef._parentRef.isBackgroundBlack = v;
        thisRef.returnFocusToRenderer();
      },
      Mode: "Shader", // Default value
    };

    folderBackgroundPlane.add(propsBackgroundPlane, "Black");
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

  public get ringBarForegroundColor(): THREE.Color {
    return this._mRingBarForegroundColor;
  }

  public set ringBarForegroundColor(v: string) {
    this._mRingBarForegroundColor = new THREE.Color(v);
  }

  public get ringBarBackgroundColor(): THREE.Color {
    return this._mRingBarBackgroundColor;
  }

  public set ringBarBackgroundColor(v: string) {
    this._mRingBarBackgroundColor = new THREE.Color(v);
  }

  public get ringBarOpacity(): number {
    return this._mRingBarOpacity;
  }

  public set ringBarOpacity(v: number) {
    this._mRingBarOpacity = v;
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

      get ringBarForegroundColor() {
        return thisRef.ringBarForegroundColor.getHexString();
      },
      set ringBarForegroundColor(hexString: string) {
        thisRef.ringBarForegroundColor = hexString;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get ringBarBackgroundColor() {
        return thisRef.ringBarBackgroundColor.getHexString();
      },
      set ringBarBackgroundColor(hexString: string) {
        thisRef.ringBarBackgroundColor = hexString;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      // Numeric controls
      get ringBarOpacity() {
        return thisRef.ringBarOpacity;
      },
      set ringBarOpacity(value: number) {
        thisRef.ringBarOpacity = value;
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
      .addColor(planeMaterialProps, "ringBarForegroundColor")
      .name("Ring Foreground");
    folderPlaneMaterial
      .addColor(planeMaterialProps, "ringBarBackgroundColor")
      .name("Ring Background");

    // Add numeric sliders
    folderPlaneMaterial
      .add(planeMaterialProps, "ringBarOpacity", 0, 1)
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

    // Change parent plane material
    this._parentRef.setPlaneMaterial(material);
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
      ringBarForegroundColor: this.ringBarForegroundColor,
      ringBarBackgroundColor: this.ringBarBackgroundColor,
      ringBarOpacity: this.ringBarOpacity,
      ringBarCount: this.barRingCount,
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
