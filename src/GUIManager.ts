import * as THREE from "three";
import * as Tone from "tone";
import { WebGLRenderer } from "three";
import PlaneMaterial, {
  DEFAULT_PLANE_UNIFORMS,
  IPlaneMaterialParameters,
} from "./materials/PlaneMaterial";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { ShaderLab } from "./ShaderLab";
import {
  DEFAULT_WATER_UNIFORMS,
  IWaterShaderMaterialParameters,
  WaterShaderMaterial,
} from "./materials/water/waterShaderMaterial";
import { DEFAULT_WATER_SIMULATION_UPDATE_UNIFORMS } from "./materials/water/watersimulation";

// Define an interface for material parameters
// Just a no change comment
export interface IMaterialParameters
  extends IPlaneMaterialParameters,
    IWaterShaderMaterialParameters {}

const DEFAULT_MATERIAL_SETTINGS = {
  color: DEFAULT_PLANE_UNIFORMS.color,
  baseColor: DEFAULT_PLANE_UNIFORMS.baseColor,
  barRingForegroundColor: DEFAULT_PLANE_UNIFORMS.barRingForegroundColor,
  barRingBackgroundColor: DEFAULT_PLANE_UNIFORMS.barRingBackgroundColor,
  barRingOpacity: DEFAULT_PLANE_UNIFORMS.barRingOpacity,
  event: DEFAULT_PLANE_UNIFORMS.event,
  eventIntensity: DEFAULT_PLANE_UNIFORMS.eventIntensity,
  barRingCount: DEFAULT_PLANE_UNIFORMS.barRingCount,
  barRingSpeed: DEFAULT_PLANE_UNIFORMS.speed,
  barRingAngle: DEFAULT_PLANE_UNIFORMS.angle,
  triggerTimedEvent: 0.0,
  laserIntensities: DEFAULT_WATER_UNIFORMS.lasers.map((e) => e.intensity),
  laserWidths: DEFAULT_WATER_UNIFORMS.lasers.map((e) => e.width),
  laserColors: DEFAULT_WATER_UNIFORMS.lasers.map((e) => e.color),
  laserOrigins: DEFAULT_WATER_UNIFORMS.lasers.map((e) => e.origin),
  laserDirections: DEFAULT_WATER_UNIFORMS.lasers.map((e) => e.direction),
  poolLightIntensity: DEFAULT_WATER_UNIFORMS.poolLightIntensity,
  poolLightRadius: DEFAULT_WATER_UNIFORMS.poolLightRadius,
  ...DEFAULT_WATER_SIMULATION_UPDATE_UNIFORMS,
};

export class GUIManager {
  private _gui: GUI;
  private _controllers: Map<string, any> = new Map();
  private _parentRef: ShaderLab;
  private _renderer: WebGLRenderer;

  private _planeMaterial: PlaneMaterial | WaterShaderMaterial | null = null;
  private _planeControlsChanged: boolean = false;
  private _planeMaterials: Map<string, PlaneMaterial | WaterShaderMaterial> =
    new Map();

  private _activeMeshId: string | null = null;

  // Key map for event triggers
  private _keyEventMap: Map<string, () => void> = new Map();
  private _keyEventActive: boolean = true;

  private _toneOscillator: Tone.Oscillator | null = null;
  private _toneTransportStarted: boolean = false;

  // Background settings
  private _backgroundColor: THREE.Color = new THREE.Color("#000000");

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

  private _mLaserIntensities: number[] =
    DEFAULT_MATERIAL_SETTINGS.laserIntensities;
  private _mLaserWidths: number[] = DEFAULT_MATERIAL_SETTINGS.laserWidths;
  private _mLaserColors: THREE.Color[] = DEFAULT_MATERIAL_SETTINGS.laserColors;
  private _mLaserOrigins: THREE.Vector3[] =
    DEFAULT_MATERIAL_SETTINGS.laserOrigins;
  private _mLaserDirections: THREE.Vector3[] =
    DEFAULT_MATERIAL_SETTINGS.laserDirections;
  private _mActiveLasers: number =
    DEFAULT_MATERIAL_SETTINGS.laserIntensities.length;

  private _mPoolLightIntensity: number =
    DEFAULT_MATERIAL_SETTINGS.poolLightIntensity;
  private _mPoolLightRadius: number = DEFAULT_MATERIAL_SETTINGS.poolLightRadius;

  private _mWaveSpeed: number = DEFAULT_MATERIAL_SETTINGS.waveSpeed;
  private _mWavePersistence: number = DEFAULT_MATERIAL_SETTINGS.wavePersistence;
  private _mWaveBaselineCorrection: number =
    DEFAULT_MATERIAL_SETTINGS.waveBaselineCorrection;

  constructor(parentRef: any, renderer: WebGLRenderer) {
    this._gui = new GUI();
    this._parentRef = parentRef;
    this._renderer = renderer;
    this.planeControlsChanged = true;

    this.setupBackgroundFolder();
    this.setupKeyEventHandlers();
  }

