export enum GameEventType {
  BALL_COLLISION = "ballCollision",
  BRICK_DESTROYED = "brickDestroyed",
  PADDLE_HIT = "paddleHit",
  LEVEL_COMPLETE = "levelComplete",
  GAME_OVER = "gameOver",
  POWER_UP = "powerUp",
}

export interface GameEventData {
  type: GameEventType;
  position?: { x: number; y: number }; // Optional position where the event occurred
  intensity?: number; // Optional intensity of the event (0.0 to 1.0)
  color?: string; // Optional color related to the event
  extraData?: any; // Any additional event-specific data
}

export interface IMaterialGameEvents {
  /**
   * Handle a game event by updating material properties
   * @param event The game event data
   * @returns boolean indicating if the event was handled
   */
  handleGameEvent(event: GameEventData): boolean;

  /**
   * Check if this material can handle a specific event type
   * @param eventType The event type to check
   * @returns boolean indicating if the material can handle this event
   */
  canHandleEvent(eventType: GameEventType): boolean;
}
