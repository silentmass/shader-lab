import * as THREE from "three";
import vertexShader from "../glsl/plane-shader/main.vert";
// import fragmentShader from "../glsl/plane-shader/main.frag";
// import fragmentShader from "../glsl/plane-shader/gaussian.frag";
// import fragmentShader from "../glsl/plane-shader/stripes.frag";
import fragmentShader from "../glsl/plane-shader/concentricCircles.frag";
import { stripVersion } from "./MaterialUtils";

export class PlaneMaterial extends THREE.RawShaderMaterial {
  private _clock: THREE.Clock;
  private _time: number = 1.0;
  private _color: THREE.Color = new THREE.Color(0x00cccc);
  private _baseColor: THREE.Color = new THREE.Color("grey");
  private _ringBarForegroundColor: THREE.Color = new THREE.Color("blue");
  private _ringBarBackgroundColor: THREE.Color = new THREE.Color("red");
  private _event: number = 0;
  private _eventIntensity: number = 1.0;
  private _stripeCount: number = 40.0;
  private _speed: THREE.Vector2 = new THREE.Vector2(-1.0, 0.0);
  private _angle: number = Math.PI / 1.0;
  private _texture: THREE.Texture | null = null;

  // For timed events
  private _eventStartTime: number = 0;
  private _eventDuration: number = 0;
  private _eventActive: boolean = false;

  constructor() {
    super({
      uniforms: {
        uTime: { value: 1.0 },
        uColor: { value: new THREE.Color(0x00cccc) },
        uBaseColor: { value: new THREE.Color("grey") },
        uRingBarForegroundColor: { value: new THREE.Color("blue") },
        uRingBarBackgroundColor: { value: new THREE.Color("red") },
        uEvent: { value: 0 },
        uEventIntensity: { value: 1.0 },
        uStripeCount: { value: 40.0 },
        uSpeed: { value: new THREE.Vector2(-1.0, 0.0) },
        uAngle: { value: Math.PI / 1.0 },
        uTexture: { value: null }, // This will hold our texture
      },
      vertexShader: stripVersion(vertexShader),
      fragmentShader: stripVersion(fragmentShader),
      glslVersion: THREE.GLSL3,
      side: THREE.DoubleSide,
      transparent: true,
    });
    this._clock = new THREE.Clock();
    this._clock.start();

    // Load the texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/assets/images/stimulus.png",
      (loadedTexture) => {
        // Configure texture properties if needed
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;

        // Store the texture as a private variable
        this._texture = loadedTexture;

        // Update the uniform
        this.uniforms.uTexture.value = this._texture;
      },
      () => console.log("Loading shader texture..."),
      (error) => console.warn("Error loading shader texture", error)
    );
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
  public setRingBarForegroundColor(color: THREE.Color): boolean {
    if (!this._ringBarForegroundColor.equals(color)) {
      this._ringBarForegroundColor = color.clone();
      this.uniforms.uRingBarForegroundColor.value =
        this._ringBarForegroundColor;
      return true;
    }
    return false;
  }

  /**
   * Sets the ring bar background color uniform only if the value has changed
   * @param color The new background color value
   * @returns Boolean indicating whether the uniform was updated
   */
  public setRingBarBackgroundColor(color: THREE.Color): boolean {
    if (!this._ringBarBackgroundColor.equals(color)) {
      this._ringBarBackgroundColor = color.clone();
      this.uniforms.uRingBarBackgroundColor.value =
        this._ringBarBackgroundColor;
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
    this.setEvent(1); // Set to event 1
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
    if (this._stripeCount !== count) {
      this._stripeCount = count;
      this.uniforms.uStripeCount.value = this._stripeCount;
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
    ringBarForegroundColor?: THREE.Color;
    ringBarBackgroundColor?: THREE.Color;
    event?: number;
    eventIntensity?: number;
    stripeCount?: number;
    speed?: THREE.Vector2;
    angle?: number;
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
      const elapsedEventTime = currentTime - this._eventStartTime;
      if (elapsedEventTime >= this._eventDuration) {
        this._eventActive = false;
        this.setEvent(0); // Reset event to 0
        updatedUniforms.push("uEvent");
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
        params.ringBarForegroundColor &&
        this.setRingBarForegroundColor(params.ringBarForegroundColor)
      ) {
        updatedUniforms.push("uRingBarForegroundColor");
      }

      if (
        params.ringBarBackgroundColor &&
        this.setRingBarBackgroundColor(params.ringBarBackgroundColor)
      ) {
        updatedUniforms.push("uRingBarBackgroundColor");
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
        params.stripeCount !== undefined &&
        this.setStripeCount(params.stripeCount)
      ) {
        updatedUniforms.push("uStripeCount");
      }

      if (params.speed && this.setSpeed(params.speed)) {
        updatedUniforms.push("uSpeed");
      }

      if (params.angle !== undefined && this.setAngle(params.angle)) {
        updatedUniforms.push("uAngle");
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

  public getRingBarForegroundColor(): THREE.Color {
    return this._ringBarForegroundColor.clone();
  }

  public getRingBarBackgroundColor(): THREE.Color {
    return this._ringBarBackgroundColor.clone();
  }

  public getEvent(): number {
    return this._event;
  }

  public getEventIntensity(): number {
    return this._eventIntensity;
  }

  public getStripeCount(): number {
    return this._stripeCount;
  }

  public getSpeed(): THREE.Vector2 {
    return this._speed.clone();
  }

  public getAngle(): number {
    return this._angle;
  }
}
