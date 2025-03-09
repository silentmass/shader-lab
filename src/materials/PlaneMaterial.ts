import * as THREE from "three";
import { stripVersion } from "./MaterialUtils";

// Define default values at the module level
const DEFAULT_UNIFORMS = {
  time: 1.0,
  color: new THREE.Color(0x00cccc),
  baseColor: new THREE.Color("grey"),
  barRingForegroundColor: new THREE.Color("blue"),
  barRingBackgroundColor: new THREE.Color("red"),
  barRingOpacity: 1.0,
  event: 0,
  eventIntensity: 1.0,
  eventProgress: 0.0,
  barRingCount: 40.0,
  speed: new THREE.Vector2(1.0, 0.0),
  angle: Math.PI / 1.0,
  texture: null as THREE.Texture | null,
  geometryCenter: new THREE.Vector3(0, 0, 0),
  cameraPosition: new THREE.Vector3(8, 5, 5),
  lightPosition: new THREE.Vector3(10, 10, 10),
  lightColor: new THREE.Color(1.0, 1.0, 1.0),
};

interface Uniforms {
  uTime?: number;
  uColor?: THREE.Color;
  uBaseColor?: THREE.Color;
  uBarRingForegroundColor?: THREE.Color;
  uBarRingBackgroundColor?: THREE.Color;
  uBarRingOpacity?: number;
  uEvent?: number;
  uEventIntensity?: number;
  uEventProgress?: number;
  uBarRingCount?: number;
  uSpeed?: THREE.Vector2;
  uAngle?: number;
  uTexture?: THREE.Texture | null;
  uGeometryCenter?: THREE.Vector3;
  uCameraPosition?: THREE.Vector3;
  uLightPosition?: THREE.Vector3;
  uLightColor?: THREE.Color;
}

interface PlaneOptions {
  uniforms?: Uniforms;
}

export class PlaneMaterial extends THREE.RawShaderMaterial {
  private _clock: THREE.Clock;
  private _time: number = DEFAULT_UNIFORMS.time;
  private _color: THREE.Color = DEFAULT_UNIFORMS.color.clone();
  private _baseColor: THREE.Color = DEFAULT_UNIFORMS.baseColor.clone();
  private _barRingForegroundColor: THREE.Color =
    DEFAULT_UNIFORMS.barRingForegroundColor.clone();
  private _barRingBackgroundColor: THREE.Color =
    DEFAULT_UNIFORMS.barRingBackgroundColor.clone();
  private _barRingOpacity: number = DEFAULT_UNIFORMS.barRingOpacity;
  private _barRingCount: number = DEFAULT_UNIFORMS.barRingCount;
  private _speed: THREE.Vector2 = DEFAULT_UNIFORMS.speed.clone();
  private _angle: number = DEFAULT_UNIFORMS.angle;
  private _texture: THREE.Texture | null = DEFAULT_UNIFORMS.texture;
  private _geometryCenter: THREE.Vector3 =
    DEFAULT_UNIFORMS.geometryCenter.clone();
  private _cameraPosition: THREE.Vector3 =
    DEFAULT_UNIFORMS.cameraPosition.clone();
  private _lightPosition: THREE.Vector3 =
    DEFAULT_UNIFORMS.lightPosition.clone();
  private _lightColor: THREE.Color = DEFAULT_UNIFORMS.lightColor.clone();

  // For timed events
  private _eventStartTime: number = 0;
  private _eventDuration: number = 0;
  private _eventActive: boolean = false;
  private _event: number = DEFAULT_UNIFORMS.event;
  private _eventIntensity: number = DEFAULT_UNIFORMS.eventIntensity;
  private _eventProgress: number = DEFAULT_UNIFORMS.eventProgress;

