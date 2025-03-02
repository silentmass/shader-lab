import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { WebGLRenderer } from "three";

export class GUIManager {
  private gui: GUI;
  private parentRef: any; // Replace with your actual parent class type
  private renderer: WebGLRenderer;

  constructor(parentRef: any, renderer: WebGLRenderer) {
    this.gui = new GUI();
    this.parentRef = parentRef;
    this.renderer = renderer;

    this.setupBackgroundFolder();
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
