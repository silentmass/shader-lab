import Stats from "three/addons/libs/stats.module.js";

export class StatsManager {
  private stats: Stats;
  private statsContainer: HTMLDivElement;

  constructor(position?: {
    bottom?: number;
    left?: number;
    top?: number;
    right?: number;
  }) {
    // Default position is bottom-left
    const pos = {
      bottom: position?.bottom ?? 10,
      left: position?.left ?? 10,
      top: position?.top,
      right: position?.right,
    };

    // Create stats instance
    this.stats = new Stats();

    // Create container element
    this.statsContainer = document.createElement("div");

    // Set CSS position
    let cssText = "position: absolute; z-index: 10000;";
    if (pos.bottom !== undefined) cssText += ` bottom: ${pos.bottom}px;`;
    if (pos.left !== undefined) cssText += ` left: ${pos.left}px;`;
    if (pos.top !== undefined) cssText += ` top: ${pos.top}px;`;
    if (pos.right !== undefined) cssText += ` right: ${pos.right}px;`;

    this.statsContainer.style.cssText = cssText;

    // Configure stats DOM element
    this.stats.dom.style.position = "relative";

    // Add stats to container and container to document
    this.statsContainer.appendChild(this.stats.dom);
    document.body.appendChild(this.statsContainer);
  }

  /**
   * Begin stats measurement cycle
   * Call this at the start of your animation frame
   */
  public begin(): void {
    this.stats.begin();
  }

  /**
   * End stats measurement cycle
   * Call this at the end of your animation frame
   */
  public end(): void {
    this.stats.end();
  }

  /**
   * Update stats (alternative to begin/end pattern)
   * Only use this if you're not using begin/end
   */
  public update(): void {
    this.stats.update();
  }

  /**
   * Show stats panel
   */
  public show(): void {
    this.statsContainer.style.display = "block";
  }

  /**
   * Hide stats panel
   */
  public hide(): void {
    this.statsContainer.style.display = "none";
  }

  /**
   * Toggle stats visibility
   */
  public toggle(): void {
    if (this.statsContainer.style.display === "none") {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Change panel (0: FPS, 1: MS, 2: MB)
   * @param panelIndex Panel index (0-2)
   */
  public setPanel(panelIndex: number): void {
    if (panelIndex >= 0 && panelIndex <= 2) {
      this.stats.showPanel(panelIndex);
    }
  }

  /**
   * Remove stats from DOM and clean up
   */
  public dispose(): void {
    if (this.statsContainer && this.statsContainer.parentNode) {
      this.statsContainer.parentNode.removeChild(this.statsContainer);
    }
  }
}