  constructor(
    vertexShader: string,
    fragmentShader: string,
    options?: PlaneOptions
  ) {
    // Initialize all uniform values, using defaults when needed
    const uniforms = {
      uTime: { value: options?.uniforms?.uTime ?? DEFAULT_UNIFORMS.time },
      uColor: {
        value:
          options?.uniforms?.uColor?.clone() ?? DEFAULT_UNIFORMS.color.clone(),
      },
      uBaseColor: {
        value:
          options?.uniforms?.uBaseColor?.clone() ??
          DEFAULT_UNIFORMS.baseColor.clone(),
      },
      uBarRingForegroundColor: {
        value:
          options?.uniforms?.uBarRingForegroundColor?.clone() ??
          DEFAULT_UNIFORMS.barRingForegroundColor.clone(),
      },
      uBarRingBackgroundColor: {
        value:
          options?.uniforms?.uBarRingBackgroundColor?.clone() ??
          DEFAULT_UNIFORMS.barRingBackgroundColor.clone(),
      },
      uBarRingOpacity: {
        value:
          options?.uniforms?.uBarRingOpacity ?? DEFAULT_UNIFORMS.barRingOpacity,
      },
      uEvent: { value: options?.uniforms?.uEvent ?? DEFAULT_UNIFORMS.event },
      uEventIntensity: {
        value:
          options?.uniforms?.uEventIntensity ?? DEFAULT_UNIFORMS.eventIntensity,
      },
      uEventProgress: {
        value:
          options?.uniforms?.uEventProgress ?? DEFAULT_UNIFORMS.eventProgress,
      },
      uBarRingCount: {
        value:
          options?.uniforms?.uBarRingCount ?? DEFAULT_UNIFORMS.barRingCount,
      },
      uSpeed: {
        value:
          options?.uniforms?.uSpeed?.clone() ?? DEFAULT_UNIFORMS.speed.clone(),
      },
      uAngle: { value: options?.uniforms?.uAngle ?? DEFAULT_UNIFORMS.angle },
      uTexture: {
        value: options?.uniforms?.uTexture ?? DEFAULT_UNIFORMS.texture,
      },
      uGeometryCenter: {
        value:
          options?.uniforms?.uGeometryCenter ?? DEFAULT_UNIFORMS.geometryCenter,
      },
      uCameraPosition: {
        value:
          options?.uniforms?.uCameraPosition ?? DEFAULT_UNIFORMS.cameraPosition,
      },
      uLightPosition: {
        value:
          options?.uniforms?.uLightPosition ?? DEFAULT_UNIFORMS.lightPosition,
      },
      uLightColor: {
        value: options?.uniforms?.uLightColor ?? DEFAULT_UNIFORMS.lightColor,
      },
    };

    // Call super with prepared uniforms
    super({
      uniforms,
      vertexShader: stripVersion(vertexShader),
      fragmentShader: stripVersion(fragmentShader),
      glslVersion: THREE.GLSL3,
      side: THREE.DoubleSide,
      transparent: true,
    });

    // Initialize private variables to match uniforms
    this._color = uniforms.uColor.value.clone();
    this._baseColor = uniforms.uBaseColor.value.clone();
    this._barRingForegroundColor =
      uniforms.uBarRingForegroundColor.value.clone();
    this._barRingBackgroundColor =
      uniforms.uBarRingBackgroundColor.value.clone();
    this._barRingOpacity = uniforms.uBarRingOpacity.value;
    this._event = uniforms.uEvent.value;
    this._eventIntensity = uniforms.uEventIntensity.value;
    this._barRingCount = uniforms.uBarRingCount.value;
    this._speed = uniforms.uSpeed.value.clone();
    this._angle = uniforms.uAngle.value;
    this._texture = uniforms.uTexture.value;
    this._geometryCenter = uniforms.uGeometryCenter.value.clone();
    this._cameraPosition = uniforms.uCameraPosition.value.clone();
    this._lightPosition = uniforms.uLightPosition.value.clone();
    this._lightColor = uniforms.uLightColor.value.clone();

    this._clock = new THREE.Clock();
    this._clock.start();

    // Load the texture
    this.loadTexture();
  }

