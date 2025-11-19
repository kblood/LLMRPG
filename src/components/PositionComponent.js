import { Component } from './Component.js';

/**
 * Position component that stores the entity's location in 2D space
 * Maintains current and previous positions for interpolation
 */
export class PositionComponent extends Component {
  /**
   * Creates a new PositionComponent
   * @param {number} [x=0] - The x coordinate
   * @param {number} [y=0] - The y coordinate
   */
  constructor(x = 0, y = 0) {
    super('position');

    /** @type {number} Current x coordinate */
    this.x = x;

    /** @type {number} Current y coordinate */
    this.y = y;

    /** @type {number} Previous x coordinate (used for interpolation) */
    this.previousX = x;

    /** @type {number} Previous y coordinate (used for interpolation) */
    this.previousY = y;
  }

  /**
   * Updates the position and stores the previous position
   * @param {number} x - New x coordinate
   * @param {number} y - New y coordinate
   */
  setPosition(x, y) {
    this.previousX = this.x;
    this.previousY = this.y;
    this.x = x;
    this.y = y;
  }

  /**
   * Gets the current position as an object
   * @returns {{x: number, y: number}} Current position
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Gets the previous position as an object
   * @returns {{x: number, y: number}} Previous position
   */
  getPreviousPosition() {
    return { x: this.previousX, y: this.previousY };
  }

  /**
   * Calculates the distance to another position
   * @param {number} x - Target x coordinate
   * @param {number} y - Target y coordinate
   * @returns {number} Distance between current position and target
   */
  distanceTo(x, y) {
    const dx = this.x - x;
    const dy = this.y - y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Interpolates between previous and current position
   * @param {number} t - Interpolation factor (0.0 to 1.0)
   * @returns {{x: number, y: number}} Interpolated position
   */
  interpolate(t) {
    return {
      x: this.previousX + (this.x - this.previousX) * t,
      y: this.previousY + (this.y - this.previousY) * t
    };
  }
}
