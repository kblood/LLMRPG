/**
 * Vector2 - 2D vector mathematics library
 * Provides vector operations for physics, movement, and positioning
 * @author Game Utils
 */

/**
 * Vector2 class - Represents a 2D vector with mathematical operations
 * Supports addition, subtraction, multiplication, division, normalization,
 * and distance calculations
 */
class Vector2 {
  /**
   * Creates a new Vector2 instance
   * @param {number} x - X component (default: 0)
   * @param {number} y - Y component (default: 0)
   */
  constructor(x = 0, y = 0) {
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new TypeError('Vector2 components must be numbers');
    }
    this.x = x;
    this.y = y;
  }

  /**
   * Adds another vector to this vector
   * @param {Vector2} other - Vector to add
   * @returns {Vector2} New Vector2 with the sum
   */
  add(other) {
    if (!(other instanceof Vector2)) {
      throw new TypeError('Can only add Vector2 instances');
    }
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  /**
   * Adds another vector to this vector (in-place)
   * @param {Vector2} other - Vector to add
   * @returns {Vector2} This vector (modified)
   */
  addInPlace(other) {
    if (!(other instanceof Vector2)) {
      throw new TypeError('Can only add Vector2 instances');
    }
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  /**
   * Subtracts another vector from this vector
   * @param {Vector2} other - Vector to subtract
   * @returns {Vector2} New Vector2 with the difference
   */
  subtract(other) {
    if (!(other instanceof Vector2)) {
      throw new TypeError('Can only subtract Vector2 instances');
    }
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  /**
   * Subtracts another vector from this vector (in-place)
   * @param {Vector2} other - Vector to subtract
   * @returns {Vector2} This vector (modified)
   */
  subtractInPlace(other) {
    if (!(other instanceof Vector2)) {
      throw new TypeError('Can only subtract Vector2 instances');
    }
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  /**
   * Multiplies this vector by a scalar
   * @param {number} scalar - Value to multiply by
   * @returns {Vector2} New Vector2 with scaled values
   */
  multiply(scalar) {
    if (typeof scalar !== 'number') {
      throw new TypeError('Scalar must be a number');
    }
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  /**
   * Multiplies this vector by a scalar (in-place)
   * @param {number} scalar - Value to multiply by
   * @returns {Vector2} This vector (modified)
   */
  multiplyInPlace(scalar) {
    if (typeof scalar !== 'number') {
      throw new TypeError('Scalar must be a number');
    }
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * Divides this vector by a scalar
   * @param {number} scalar - Value to divide by
   * @returns {Vector2} New Vector2 with divided values
   * @throws {Error} If scalar is zero
   */
  divide(scalar) {
    if (typeof scalar !== 'number') {
      throw new TypeError('Scalar must be a number');
    }
    if (scalar === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  /**
   * Divides this vector by a scalar (in-place)
   * @param {number} scalar - Value to divide by
   * @returns {Vector2} This vector (modified)
   * @throws {Error} If scalar is zero
   */
  divideInPlace(scalar) {
    if (typeof scalar !== 'number') {
      throw new TypeError('Scalar must be a number');
    }
    if (scalar === 0) {
      throw new Error('Cannot divide by zero');
    }
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  /**
   * Calculates the length (magnitude) of this vector
   * @returns {number} The length of the vector
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Calculates the squared length (magnitude) of this vector
   * More efficient than length() when you only need to compare magnitudes
   * @returns {number} The squared length of the vector
   */
  lengthSquared() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Normalizes this vector to unit length (length = 1)
   * @returns {Vector2} New Vector2 with unit length
   * @throws {Error} If vector length is zero
   */
  normalize() {
    const len = this.length();
    if (len === 0) {
      throw new Error('Cannot normalize zero-length vector');
    }
    return new Vector2(this.x / len, this.y / len);
  }

  /**
   * Normalizes this vector to unit length (in-place)
   * @returns {Vector2} This vector (modified)
   * @throws {Error} If vector length is zero
   */
  normalizeInPlace() {
    const len = this.length();
    if (len === 0) {
      throw new Error('Cannot normalize zero-length vector');
    }
    this.x /= len;
    this.y /= len;
    return this;
  }

  /**
   * Calculates the distance between this vector and another
   * @param {Vector2} other - The other vector
   * @returns {number} The distance between the vectors
   */
  distance(other) {
    if (!(other instanceof Vector2)) {
      throw new TypeError('Can only calculate distance to Vector2 instances');
    }
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculates the squared distance between this vector and another
   * More efficient than distance() when you only need to compare distances
   * @param {Vector2} other - The other vector
   * @returns {number} The squared distance between the vectors
   */
  distanceSquared(other) {
    if (!(other instanceof Vector2)) {
      throw new TypeError('Can only calculate distance to Vector2 instances');
    }
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return dx * dx + dy * dy;
  }

  /**
   * Calculates the dot product of this vector and another
   * @param {Vector2} other - The other vector
   * @returns {number} The dot product
   */
  dot(other) {
    if (!(other instanceof Vector2)) {
      throw new TypeError('Can only calculate dot product with Vector2 instances');
    }
    return this.x * other.x + this.y * other.y;
  }

  /**
   * Calculates the cross product (pseudo cross product in 2D)
   * Returns the z-component of the 3D cross product
   * @param {Vector2} other - The other vector
   * @returns {number} The cross product value
   */
  cross(other) {
    if (!(other instanceof Vector2)) {
      throw new TypeError('Can only calculate cross product with Vector2 instances');
    }
    return this.x * other.y - this.y * other.x;
  }

  /**
   * Calculates the angle of this vector in radians
   * @returns {number} Angle in radians
   */
  angle() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Calculates the angle between this vector and another in radians
   * @param {Vector2} other - The other vector
   * @returns {number} Angle in radians
   */
  angleTo(other) {
    if (!(other instanceof Vector2)) {
      throw new TypeError('Can only calculate angle to Vector2 instances');
    }
    const dot = this.dot(other);
    const cross = this.cross(other);
    return Math.atan2(cross, dot);
  }

  /**
   * Creates a copy of this vector
   * @returns {Vector2} A new Vector2 with the same components
   */
  clone() {
    return new Vector2(this.x, this.y);
  }

  /**
   * Sets the vector to match another vector
   * @param {Vector2} other - The vector to copy from
   * @returns {Vector2} This vector (modified)
   */
  set(other) {
    if (!(other instanceof Vector2)) {
      throw new TypeError('Can only set from Vector2 instances');
    }
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  /**
   * Sets the vector components
   * @param {number} x - X component
   * @param {number} y - Y component
   * @returns {Vector2} This vector (modified)
   */
  setComponents(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new TypeError('Vector2 components must be numbers');
    }
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Checks if this vector equals another vector
   * @param {Vector2} other - The other vector
   * @param {number} epsilon - Tolerance for floating point comparison (default: 0)
   * @returns {boolean} True if vectors are equal
   */
  equals(other, epsilon = 0) {
    if (!(other instanceof Vector2)) {
      return false;
    }
    return (
      Math.abs(this.x - other.x) <= epsilon &&
      Math.abs(this.y - other.y) <= epsilon
    );
  }

  /**
   * Returns a string representation of this vector
   * @returns {string} String in format "(x, y)"
   */
  toString() {
    return `(${this.x}, ${this.y})`;
  }

  /**
   * Creates a Vector2 from an angle and magnitude
   * @param {number} angle - Angle in radians
   * @param {number} magnitude - Magnitude (default: 1)
   * @returns {Vector2} New Vector2
   */
  static fromAngle(angle, magnitude = 1) {
    if (typeof angle !== 'number' || typeof magnitude !== 'number') {
      throw new TypeError('Angle and magnitude must be numbers');
    }
    return new Vector2(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude
    );
  }

  /**
   * Creates a Vector2 with specific x and y values
   * @param {number} x - X component
   * @param {number} y - Y component
   * @returns {Vector2} New Vector2
   */
  static create(x, y) {
    return new Vector2(x, y);
  }

  /**
   * Returns a zero vector (0, 0)
   * @returns {Vector2} Zero vector
   */
  static zero() {
    return new Vector2(0, 0);
  }

  /**
   * Returns a unit X vector (1, 0)
   * @returns {Vector2} Unit X vector
   */
  static right() {
    return new Vector2(1, 0);
  }

  /**
   * Returns a unit Y vector (0, 1)
   * @returns {Vector2} Unit Y vector
   */
  static up() {
    return new Vector2(0, 1);
  }

  /**
   * Returns a negative unit X vector (-1, 0)
   * @returns {Vector2} Negative unit X vector
   */
  static left() {
    return new Vector2(-1, 0);
  }

  /**
   * Returns a negative unit Y vector (0, -1)
   * @returns {Vector2} Negative unit Y vector
   */
  static down() {
    return new Vector2(0, -1);
  }

  /**
   * Returns a unit diagonal vector (1, 1)
   * @returns {Vector2} Unit diagonal vector
   */
  static one() {
    return new Vector2(1, 1);
  }

  /**
   * Linearly interpolates between two vectors
   * @param {Vector2} a - Start vector
   * @param {Vector2} b - End vector
   * @param {number} t - Interpolation parameter (0 to 1)
   * @returns {Vector2} Interpolated vector
   */
  static lerp(a, b, t) {
    if (!(a instanceof Vector2) || !(b instanceof Vector2)) {
      throw new TypeError('Arguments must be Vector2 instances');
    }
    if (typeof t !== 'number') {
      throw new TypeError('Interpolation parameter must be a number');
    }
    return new Vector2(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }

  /**
   * Calculates the distance between two vectors
   * @param {Vector2} a - First vector
   * @param {Vector2} b - Second vector
   * @returns {number} Distance between vectors
   */
  static distance(a, b) {
    if (!(a instanceof Vector2) || !(b instanceof Vector2)) {
      throw new TypeError('Arguments must be Vector2 instances');
    }
    return a.distance(b);
  }

  /**
   * Calculates the dot product of two vectors
   * @param {Vector2} a - First vector
   * @param {Vector2} b - Second vector
   * @returns {number} Dot product
   */
  static dot(a, b) {
    if (!(a instanceof Vector2) || !(b instanceof Vector2)) {
      throw new TypeError('Arguments must be Vector2 instances');
    }
    return a.dot(b);
  }
}

export default Vector2;