  /**
   * Loads the texture and updates the uniform
   */
  private loadTexture(): void {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/assets/images/stimulus.png",
      (loadedTexture) => {
        // Configure texture properties
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;

        // Store the texture and update uniform
        this._texture = loadedTexture;
        this.uniforms.uTexture.value = this._texture;
      },
      () => console.log("Loading shader texture..."),
      (error) => console.warn("Error loading shader texture", error)
    );
  }

  /**
   * Resets all uniforms to their default values
   */
  public resetToDefaults(): void {
    this.setColor(DEFAULT_UNIFORMS.color.clone());
    this.setBaseColor(DEFAULT_UNIFORMS.baseColor.clone());
    this.setBarRingForegroundColor(
      DEFAULT_UNIFORMS.barRingForegroundColor.clone()
    );
    this.setBarRingBackgroundColor(
      DEFAULT_UNIFORMS.barRingBackgroundColor.clone()
    );
    this.setBarRingOpacity(DEFAULT_UNIFORMS.barRingOpacity);
    this.setEvent(DEFAULT_UNIFORMS.event);
    this.setEventIntensity(DEFAULT_UNIFORMS.eventIntensity);
    this.setBarRingCount(DEFAULT_UNIFORMS.barRingCount);
    this.setSpeed(DEFAULT_UNIFORMS.speed.clone());
    this.setAngle(DEFAULT_UNIFORMS.angle);
    this.setGeometryCenter(DEFAULT_UNIFORMS.geometryCenter.clone());
    this.setLightPosition(DEFAULT_UNIFORMS.lightPosition.clone());
    this.setLightColor(DEFAULT_UNIFORMS.lightColor.clone());

    // Reset event state
    this._eventActive = false;
    this._eventProgress = 0;
    this.uniforms.uEventProgress.value = 0;
  }

  /**
   * Sets the color uniform only if the value has changed
   * @param color The new color value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setColor(color: THREE.Color): boolean {
    if (!this.color.equals(color)) {
      this.color = color.clone();
      this.uniforms.uColor.value = this.color;
      return true;
    }
    return false;
  }

  /**
   * Sets the base color uniform only if the value has changed
   * @param color The new base color value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setBaseColor(color: THREE.Color): boolean {
    if (!this.baseColor.equals(color)) {
      this.baseColor = color.clone();
      this.uniforms.uBaseColor.value = this.baseColor;
      return true;
    }
    return false;
  }

  /**
   * Sets the ring bar foreground color uniform only if the value has changed
   * @param color The new foreground color value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setBarRingForegroundColor(color: THREE.Color): boolean {
    if (!this.barRingForegroundColor.equals(color)) {
      this.barRingForegroundColor = color.clone();
      this.uniforms.uBarRingForegroundColor.value = this.barRingForegroundColor;
      return true;
    }
    return false;
  }

  /**
   * Sets the ring bar background color uniform only if the value has changed
   * @param color The new background color value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setBarRingBackgroundColor(color: THREE.Color): boolean {
    if (!this.barRingBackgroundColor.equals(color)) {
      this.barRingBackgroundColor = color.clone();
      this.uniforms.uBarRingBackgroundColor.value = this.barRingBackgroundColor;
      return true;
    }
    return false;
  }

  /**
   * Sets the event opacity uniform only if the value has changed
   * @param opacity The new intensity value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setBarRingOpacity(opacity: number): boolean {
    if (this.barRingOpacity !== opacity) {
      this.barRingOpacity = opacity;
      this.uniforms.uBarRingOpacity.value = this.barRingOpacity;
      return true;
    }
    return false;
  }

  /**
   * Sets the event uniform only if the value has changed
   * @param event The new event value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setEvent(event: number): boolean {
    if (this.event !== event) {
      this.event = event;
      this.uniforms.uEvent.value = this.event;
      return true;
    }
    return false;
  }

  /**
   * Triggers event 1 for a specified duration in seconds
   * @param duration How long the event should last in seconds
   */
  public triggerTimedEvent(duration: number = 2.0): void {
    this.eventStartTime = this.clock.getElapsedTime();
    this.eventDuration = duration;
    this.eventActive = true;
  }

  /**
   * Sets the event intensity uniform only if the value has changed
   * @param intensity The new intensity value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setEventIntensity(intensity: number): boolean {
    if (this.eventIntensity !== intensity) {
      this.eventIntensity = intensity;
      this.uniforms.uEventIntensity.value = this.eventIntensity;
      return true;
    }
    return false;
  }

  /**
   * Sets the bar/ring count uniform only if the value has changed
   * @param count The new stripe count value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setBarRingCount(count: number): boolean {
    if (this.barRingCount !== count) {
      this.barRingCount = count;
      this.uniforms.uBarRingCount.value = this.barRingCount;
      return true;
    }
    return false;
  }

  /**
   * Sets the speed uniform only if the value has changed
   * @param speed The new speed value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setSpeed(speed: THREE.Vector2): boolean {
    if (!this.speed.equals(speed)) {
      this.speed = speed.clone();
      this.uniforms.uSpeed.value = this.speed;
      return true;
    }
    return false;
  }

  /**
   * Sets the angle uniform only if the value has changed
   * @param angle The new angle value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setAngle(angle: number): boolean {
    if (this.angle !== angle) {
      this.angle = angle;
      this.uniforms.uAngle.value = this.angle;
      return true;
    }
    return false;
  }

  /**
   * Sets the geometry center uniform only if the value has changed
   * @param position The new geometry center value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setGeometryCenter(position: THREE.Vector3): boolean {
    if (this.geometryCenter !== position) {
      this.geometryCenter = position;
      this.uniforms.uGeometryCenter.value = this.geometryCenter;
      return true;
    }
    return false;
  }

  /**
   * Sets the camera position uniform only if the value has changed
   * @param position The new camera position value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setCameraPosition(position: THREE.Vector3): boolean {
    if (this.cameraPosition !== position) {
      this.cameraPosition = position;
      this.uniforms.uCameraPosition.value = this.cameraPosition;
      return true;
    }
    return false;
  }

  /**
   * Sets the light position uniform only if the value has changed
   * @param position The new light position value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setLightPosition(position: THREE.Vector3): boolean {
    if (this.lightPosition !== position) {
      this.lightPosition = position;
      this.uniforms.uLightPosition.value = this.lightPosition;
      return true;
    }
    return false;
  }

  /**
   * Sets the light color uniform only if the value has changed
   * @param color The new light color value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setLightColor(color: THREE.Color): boolean {
    if (this.lightColor !== color) {
      this.lightColor = color;
      this.uniforms.uLightColor.value = this.lightColor;
      return true;
    }
    return false;
  }

  /**
   * Updates the material uniforms
   * @param params Optional parameters to update various uniforms
   * @returns Object containing information about which uniforms were updated
   */
  public update(params?: {
    color?: THREE.Color;
    baseColor?: THREE.Color;
    barRingForegroundColor?: THREE.Color;
    barRingBackgroundColor?: THREE.Color;
    barRingOpacity?: number;
    event?: number;
    eventIntensity?: number;
    barRingCount?: number;
    speed?: THREE.Vector2;
    angle?: number;
    triggerTimedEvent?: number;
    geometryCenter?: THREE.Vector3;
    cameraPosition?: THREE.Vector3;
    lightPosition?: THREE.Vector3;
    lightColor?: THREE.Color;
  }): { updatedUniforms: string[] } {
    const updatedUniforms: string[] = [];

    // Always update time
    const currentTime = this.clock.getElapsedTime();
    if (this.time !== currentTime) {
      this.time = currentTime;
      this.uniforms.uTime.value = this.time;
      updatedUniforms.push("uTime");
    }

    // Check if a timed event needs to end
    if (this.eventActive) {
      this.eventProgress =
        (currentTime - this.eventStartTime) / this.eventDuration;
      this.uniforms.uEventProgress.value =
        1.0 - Math.min(1.0, Math.max(0.0, this.eventProgress));

      if (this.eventProgress >= 1.0) {
        this.eventActive = false;
        this.uniforms.uEventProgress.value = 0.0;
        updatedUniforms.push("uEvent");
        this.eventDuration = 0.0;
      }
    }

    // Update other uniforms if provided and only if they changed
    if (params) {
      if (params.color && this.setColor(params.color)) {
        updatedUniforms.push("uColor");
      }

      if (params.baseColor && this.setBaseColor(params.baseColor)) {
        updatedUniforms.push("uBaseColor");
      }

      if (
        params.barRingForegroundColor &&
        this.setBarRingForegroundColor(params.barRingForegroundColor)
      ) {
        updatedUniforms.push("uBarRingForegroundColor");
      }

      if (
        params.barRingBackgroundColor &&
        this.setBarRingBackgroundColor(params.barRingBackgroundColor)
      ) {
        updatedUniforms.push("uBarRingBackgroundColor");
      }

      if (
        params.barRingOpacity !== undefined &&
        this.setBarRingOpacity(params.barRingOpacity)
      ) {
        updatedUniforms.push("uBarRingOpacity");
      }

      if (params.event !== undefined && this.setEvent(params.event)) {
        updatedUniforms.push("uEvent");
      }

      if (
        params.eventIntensity !== undefined &&
        this.setEventIntensity(params.eventIntensity)
      ) {
        updatedUniforms.push("uEventIntensity");
      }

      if (
        params.barRingCount !== undefined &&
        this.setBarRingCount(params.barRingCount)
      ) {
        updatedUniforms.push("uBarRingCount");
      }

      if (params.speed && this.setSpeed(params.speed)) {
        updatedUniforms.push("uSpeed");
      }

      if (params.angle !== undefined && this.setAngle(params.angle)) {
        updatedUniforms.push("uAngle");
      }

      if (
        params.geometryCenter &&
        this.setGeometryCenter(params.geometryCenter)
      ) {
        updatedUniforms.push("uGeometryCenter");
      }

      if (
        params.cameraPosition &&
        this.setCameraPosition(params.cameraPosition)
      ) {
        updatedUniforms.push("uCameraPosition");
      }

      if (params.lightPosition && this.setLightPosition(params.lightPosition)) {
        updatedUniforms.push("uLightPosition");
      }

      if (params.lightColor && this.setLightColor(params.lightColor)) {
        updatedUniforms.push("uLightColor");
      }

      if (
        params.triggerTimedEvent !== undefined &&
        params.triggerTimedEvent > 0.0
      ) {
        this.triggerTimedEvent(params.triggerTimedEvent);
      }
    }

    return { updatedUniforms };
  }

  // Setter methods for the private properties
  public set time(v: number) {
    this._time = v;
  }

  public set eventProgress(v: number) {
    this._eventProgress = v;
  }

  public set eventStartTime(v: number) {
    this._eventStartTime = v;
  }

  public set eventDuration(v: number) {
    this._eventDuration = v;
  }

  public set eventActive(v: boolean) {
    this._eventActive = v;
  }

  public set clock(v: THREE.Clock) {
    this._clock = v;
  }

  public set color(v: THREE.Color) {
    this._color = v.clone();
  }

  public set baseColor(v: THREE.Color) {
    this._baseColor = v.clone();
  }

  public set barRingForegroundColor(v: THREE.Color) {
    this._barRingForegroundColor = v.clone();
  }

  public set barRingBackgroundColor(v: THREE.Color) {
    this._barRingBackgroundColor = v.clone();
  }

  public set barRingOpacity(v: number) {
    this._barRingOpacity = v;
  }

  public set event(v: number) {
    this._event = v;
  }

  public set eventIntensity(v: number) {
    this._eventIntensity = v;
  }

  public set barRingCount(v: number) {
    this._barRingCount = v;
  }

  public set speed(v: THREE.Vector2) {
    this._speed = v.clone();
  }

  public set angle(v: number) {
    this._angle = v;
  }

  public set geometryCenter(v: THREE.Vector3) {
    this._geometryCenter = v.clone();
  }

  public set cameraPosition(v: THREE.Vector3) {
    this._cameraPosition = v.clone();
  }

  public set lightPosition(v: THREE.Vector3) {
    this._lightPosition = v.clone();
  }

  public set lightColor(v: THREE.Color) {
    this._lightColor = v.clone();
  }

  // Getter methods for the private properties
  public get time(): number {
    return this._time;
  }

  public get eventProgress(): number {
    return this._eventProgress;
  }

  public get eventStartTime(): number {
    return this._eventStartTime;
  }

  public get eventDuration(): number {
    return this._eventDuration;
  }

  public get eventActive(): boolean {
    return this._eventActive;
  }

  public get clock(): THREE.Clock {
    return this._clock;
  }

  public get color(): THREE.Color {
    return this._color.clone();
  }

  public get baseColor(): THREE.Color {
    return this._baseColor.clone();
  }

  public get barRingForegroundColor(): THREE.Color {
    return this._barRingForegroundColor.clone();
  }

  public get barRingBackgroundColor(): THREE.Color {
    return this._barRingBackgroundColor.clone();
  }

  public get barRingOpacity(): number {
    return this._barRingOpacity;
  }

  public get event(): number {
    return this._event;
  }

  public get eventIntensity(): number {
    return this._eventIntensity;
  }

  public get barRingCount(): number {
    return this._barRingCount;
  }

  public get speed(): THREE.Vector2 {
    return this._speed.clone();
  }

  public get angle(): number {
    return this._angle;
  }

  public get geometryCenter(): THREE.Vector3 {
    return this._geometryCenter;
  }

  public get cameraPosition(): THREE.Vector3 {
    return this._cameraPosition;
  }

  public get lightPosition(): THREE.Vector3 {
    return this._lightPosition;
  }

  public get lightColor(): THREE.Color {
    return this._lightColor;
  }
}
