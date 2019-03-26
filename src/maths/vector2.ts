import { Matrix3 } from './matrix3';
import { BufferAttribute, TypeArray } from '../core/buffer-attribute';

export class Vector2 {
  public x: number;
  public y: number;
  public isVector2 = true;

  static buffer1: Vector2 = new Vector2();
  static buffer2: Vector2 = new Vector2();

  constructor(x?: number, y?: number) {
    this.x = x || 0;
    this.y = y || 0;
  }

  get width(): number {
    return this.x;
  }

  set width(val: number) {
    this.x = val;
  }

  get height(): number {
    return this.y;
  }

  set height(val: number) {
    this.y = val;
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;

    return this;
  }

  setScalar(scalar: number) {
    this.x = scalar;
    this.y = scalar;

    return this;
  }

  setX(x: number) {
    this.x = x;

    return this;
  }

  setY(y: number) {
    this.y = y;

    return this;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  copy(v: Vector2) {
    this.x = v.x;
    this.y = v.y;

    return this;
  }

  add(v: Vector2) {
    this.x += v.x;
    this.y += v.y;

    return this;
  }

  addScalar(s: number) {
    this.x += s;
    this.y += s;

    return this;
  }

  addVectors(a: Vector2, b: Vector2) {
    this.x = a.x + b.x;
    this.y = a.y + b.y;

    return this;
  }

  addScaledVector(v: Vector2, s: number) {
    this.x += v.x * s;
    this.y += v.y * s;

    return this;
  }

  sub(v: Vector2) {
    this.x -= v.x;
    this.y -= v.y;

    return this;
  }

  subScalar(s: number) {
    this.x -= s;
    this.y -= s;

    return this;
  }

  subVectors(a: Vector2, b: Vector2) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;

    return this;
  }

  multiply(v: Vector2) {
    this.x *= v.x;
    this.y *= v.y;

    return this;
  }

  multiplyScalar(scalar: number) {
    this.x *= scalar;
    this.y *= scalar;

    return this;
  }

  divide(v: Vector2) {
    this.x /= v.x;
    this.y /= v.y;

    return this;
  }

  divideScalar(scalar: number) {
    return this.multiplyScalar(1 / scalar);
  }

  applyMatrix3(m: Matrix3) {
    let x = this.x,
      y = this.y;
    let e = m.elements;

    this.x = e[0] * x + e[3] * y + e[6];
    this.y = e[1] * x + e[4] * y + e[7];

    return this;
  }

  min(v: Vector2) {
    this.x = Math.min(this.x, v.x);
    this.y = Math.min(this.y, v.y);

    return this;
  }

  max(v: Vector2) {
    this.x = Math.max(this.x, v.x);
    this.y = Math.max(this.y, v.y);

    return this;
  }

  clamp(min: Vector2, max: Vector2) {
    // assumes min < max, componentwise

    this.x = Math.max(min.x, Math.min(max.x, this.x));
    this.y = Math.max(min.y, Math.min(max.y, this.y));

    return this;
  }

  clampLength(min: number, max: number) {
    let length = this.length();

    return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));
  }

  floor() {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);

    return this;
  }

  ceil() {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);

    return this;
  }

  round() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);

    return this;
  }

  roundToZero() {
    this.x = this.x < 0 ? Math.ceil(this.x) : Math.floor(this.x);
    this.y = this.y < 0 ? Math.ceil(this.y) : Math.floor(this.y);

    return this;
  }

  negate() {
    this.x = -this.x;
    this.y = -this.y;

    return this;
  }

  dot(v: Vector2) {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: Vector2) {
    return this.x * v.y - this.y * v.x;
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y);
  }

  normalize() {
    return this.divideScalar(this.length() || 1);
  }

  angle() {
    // computes the angle in radians with respect to the positive x-axis

    let angle = Math.atan2(this.y, this.x);

    if (angle < 0) angle += 2 * Math.PI;

    return angle;
  }

  distanceTo(v: Vector2) {
    return Math.sqrt(this.distanceToSquared(v));
  }

  distanceToSquared(v: Vector2) {
    let dx = this.x - v.x,
      dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  manhattanDistanceTo(v: Vector2) {
    return Math.abs(this.x - v.x) + Math.abs(this.y - v.y);
  }

  setLength(length: number) {
    return this.normalize().multiplyScalar(length);
  }

  lerp(v: Vector2, alpha: number) {
    this.x += (v.x - this.x) * alpha;
    this.y += (v.y - this.y) * alpha;

    return this;
  }

  lerpVectors(v1: Vector2, v2: Vector2, alpha: number) {
    return this.subVectors(v2, v1)
      .multiplyScalar(alpha)
      .add(v1);
  }

  equals(v: Vector2) {
    return v.x === this.x && v.y === this.y;
  }

  fromArray(array: ArrayLike<number>, offset: number): Vector2 {
    if (offset === undefined) offset = 0;

    this.x = array[offset];
    this.y = array[offset + 1];

    return this;
  }

  toArray(array: number[], offset: number) {
    if (array === undefined) array = [];
    if (offset === undefined) offset = 0;

    array[offset] = this.x;
    array[offset + 1] = this.y;

    return array;
  }

  fromBufferAttribute(attribute: BufferAttribute<TypeArray>, index: number) {
    this.x = attribute.getX(index);
    this.y = attribute.getY(index);

    return this;
  }

  rotateAround(center: Vector2, angle: number) {
    let c = Math.cos(angle),
      s = Math.sin(angle);

    let x = this.x - center.x;
    let y = this.y - center.y;

    this.x = x * c - y * s + center.x;
    this.y = x * s + y * c + center.y;

    return this;
  }

  clampScalar(minVal: number, maxVal: number) {
    let min = Vector2.buffer1;
    let max = Vector2.buffer2;

    min.set(minVal, minVal);
    max.set(maxVal, maxVal);
    return this.clamp(min, max);
  }
}