  private returnFocusToRenderer(): void {
    setTimeout(() => {
      this._renderer.domElement.focus();
    }, 0);
  }

  private updateBackgrounds(): void {
    // Update both the document body background and the THREE.js scene background
    const colorHex = "#" + this._backgroundColor.getHexString();

    // Update body background
    document.body.style.backgroundColor = colorHex;

    // Update THREE.js scene background if parent reference has access to the scene
    if (this._parentRef && this._parentRef._scene) {
      // Set the scene background color
      this._parentRef._scene.background = this._backgroundColor.clone();
    }
  }

  private updateGUIFromMeshUniforms(meshId: string): void {
    // Get mesh uniforms from the parent's MeshUniformsManager
    if (this._parentRef.meshUniformsManager) {
      const uniforms =
        this._parentRef.meshUniformsManager.getMeshUniforms(meshId);
      if (uniforms) {
        // Update GUI values based on the mesh's uniforms
        if (uniforms.uBaseColor) this._mBaseColor = uniforms.uBaseColor.clone();
        if (uniforms.uBarRingForegroundColor)
          this._mBarRingForegroundColor =
            uniforms.uBarRingForegroundColor.clone();
        if (uniforms.uBarRingBackgroundColor)
          this._mBarRingBackgroundColor =
            uniforms.uBarRingBackgroundColor.clone();

        // Signal that controls need updating
        this.planeControlsChanged = true;

        // Force GUI to update (you might need to implement this differently based on your GUI library)
        // this._gui.updateDisplay();
      }
    }
  }

