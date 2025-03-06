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
  speed: new THREE.Vector2(-1.0, 0.0),
  angle: Math.PI / 1.0,
  texture: null as THREE.Texture | null,
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
    this.setStripeCount(DEFAULT_UNIFORMS.barRingCount);
    this.setSpeed(DEFAULT_UNIFORMS.speed.clone());
    this.setAngle(DEFAULT_UNIFORMS.angle);

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
    if (!this._color.equals(color)) {
      this._color = color.clone();
      this.uniforms.uColor.value = this._color;
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
    if (!this._baseColor.equals(color)) {
      this._baseColor = color.clone();
      this.uniforms.uBaseColor.value = this._baseColor;
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
    if (!this._barRingForegroundColor.equals(color)) {
      this._barRingForegroundColor = color.clone();
      this.uniforms.uBarRingForegroundColor.value =
        this._barRingForegroundColor;
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
    if (!this._barRingBackgroundColor.equals(color)) {
      this._barRingBackgroundColor = color.clone();
      this.uniforms.uBarRingBackgroundColor.value =
        this._barRingBackgroundColor;
      return true;
    }
    return false;
  }

  /**
   * Sets the event intensity uniform only if the value has changed
   * @param intensity The new intensity value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setBarRingOpacity(opacity: number): boolean {
    if (this._barRingOpacity !== opacity) {
      this._barRingOpacity = opacity;
      this.uniforms.uBarRingOpacity.value = this._barRingOpacity;
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
    if (this._event !== event) {
      this._event = event;
      this.uniforms.uEvent.value = this._event;
      return true;
    }
    return false;
  }

  /**
   * Triggers event 1 for a specified duration in seconds
   * @param duration How long the event should last in seconds
   */
  public triggerTimedEvent(duration: number = 2.0): void {
    this._eventStartTime = this._clock.getElapsedTime();
    this._eventDuration = duration;
    this._eventActive = true;
  }

  /**
   * Sets the event intensity uniform only if the value has changed
   * @param intensity The new intensity value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setEventIntensity(intensity: number): boolean {
    if (this._eventIntensity !== intensity) {
      this._eventIntensity = intensity;
      this.uniforms.uEventIntensity.value = this._eventIntensity;
      return true;
    }
    return false;
  }

  /**
   * Sets the stripe count uniform only if the value has changed
   * @param count The new stripe count value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setStripeCount(count: number): boolean {
    if (this._barRingCount !== count) {
      this._barRingCount = count;
      this.uniforms.uBarRingCount.value = this._barRingCount;
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
    if (!this._speed.equals(speed)) {
      this._speed = speed.clone();
      this.uniforms.uSpeed.value = this._speed;
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
    if (this._angle !== angle) {
      this._angle = angle;
      this.uniforms.uAngle.value = this._angle;
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
  }): { updatedUniforms: string[] } {
    const updatedUniforms: string[] = [];

    // Always update time
    const currentTime = this._clock.getElapsedTime();
    if (this._time !== currentTime) {
      this._time = currentTime;
      this.uniforms.uTime.value = this._time;
      updatedUniforms.push("uTime");
    }

    // Check if a timed event needs to end
    if (this._eventActive) {
      this._eventProgress =
        (currentTime - this._eventStartTime) / this._eventDuration;
      this.uniforms.uEventProgress.value =
        1.0 - Math.min(1.0, Math.max(0.0, this._eventProgress));

      if (this._eventProgress >= 1.0) {
        this._eventActive = false;
        this.uniforms.uEventProgress.value = 0.0;
        updatedUniforms.push("uEvent");
        this._eventDuration = 0.0;
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
        this.setStripeCount(params.barRingCount)
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
        params.triggerTimedEvent !== undefined &&
        params.triggerTimedEvent > 0.0
      ) {
        this.triggerTimedEvent(params.triggerTimedEvent);
      }
    }

    return { updatedUniforms };
  }

  // Getter methods for the private properties
  public getColor(): THREE.Color {
    return this._color.clone();
  }

  public getBaseColor(): THREE.Color {
    return this._baseColor.clone();
  }

  public getBarRingForegroundColor(): THREE.Color {
    return this._barRingForegroundColor.clone();
  }

  public getBarRingBackgroundColor(): THREE.Color {
    return this._barRingBackgroundColor.clone();
  }

  public getBarRingOpacity(): number {
    return this._barRingOpacity;
  }

  public getEvent(): number {
    return this._event;
  }

  public getEventIntensity(): number {
    return this._eventIntensity;
  }

  public getBarRingCount(): number {
    return this._barRingCount;
  }

  public getSpeed(): THREE.Vector2 {
    return this._speed.clone();
  }

  public getAngle(): number {
    return this._angle;
  }
}
