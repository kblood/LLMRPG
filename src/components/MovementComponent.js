import { Component } from './Component.js';

/**
 * Movement component that manages entity movement along a path
 * Handles speed, waypoints, and movement state
 */
export class MovementComponent extends Component {
  /**
   * Creates a new MovementComponent
   * @param {number} [speed=1.0] - Movement speed in units per frame
   */
  constructor(speed = 1.0) {
    super('movement');

    /** @type {number} Movement speed in units per frame */
    this.speed = speed;

    /** @type {Array<{x: number, y: number}>} Array of waypoints to follow */
    this.path = [];

    /** @type {number} Current index in the path array */
    this.pathIndex = 0;

    /** @type {boolean} Whether the entity is currently moving */
    this.isMoving = false;
  }

  /**
   * Sets the path for the entity to follow
   * @param {Array<{x: number, y: number}>} waypoints - Array of waypoint objects with x and y properties
   */
  setPath(waypoints) {
    this.path = waypoints;
    this.pathIndex = 0;
    this.isMoving = waypoints.length > 0;
  }

  /**
   * Adds a waypoint to the current path
   * @param {number} x - X coordinate of the waypoint
   * @param {number} y - Y coordinate of the waypoint
   */
  addWaypoint(x, y) {
    this.path.push({ x, y });
    if (!this.isMoving && this.path.length > 0) {
      this.isMoving = true;
    }
  }

  /**
   * Gets the current target waypoint
   * @returns {{x: number, y: number}|null} Current target waypoint or null if no path
   */
  getCurrentTarget() {
    if (this.pathIndex < this.path.length) {
      return this.path[this.pathIndex];
    }
    return null;
  }

  /**
   * Gets the next waypoint in the path
   * @returns {{x: number, y: number}|null} Next waypoint or null if at end of path
   */
  getNextWaypoint() {
    if (this.pathIndex + 1 < this.path.length) {
      return this.path[this.pathIndex + 1];
    }
    return null;
  }

  /**
   * Advances to the next waypoint in the path
   * @returns {boolean} True if there's a next waypoint, false if path is complete
   */
  advanceToNextWaypoint() {
    this.pathIndex++;
    if (this.pathIndex >= this.path.length) {
      this.isMoving = false;
      return false;
    }
    return true;
  }

  /**
   * Clears the current path and stops movement
   */
  clearPath() {
    this.path = [];
    this.pathIndex = 0;
    this.isMoving = false;
  }

  /**
   * Starts movement along the current path
   */
  start() {
    if (this.path.length > 0) {
      this.isMoving = true;
      this.pathIndex = 0;
    }
  }

  /**
   * Stops the entity from moving
   */
  stop() {
    this.isMoving = false;
  }

  /**
   * Checks if the entity has completed its path
   * @returns {boolean} True if the path is complete, false otherwise
   */
  isPathComplete() {
    return !this.isMoving || this.pathIndex >= this.path.length;
  }

  /**
   * Gets the remaining path waypoints
   * @returns {Array<{x: number, y: number}>} Remaining waypoints from current index
   */
  getRemainingPath() {
    return this.path.slice(this.pathIndex);
  }

  /**
   * Sets the movement speed
   * @param {number} speed - New speed value in units per frame
   */
  setSpeed(speed) {
    this.speed = Math.max(0, speed);
  }
}