  private setupBackgroundFolder(): void {
    const folderBackgroundPlane = this._gui.addFolder("Background");
    const thisRef = this; // Reference to the GUIManager instance

    const propsBackgroundPlane = {
      get backgroundColor() {
        return "#" + thisRef._backgroundColor.getHexString();
      },
      set backgroundColor(hexString: string) {
        thisRef._backgroundColor = new THREE.Color(hexString);
        // Update the parent's backgroundColor if available
        if (thisRef._parentRef.backgroundColor) {
          thisRef._parentRef.backgroundColor = thisRef._backgroundColor.clone();
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

  /**
   * Play a sound event with Tone.js
   * @param frequency Frequency of the oscillator (Hz)
   * @param duration Duration of the sound (seconds)
   */
  public playToneEvent(): void {
    // Make sure previous oscillators are disposed
    this.disposeToneResources();

    // Create a new oscillator
    this._toneOscillator = new Tone.Oscillator({
      frequency: 10000,
      type: "sine",
      // volume: -10, // Starting at a lower volume to prevent loudness
    }).toDestination();

    // Use scheduled events instead of transport for simple triggers
    Tone.getTransport().cancel(); // Clear all previous events
    Tone.getTransport().stop();
    this._toneOscillator.sync().start().stop("0.001");

    const now = Tone.now();
    Tone.getTransport().start(now).stop("+1.0");
    Tone.getTransport().loop = true;
    Tone.getTransport().loopEnd = 1 / 40;
  }

  /**
   * Clean up Tone.js resources
   */
  private disposeToneResources(): void {
    // Dispose of oscillator if it exists
    if (this._toneOscillator) {
      this._toneOscillator.dispose();
      this._toneOscillator = null;
    }

    // Stop transport if it was started
    if (this._toneTransportStarted) {
      Tone.getTransport().stop();
      Tone.getTransport().cancel(); // Cancel all scheduled events
      this._toneTransportStarted = false;
    }
  }

  /**
   * Initialize keyboard event handlers
   */
  private setupKeyEventHandlers(): void {
    // Define default key bindings
    this.registerKeyEvent("Space", () => {
      this.triggerEvent(2.0);
      console.log("Event triggered with Space key");

      // const synthA = new Tone.FMSynth().toDestination();
      // const osc = new Tone.Oscillator(10000, "sine").toDestination();
      // osc.sync().start().stop("0.001");

      // Tone.getTransport().start().stop("+1.0");
      // // set it to loop once a second
      // Tone.getTransport().loop = true;
      // Tone.getTransport().loopEnd = 1 / 40;

      this.playToneEvent();

      // all loops start when the Transport is started
      // synthA.triggerAttackRelease("c2", "8n");
    });

    this.registerKeyEvent("KeyE", () => {
      this.event = (this.event + 1) % 11; // Cycle through events 0-10
      this.updateControllerValue("event", this.event);
      console.log(`Event changed to: ${this.event}`);
    });

    this.registerKeyEvent("KeyI", () => {
      // Increase intensity by 0.1, capped at 1.0
      this.eventIntensity = Math.min(1.0, this.eventIntensity + 0.1);
      this.updateControllerValue("eventIntensity", this.eventIntensity);
      console.log(
        `Event intensity increased to: ${this.eventIntensity.toFixed(1)}`
      );
    });

    this.registerKeyEvent("KeyK", () => {
      // Decrease intensity by 0.1, floor at 0.0
      this.eventIntensity = Math.max(0.0, this.eventIntensity - 0.1);
      this.updateControllerValue("eventIntensity", this.eventIntensity);
      console.log(
        `Event intensity decreased to: ${this.eventIntensity.toFixed(1)}`
      );
    });

    // Add key listener to document
    document.addEventListener("keydown", this.handleKeyDown.bind(this));

    // Add info about key controls to the GUI
    this.addKeyControlsInfoFolder();
  }

  /**
   * Handle keydown events
   * @param event Keyboard event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this._keyEventActive) return;

    // Skip if user is typing in an input field
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const handler = this._keyEventMap.get(event.code);
    if (handler) {
      handler();
      this.planeControlsChanged = true;
      event.preventDefault(); // Prevent default browser behavior
    }
  }

  /**
   * Register a key event handler
   * @param keyCode The key code (e.g., 'Space', 'KeyE')
   * @param handler The function to execute when the key is pressed
   */
  public registerKeyEvent(keyCode: string, handler: () => void): void {
    this._keyEventMap.set(keyCode, handler);
  }

  /**
   * Unregister a key event handler
   * @param keyCode The key code to unregister
   */
  public unregisterKeyEvent(keyCode: string): void {
    this._keyEventMap.delete(keyCode);
  }

  /**
   * Enable or disable key event handling
   * @param active Whether key events should be processed
   */
  public setKeyEventsActive(active: boolean): void {
    this._keyEventActive = active;
  }

  /**
   * Add a folder to the GUI with information about keyboard controls
   */
  private addKeyControlsInfoFolder(): void {
    const folderKeyControls = this._gui.addFolder("Keyboard Controls");
    const thisRef = this;

    // Create an object with read-only properties for display
    const keyControlsInfo = {
      Space: "Trigger event",
      E: "Cycle through event types",
      I: "Increase event intensity (+0.1)",
      K: "Decrease event intensity (-0.1)",
    };

    // Add read-only text displays
    for (const [key, description] of Object.entries(keyControlsInfo)) {
      const controller = folderKeyControls.add(
        { [`${key}`]: description },
        `${key}`
      );
      controller.disable(); // Make it read-only
    }

    // Add toggle for enabling/disabling keyboard controls
    const keyboardControlsEnabled = {
      get enabled() {
        return thisRef._keyEventActive;
      },
      set enabled(value: boolean) {
        thisRef._keyEventActive = value;
        console.log(`Keyboard controls ${value ? "enabled" : "disabled"}`);
      },
    };

    folderKeyControls
      .add(keyboardControlsEnabled, "enabled")
      .name("Enable Keyboard Controls");

    folderKeyControls.open();
  }

  // Method to store a controller with a name
  public registerController(name: string, controller: any): void {
    this._controllers.set(name, controller);
  }

  // Method to get a controller by name
  public getController(name: string): any {
    return this._controllers.get(name);
  }

  // Method to update a controller value programmatically
  public updateControllerValue(name: string, value: any): void {
    const controller = this._controllers.get(name);
    if (controller) {
      controller.setValue(value);
      // Optional: trigger onChange event if the controller has one
      if (typeof controller.__onChange === "function") {
        controller.__onChange(value);
      }
    }
  }

  // Method to update multiple controllers at once
  public updateControllers(updates: Record<string, any>): void {
    Object.entries(updates).forEach(([name, value]) => {
      this.updateControllerValue(name, value);
    });
  }

  /**
   * Set material parameters programmatically
   * @param params Material parameters to update
   * @param updateGUI Whether to update the GUI controllers (default: true)
   */
  public setMaterialParameters(
    params: IMaterialParameters,
    updateGUI: boolean = true
  ): void {
    // Process color values - convert strings to THREE.Color if needed
    if (params.color) {
      this.color =
        typeof params.color === "string"
          ? new THREE.Color(params.color)
          : params.color.clone();

      if (updateGUI) {
        this.updateControllerValue("color", this.color.getHexString());
      }
    }

    if (params.baseColor) {
      this.baseColor =
        typeof params.baseColor === "string"
          ? new THREE.Color(params.baseColor)
          : params.baseColor.clone();

      if (updateGUI) {
        this.updateControllerValue("baseColor", this.baseColor.getHexString());
      }
    }

    if (params.barRingForegroundColor) {
      this.barRingForegroundColor =
        typeof params.barRingForegroundColor === "string"
          ? new THREE.Color(params.barRingForegroundColor)
          : params.barRingForegroundColor.clone();

      if (updateGUI) {
        this.updateControllerValue(
          "barRingForegroundColor",
          this.barRingForegroundColor.getHexString()
        );
      }
    }

    if (params.barRingBackgroundColor) {
      this.barRingBackgroundColor =
        typeof params.barRingBackgroundColor === "string"
          ? new THREE.Color(params.barRingBackgroundColor)
          : params.barRingBackgroundColor.clone();

      if (updateGUI) {
        this.updateControllerValue(
          "barRingBackgroundColor",
          this.barRingBackgroundColor.getHexString()
        );
      }
    }

    // Handle numeric parameters
    if (params.barRingOpacity !== undefined) {
      this.barRingOpacity = params.barRingOpacity;
      if (updateGUI) {
        this.updateControllerValue("barRingOpacity", params.barRingOpacity);
      }
    }

    if (params.barRingCount !== undefined) {
      this.barRingCount = params.barRingCount;
      if (updateGUI) {
        this.updateControllerValue("barRingCount", params.barRingCount);
      }
    }

    if (params.event !== undefined) {
      this._mEvent = params.event;
      if (updateGUI) {
        this.updateControllerValue("event", params.event);
      }
    }

    if (params.eventIntensity !== undefined) {
      this.eventIntensity = params.eventIntensity;
      if (updateGUI) {
        this.updateControllerValue("eventIntensity", params.eventIntensity);
      }
    }

    // Handle vector components
    if (params.barRingSpeedX !== undefined) {
      this.barRingSpeed.x = params.barRingSpeedX;
      if (updateGUI) {
        this.updateControllerValue("barRingSpeedX", params.barRingSpeedX);
      }
    }

    if (params.barRingSpeedY !== undefined) {
      this.barRingSpeed.y = params.barRingSpeedY;
      if (updateGUI) {
        this.updateControllerValue("barRingSpeedY", params.barRingSpeedY);
      }
    }

    if (params.barRingAngle !== undefined) {
      this.barRingAngle = params.barRingAngle;
      if (updateGUI) {
        this.updateControllerValue("barRingAngle", params.barRingAngle);
      }
    }

    // Mark controls as changed to trigger a material update
    this.planeControlsChanged = true;
  }

  /**
   * Get current material parameters
   * @returns Current material parameter values
   */
  public getMaterialParameters(): IMaterialParameters {
    return {
      color: this.color.clone(),
      baseColor: this.baseColor.clone(),
      barRingForegroundColor: this.barRingForegroundColor.clone(),
      barRingBackgroundColor: this.barRingBackgroundColor.clone(),
      barRingOpacity: this.barRingOpacity,
      event: this._mEvent,
      eventIntensity: this.eventIntensity,
      barRingCount: this.barRingCount,
      barRingSpeedX: this.barRingSpeed.x,
      barRingSpeedY: this.barRingSpeed.y,
      barRingAngle: this.barRingAngle,
    };
  }

  /**
   * Trigger a timed event programmatically
   * @param duration Event duration (default: 2.0)
   */
  public triggerEvent(duration: number = 2.0): void {
    this.triggerTimedEvent = duration;
    this.planeControlsChanged = true;
  }

  public addPlaneMaterial(
    material: PlaneMaterial | WaterShaderMaterial,
    name: string
  ): void {
    this._planeMaterials.set(name, material);
  }

  /**
   * Set the active material by name
   * @param materialName Name of the material to activate
   * @returns True if successful, false if material not found
   */
  public setActiveMaterial(materialName: string): boolean {
    const material = this._planeMaterials.get(materialName);
    if (material) {
      this.planeMaterial = material;
      this.updateControllerValue("material", materialName);
      this.planeControlsChanged = true;
      return true;
    }
    return false;
  }

  public setupMeshSelector(defaultMeshName?: string): void {
    // First remove any existing mesh selector folder
    const existingFolder = this._gui.folders.find(
      (f) => f._title === "Mesh Selection"
    );
    if (typeof existingFolder?.hide === "function") {
      existingFolder.hide();
    }

    const meshFolder = this._gui.addFolder("Mesh Selection");
    const thisRef = this;

    // Get all mesh names - make sure they have unique names
    const meshes = this._parentRef.guiControlledMeshes;
    console.log(
      "Available meshes for selector:",
      meshes.map((m) => m.name)
    );

    // If no meshes, return
    if (meshes.length === 0) {
      console.warn("No meshes available for selector");
      return;
    }

    const meshNames = meshes.map((mesh) => mesh.name || "Unnamed Mesh");

    // Find the active mesh name using the default if provided, or use the first one
    const activeName =
      defaultMeshName && meshNames.includes(defaultMeshName)
        ? defaultMeshName
        : this._parentRef.activeMesh?.name || meshNames[0];

    const meshProps = {
      activeMesh: activeName,
    };

    // Add mesh selector dropdown
    meshFolder
      .add(meshProps, "activeMesh", meshNames)
      .name("Active Mesh")
      .onChange((selectedMeshName: string) => {
        // Find the selected mesh by name
        const selectedMesh = thisRef._parentRef.guiControlledMeshes.find(
          (mesh) => mesh.name === selectedMeshName
        );

        // Update the active mesh in the parent component
        if (selectedMesh) {
          thisRef._parentRef.setActiveMesh(selectedMesh);
        }
      });

    meshFolder.open();
  }

  public setupMeshSelectionFolder(): void {
    const folderMeshSelection = this._gui.addFolder("Mesh Selection");
    const thisRef = this;

    // Get mesh names from parent's guiControlledMeshes
    const meshNames = thisRef._parentRef.guiControlledMeshes.map(
      (mesh: THREE.Mesh, index: number) => mesh.name || `Mesh ${index}`
    );

    const meshSelectionProps = {
      activeMesh: meshNames[0] || "None",
    };

    folderMeshSelection
      .add(meshSelectionProps, "activeMesh", meshNames)
      .name("Active Mesh")
      .onChange((meshName: string) => {
        // Find the mesh index by name
        const meshIndex = meshNames.indexOf(meshName);
        if (meshIndex >= 0) {
          const mesh = thisRef._parentRef.guiControlledMeshes[meshIndex];
          if (mesh) {
            thisRef._activeMeshId = mesh.uuid;

            // Update GUI controls to reflect this mesh's specific uniforms
            thisRef.updateGUIFromMeshUniforms(mesh.uuid);
          }
        }
      });
  }

  public setupPlaneMaterialFolder(defaultMaterialName?: string): void {
    const thisRef = this;

    // If default material name is provided and exists, use it; otherwise use the first material
    let initialMaterialName = defaultMaterialName;
    let initialMaterial: PlaneMaterial | WaterShaderMaterial | null = null;

    if (initialMaterialName && this._planeMaterials.has(initialMaterialName)) {
      initialMaterial = this._planeMaterials.get(initialMaterialName) || null;
    } else {
      const firstEntry = Array.from(this._planeMaterials.entries())[0];
      if (firstEntry) {
        [initialMaterialName, initialMaterial] = firstEntry;
      }
    }

    if (initialMaterial) {
      this.planeMaterial = initialMaterial;
    }

    const planeMaterialProps = {
      material: defaultMaterialName,
      // Color controls
      get color() {
        return thisRef.color.getHexString();
      },
      set color(hexString: string) {
        thisRef.color = new THREE.Color(`#${hexString.replace("#", "")}`);
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get baseColor() {
        return thisRef.baseColor.getHexString();
      },
      set baseColor(hexString: string) {
        thisRef.baseColor = new THREE.Color(`#${hexString.replace("#", "")}`);
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get barRingForegroundColor() {
        return thisRef.barRingForegroundColor.getHexString();
      },
      set barRingForegroundColor(hexString: string) {
        thisRef.barRingForegroundColor = new THREE.Color(
          `#${hexString.replace("#", "")}`
        );
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get barRingBackgroundColor() {
        return thisRef.barRingBackgroundColor.getHexString();
      },
      set barRingBackgroundColor(hexString: string) {
        thisRef.barRingBackgroundColor = new THREE.Color(
          `#${hexString.replace("#", "")}`
        );
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

    const folderPlaneMaterial = this._gui.addFolder("Plane Material");

    const materialController = folderPlaneMaterial
      .add(
        planeMaterialProps,
        "material",
        Array.from(this._planeMaterials.keys())
      )
      .name("Material")
      .onChange((materialName) => {
        if (!materialName) {
          return;
        }
        const material = this._planeMaterials.get(materialName);
        if (material) {
          console.log(material);
          this.planeMaterial = material;
          thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        }
      });
    this.registerController("material", materialController);

    // Add color controls with color pickers

    const colorController = folderPlaneMaterial
      .addColor(planeMaterialProps, "color")
      .name("Main Color");
    this.registerController("color", colorController);

    const baseColorController = folderPlaneMaterial
      .addColor(planeMaterialProps, "baseColor")
      .name("Base Color");
    this.registerController("baseColor", baseColorController);

    const barRingForegroundColorController = folderPlaneMaterial
      .addColor(planeMaterialProps, "barRingForegroundColor")
      .name("Ring Foreground");
    this.registerController(
      "barRingForegroundColor",
      barRingForegroundColorController
    );

    const barRingBackgroundColorController = folderPlaneMaterial
      .addColor(planeMaterialProps, "barRingBackgroundColor")
      .name("Ring Background");
    this.registerController(
      "barRingBackgroundColor",
      barRingBackgroundColorController
    );

    // Add numeric sliders
    const barRingOpacityController = folderPlaneMaterial
      .add(planeMaterialProps, "barRingOpacity", 0.0, 1.0)
      .name("Ring and Bar Opacity")
      .step(0.01);
    this.registerController("barRingOpacity", barRingOpacityController);

    const eventController = folderPlaneMaterial
      .add(planeMaterialProps, "event", 0, 10)
      .name("Event")
      .step(1.0);
    this.registerController("event", eventController);

    const eventIntensityController = folderPlaneMaterial
      .add(planeMaterialProps, "eventIntensity", 0, 1)
      .name("Event Intensity")
      .step(0.01);
    this.registerController("eventIntensity", eventIntensityController);

    const barRingCountController = folderPlaneMaterial
      .add(planeMaterialProps, "barRingCount", 1, 100)
      .name("Bar/Ring Count")
      .step(1);
    this.registerController("barRingCount", barRingCountController);

    // Add vector controls
    const speedFolder = folderPlaneMaterial.addFolder("Speed Vector");

    const barRingSpeedXController = speedFolder
      .add(planeMaterialProps, "barRingSpeedX", -5, 5)
      .name("X")
      .step(0.01);
    this.registerController("barRingSpeedX", barRingSpeedXController);

    const barRingSpeedYController = speedFolder
      .add(planeMaterialProps, "barRingSpeedY", -5, 5)
      .name("Y")
      .step(0.01);
    this.registerController("barRingSpeedY", barRingSpeedYController);

    // Add angle control
    const barRingAngleController = folderPlaneMaterial
      .add(planeMaterialProps, "barRingAngle", 0, 2)
      .name("Angle (× π)")
      .step(0.125);
    this.registerController("barRingAngle", barRingAngleController);

    // Add action button
    const triggerEventController = folderPlaneMaterial.add(
      planeMaterialProps,
      "Trigger Event"
    );
    this.registerController("Trigger Event", triggerEventController);

    // Initially open the folder
    folderPlaneMaterial.open();
  }

  public setupWaterControlsFolder(): void {
    const folderWaterControls = this._gui.addFolder("Water Effects");
    const thisRef = this;

    // Define the number of lasers to support
    const MAX_LASERS = 3;

    // LASER CONTROLS
    const laserFolder = folderWaterControls.addFolder("Laser Lights");

    // Add a control for the number of active lasers
    const laserMainProps = {
      get activeLasers() {
        return thisRef._mActiveLasers;
      },
      set activeLasers(v: number) {
        thisRef._mActiveLasers = v;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },
    };

    const activeLasersController = laserFolder
      .add(laserMainProps, "activeLasers", 0, MAX_LASERS)
      .name("Active Lasers")
      .step(1);
    this.registerController("activeLasers", activeLasersController);

    // Create a subfolder for each laser
    for (let i = 0; i < MAX_LASERS; i++) {
      const laserSubfolder = laserFolder.addFolder(`Laser ${i + 1}`);

      const laserProps = {
        get intensity() {
          return thisRef._mLaserIntensities[i];
        },
        set intensity(v: number) {
          thisRef._mLaserIntensities[i] = v;
          thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        },

        get width() {
          return thisRef._mLaserWidths[i];
        },
        set width(v: number) {
          thisRef._mLaserWidths[i] = v;
          thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        },

        get color() {
          return "#" + thisRef._mLaserColors[i].getHexString();
        },
        set color(hexString: string) {
          thisRef._mLaserColors[i] = new THREE.Color(hexString);
          thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        },

        get originX() {
          return thisRef._mLaserOrigins[i].x;
        },
        set originX(v: number) {
          thisRef._mLaserOrigins[i].x = v;
          thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        },

        get originY() {
          return thisRef._mLaserOrigins[i].y;
        },
        set originY(v: number) {
          thisRef._mLaserOrigins[i].y = v;
          thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        },

        get originZ() {
          return thisRef._mLaserOrigins[i].z;
        },
        set originZ(v: number) {
          thisRef._mLaserOrigins[i].z = v;
          thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        },

        get directionX() {
          return thisRef._mLaserDirections[i].x;
        },
        set directionX(v: number) {
          thisRef._mLaserDirections[i].x = v;
          thisRef._mLaserDirections[i].normalize();
          thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        },

        get directionY() {
          return thisRef._mLaserDirections[i].y;
        },
        set directionY(v: number) {
          thisRef._mLaserDirections[i].y = v;
          thisRef._mLaserDirections[i].normalize();
          thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        },

        get directionZ() {
          return thisRef._mLaserDirections[i].z;
        },
        set directionZ(v: number) {
          thisRef._mLaserDirections[i].z = v;
          thisRef._mLaserDirections[i].normalize();
          thisRef.planeControlsChanged = true;
          thisRef.returnFocusToRenderer();
        },
      };

      // Add laser controls for this specific laser
      const intensityController = laserSubfolder
        .add(laserProps, "intensity", 0, 5)
        .name("Intensity")
        .step(0.1);
      this.registerController(`laser${i}Intensity`, intensityController);

      const widthController = laserSubfolder
        .add(laserProps, "width", 0.005, 0.1)
        .name("Width")
        .step(0.005);
      this.registerController(`laser${i}Width`, widthController);

      const colorController = laserSubfolder
        .addColor(laserProps, "color")
        .name("Color");
      this.registerController(`laser${i}Color`, colorController);

      // Origin controls
      const originFolder = laserSubfolder.addFolder("Origin");

      const originXController = originFolder
        .add(laserProps, "originX", -1, 1)
        .name("X")
        .step(0.1);
      this.registerController(`laser${i}OriginX`, originXController);

      const originYController = originFolder
        .add(laserProps, "originY", -1, 1)
        .name("Y")
        .step(0.1);
      this.registerController(`laser${i}OriginY`, originYController);

      const originZController = originFolder
        .add(laserProps, "originZ", -1, 1)
        .name("Z")
        .step(0.1);
      this.registerController(`laser${i}OriginZ`, originZController);

      // Direction controls
      const directionFolder = laserSubfolder.addFolder("Direction");

      const directionXController = directionFolder
        .add(laserProps, "directionX", -1, 1)
        .name("X")
        .step(0.1);
      this.registerController(`laser${i}DirectionX`, directionXController);

      const directionYController = directionFolder
        .add(laserProps, "directionY", -1, 1)
        .name("Y")
        .step(0.1);
      this.registerController(`laser${i}DirectionY`, directionYController);

      const directionZController = directionFolder
        .add(laserProps, "directionZ", -1, 1)
        .name("Z")
        .step(0.1);
      this.registerController(`laser${i}DirectionZ`, directionZController);
    }

    // POOL LIGHT CONTROLS - keep this part the same
    const poolLightsFolder = folderWaterControls.addFolder("Pool Lights");

    const poolLightProps = {
      get poolLightIntensity() {
        return thisRef._mPoolLightIntensity;
      },
      set poolLightIntensity(v: number) {
        thisRef._mPoolLightIntensity = v;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get poolLightRadius() {
        return thisRef._mPoolLightRadius;
      },
      set poolLightRadius(v: number) {
        thisRef._mPoolLightRadius = v;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },
    };

    const poolLightIntensityController = poolLightsFolder
      .add(poolLightProps, "poolLightIntensity", 0, 5)
      .name("Intensity")
      .step(0.1);
    this.registerController("poolLightIntensity", poolLightIntensityController);

    const poolLightRadiusController = poolLightsFolder
      .add(poolLightProps, "poolLightRadius", 0.1, 1.0)
      .name("Radius")
      .step(0.1);
    this.registerController("poolLightRadius", poolLightRadiusController);

    // Open folders
    folderWaterControls.open();
  }

  public setupWaterSimulationControls(): void {
    const waterPhysicsFolder = this._gui.addFolder("Water Physics");
    const thisRef = this;
    const waterPhysicsProps = {
      get waveSpeed() {
        return thisRef._mWaveSpeed;
      },
      set waveSpeed(v: number) {
        thisRef._mWaveSpeed = v;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get wavePersistence() {
        return thisRef._mWavePersistence;
      },
      set wavePersistence(v: number) {
        thisRef._mWavePersistence = v;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },

      get waveBaselineCorrection() {
        return thisRef._mWaveBaselineCorrection;
      },
      set waveBaselineCorrection(v: number) {
        thisRef._mWaveBaselineCorrection = v;
        thisRef.planeControlsChanged = true;
        thisRef.returnFocusToRenderer();
      },
    };

    // Wave speed control
    const waveSpeedController = waterPhysicsFolder
      .add(
        waterPhysicsProps, // Default value
        "waveSpeed",
        0.1, // Min value (slower waves)
        2.0 // Max value (faster waves)
      )
      .name("Wave Speed")
      .step(0.1);
    this.registerController("waveSpeed", waveSpeedController);

    // Wave persistence control
    const wavePersistenceController = waterPhysicsFolder
      .add(
        waterPhysicsProps, // Default value
        "wavePersistence",
        0.9, // Min value (quick decay)
        0.999 // Max value (very slow decay)
      )
      .name("Wave Persistence")
      .step(0.001);
    this.registerController("wavePersistence", wavePersistenceController);

    // Baseline correction control
    const waveBaselineCorrectionController = waterPhysicsFolder
      .add(
        waterPhysicsProps, // Default value
        "waveBaselineCorrection",
        0.0001, // Min value (very slow flattening)
        0.01 // Max value (quick flattening)
      )
      .name("Surface Tension")
      .step(0.0001);
    this.registerController(
      "waveBaselineCorrection",
      waveBaselineCorrectionController
    );

    // Presets for different water types
    const waterPresets: Map<string, () => void> = new Map([
      [
        "Slow",
        () => {
          waveSpeedController.setValue(0.2);
          wavePersistenceController.setValue(0.995);
          waveBaselineCorrectionController.setValue(0.1);
        },
      ],
      [
        "Water",
        () => {
          waveSpeedController.setValue(2.0);
          wavePersistenceController.setValue(0.95);
          waveBaselineCorrectionController.setValue(0.0005);
        },
      ],
      [
        "Slow Water",
        () => {
          waveSpeedController.setValue(2.0);
          wavePersistenceController.setValue(0.965);
          waveBaselineCorrectionController.setValue(0.0001);
        },
      ],
    ]);

    // Add presets to GUI
    const presetController = waterPhysicsFolder
      .add({ preset: "Slow" }, "preset", Array.from(waterPresets.keys()))
      .name("Water Type");
    this.registerController("preset", presetController);

    presetController.onChange((value: string) => {
      const presetFunction = waterPresets.get(value);
      if (presetFunction) {
        presetFunction();

        // Update GUI controllers to match the new values
        // This requires keeping references to the controllers
      }
    });

    waterPhysicsFolder.open();
  }

  public get backgroundColor(): THREE.Color {
    return this._backgroundColor;
  }

  public set backgroundColor(v: string) {
    this._backgroundColor = new THREE.Color(v);
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

  public set color(v: THREE.Color) {
    this._mColor = v;
  }

  public get baseColor(): THREE.Color {
    return this._mBaseColor;
  }

  public set baseColor(v: THREE.Color) {
    this._mBaseColor = v;
  }

  public get barRingForegroundColor(): THREE.Color {
    return this._mBarRingForegroundColor;
  }

  public set barRingForegroundColor(v: THREE.Color) {
    this._mBarRingForegroundColor = v;
  }

  public get barRingBackgroundColor(): THREE.Color {
    return this._mBarRingBackgroundColor;
  }

  public set barRingBackgroundColor(v: THREE.Color) {
    this._mBarRingBackgroundColor = v;
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

  // Laser getters/setters

  public get laserIntensities(): number[] {
    return this._mLaserIntensities;
  }
  public set laserIntensities(v: number[]) {
    this._mLaserIntensities = v;
  }

  public get laserWidths(): number[] {
    return this._mLaserWidths;
  }
  public set laserWidths(v: number[]) {
    this._mLaserWidths = v;
  }

  public get laserColors(): THREE.Color[] {
    return this._mLaserColors.map((c) => c.clone());
  }
  public set laserColors(v: THREE.Color[]) {
    this._mLaserColors = v.map((c) => c.clone());
  }

  public get laserOrigins(): THREE.Vector3[] {
    return this._mLaserOrigins.map((v) => v.clone());
  }
  public set laserOrigins(v: THREE.Vector3[]) {
    this._mLaserOrigins = v.map((vec) => vec.clone());
  }

  public get laserDirections(): THREE.Vector3[] {
    return this._mLaserDirections.map((v) => v.clone());
  }
  public set laserDirections(v: THREE.Vector3[]) {
    this._mLaserDirections = v.map((vec) => vec.clone());
  }

  public get activeLasers(): number {
    return this._mActiveLasers;
  }
  public set activeLasers(v: number) {
    this._mActiveLasers = v;
  }

  // Pool light getters/setters

  public get poolLightIntensity(): number {
    return this._mPoolLightIntensity;
  }
  public set poolLightIntensity(v: number) {
    this._mPoolLightIntensity = v;
  }

  public get poolLightRadius(): number {
    return this._mPoolLightRadius;
  }
  public set poolLightRadius(v: number) {
    this._mPoolLightRadius = v;
  }

  public get planeMaterial(): PlaneMaterial | WaterShaderMaterial | null {
    return this._planeMaterial;
  }

  public set planeMaterial(
    material: PlaneMaterial | WaterShaderMaterial | null
  ) {
    this._planeMaterial = material;

    // Change parent mesh material
    this._parentRef.setGUIControlledMeshesMaterial(material);
  }

  public get planeMaterials(): Map<
    string,
    PlaneMaterial | WaterShaderMaterial
  > {
    return this._planeMaterials;
  }

  public update(): void {
    // Update the current material as before
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

      // New water-specific parameters
      // Update laser arrays
      laserIntensities: this.laserIntensities,
      laserWidths: this.laserWidths,
      laserColors: this.laserColors,
      laserOrigins: this.laserOrigins,
      laserDirections: this.laserDirections,
      activeLasers: this.activeLasers,
      poolLightIntensity: this.poolLightIntensity,
      poolLightRadius: this.poolLightRadius,

      waveSpeed: this._mWaveSpeed,
      wavePersistence: this._mWavePersistence,
      waveBaselineCorrection: this._mWaveBaselineCorrection,

      triggerTimedEvent: this.triggerTimedEvent,
    });

    // If we have an active mesh, save its current settings
    if (this._activeMeshId && this._parentRef.meshUniformsManager) {
      // Save the current GUI state to the mesh's specific uniforms
      this._parentRef.meshUniformsManager.updateMeshUniforms(
        this._activeMeshId,
        {
          uBaseColor: this.baseColor.clone(),
          uBarRingForegroundColor: this.barRingForegroundColor.clone(),
          uBarRingBackgroundColor: this.barRingBackgroundColor.clone(),
          // Add other uniforms as needed
        }
      );
    }
  }

  // Public methods for external control
  public dispose(): void {
    this.disposeToneResources();

    // Remove event listener when disposing
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));

    if (this._gui) {
      this._gui.destroy();
    }
  }
}
