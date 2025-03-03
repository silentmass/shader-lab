import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { WebGLRenderer, Color, Vector2 } from "three";
import { PlaneMaterial } from "./materials/PlaneMaterial";

export class GUIManager {
  private gui: GUI;
  private parentRef: any; // Replace with your actual parent class type
  private renderer: WebGLRenderer;
  private planeMaterial: PlaneMaterial | null = null;
  private planeControlsChanged: boolean = false;

  constructor(parentRef: any, renderer: WebGLRenderer) {
    this.gui = new GUI();
    this.parentRef = parentRef;
    this.renderer = renderer;

    this.setupBackgroundFolder();
  }

  public setPlaneMaterial(material: PlaneMaterial): void {
    this.planeMaterial = material;
    this.setupPlaneMaterialFolder();
  }

  public hasControlsChanged(): boolean {
    const changed = this.planeControlsChanged;
    this.planeControlsChanged = false; // Reset the flag after checking
    return changed;
  }

  private setupBackgroundFolder(): void {
    const folderBackgroundPlane = this.gui.addFolder("Background");
    const thisRef = this; // Reference to the GUIManager instance

    const propsBackgroundPlane = {
      get Black() {
        return thisRef.parentRef.isBackgroundPlaneBlack;
      },
      set Black(v: boolean) {
        thisRef.parentRef.isBackgroundPlaneBlack = v;
        thisRef.returnFocusToRenderer();
      },
      Mode: "Shader", // Default value
      "Trigger Stimulus": function () {
        if (thisRef.parentRef.shader) {
          thisRef.parentRef.shader.triggerStimulus();
          thisRef.returnFocusToRenderer();
        }
      },
    };

    folderBackgroundPlane.add(propsBackgroundPlane, "Black");

    folderBackgroundPlane.add(propsBackgroundPlane, "Trigger Stimulus");
  }

  private setupPlaneMaterialFolder(): void {
    if (!this.planeMaterial) return;

    const folderPlaneMaterial = this.gui.addFolder("Plane Material");
    const thisRef = this;

    const planeMaterialProps = {
      // Color controls
      get color() {
        return thisRef.planeMaterial?.getColor().getHexString() || "";
      },
      set color(hexString: string) {
        if (thisRef.planeMaterial) {
          const changed = thisRef.planeMaterial.setColor(new Color(hexString));
          if (changed) thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      },

      get baseColor() {
        return thisRef.planeMaterial?.getBaseColor().getHexString() || "";
      },
      set baseColor(hexString: string) {
        if (thisRef.planeMaterial) {
          const changed = thisRef.planeMaterial.setBaseColor(
            new Color(hexString)
          );
          if (changed) thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      },

      get ringBarForegroundColor() {
        return (
          thisRef.planeMaterial?.getRingBarForegroundColor().getHexString() ||
          ""
        );
      },
      set ringBarForegroundColor(hexString: string) {
        if (thisRef.planeMaterial) {
          const changed = thisRef.planeMaterial.setRingBarForegroundColor(
            new Color(hexString)
          );
          if (changed) thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      },

      get ringBarBackgroundColor() {
        return (
          thisRef.planeMaterial?.getRingBarBackgroundColor().getHexString() ||
          ""
        );
      },
      set ringBarBackgroundColor(hexString: string) {
        if (thisRef.planeMaterial) {
          const changed = thisRef.planeMaterial.setRingBarBackgroundColor(
            new Color(hexString)
          );
          if (changed) thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      },

      // Numeric controls
      get event() {
        return thisRef.planeMaterial?.getEvent() || 1;
      },
      set event(value: number) {
        if (thisRef.planeMaterial) {
          const changed = thisRef.planeMaterial.setEvent(value);
          if (changed) thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      },

      get ringBarOpacity() {
        return thisRef.planeMaterial?.getRingBarOpacity() || 1.0;
      },
      set ringBarOpacity(value: number) {
        if (thisRef.planeMaterial) {
          const changed = thisRef.planeMaterial.setRingBarOpacity(value);
          if (changed) thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      },

      get eventIntensity() {
        return thisRef.planeMaterial?.getEventIntensity() || 1.0;
      },
      set eventIntensity(value: number) {
        if (thisRef.planeMaterial) {
          const changed = thisRef.planeMaterial.setEventIntensity(value);
          if (changed) thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      },

      get stripeCount() {
        return thisRef.planeMaterial?.getStripeCount() || 40.0;
      },
      set stripeCount(value: number) {
        if (thisRef.planeMaterial) {
          const changed = thisRef.planeMaterial.setStripeCount(value);
          if (changed) thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      },

      // Vector controls - represented as separate X and Y inputs
      get speedX() {
        return thisRef.planeMaterial?.getSpeed().x || -1.0;
      },
      set speedX(value: number) {
        if (thisRef.planeMaterial) {
          const currentSpeed = thisRef.planeMaterial.getSpeed();
          const newSpeed = new Vector2(value, currentSpeed.y);
          const changed = thisRef.planeMaterial.setSpeed(newSpeed);
          if (changed) thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      },

      get speedY() {
        return thisRef.planeMaterial?.getSpeed().y || 0.0;
      },
      set speedY(value: number) {
        if (thisRef.planeMaterial) {
          const currentSpeed = thisRef.planeMaterial.getSpeed();
          const newSpeed = new Vector2(currentSpeed.x, value);
          const changed = thisRef.planeMaterial.setSpeed(newSpeed);
          if (changed) thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      },

      // Angle as multiples of PI
      get anglePiFraction() {
        const angle = thisRef.planeMaterial?.getAngle() || Math.PI;
        return angle / Math.PI;
      },
      set anglePiFraction(value: number) {
        if (thisRef.planeMaterial) {
          const actualAngle = value * Math.PI;
          const changed = thisRef.planeMaterial.setAngle(actualAngle);
          if (changed) thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      },

      // Actions
      "Trigger Event": function () {
        if (thisRef.planeMaterial) {
          // Trigger the timed event that lasts for 2 seconds
          thisRef.planeMaterial.triggerTimedEvent(2.0);
          thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      },
    };

    // Add color controls with color pickers
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
      .name("Rings and Bars Opacity")
      .step(0.01);
    folderPlaneMaterial
      .add(planeMaterialProps, "eventIntensity", 0, 1)
      .name("Event Intensity")
      .step(0.01);
    folderPlaneMaterial
      .add(planeMaterialProps, "stripeCount", 1, 100)
      .name("Stripe Count")
      .step(1);

    // Add vector controls
    const speedFolder = folderPlaneMaterial.addFolder("Speed Vector");
    speedFolder.add(planeMaterialProps, "speedX", -5, 5).name("X").step(0.01);
    speedFolder.add(planeMaterialProps, "speedY", -5, 5).name("Y").step(0.01);

    // Add angle control
    folderPlaneMaterial
      .add(planeMaterialProps, "anglePiFraction", 0, 2)
      .name("Angle (× π)")
      .step(0.125);

    // Add action button
    folderPlaneMaterial.add(planeMaterialProps, "Trigger Event");

    // Initially open the folder
    folderPlaneMaterial.open();
  }

  private returnFocusToRenderer(): void {
    setTimeout(() => {
      this.renderer.domElement.focus();
    }, 0);
  }

  // Public methods for external control
  public dispose(): void {
    if (this.gui) {
      this.gui.destroy();
    }
  }
}
