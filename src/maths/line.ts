import {Vector3} from './vector3';
import {_Math} from './math';
import {Matrix4} from './matrix4';

export class Line3 {
  static buffer1 = new Vector3();
  static buffer2 = new Vector3();

  public start: Vector3;
  public end: Vector3;

  constructor(start?: Vector3, end?: Vector3) {
    this.start = start !== undefined ? start : new Vector3();
    this.end = end !== undefined ? end : new Vector3();
  }

  set(start: Vector3, end: Vector3) {
    this.start.copy(start);
    this.end.copy(end);

    return this;
  }

  clone() {
    return new Line3().copy(this);
  }

  copy(line: Line3) {
    this.start.copy(line.start);
    this.end.copy(line.end);

    return this;
  }

  getCenter(target: Vector3) {
    return target.addVectors(this.start, this.end).multiplyScalar(0.5);
  }

  delta(target: Vector3) {
    return target.subVectors(this.end, this.start);
  }

  distanceSq() {
    return this.start.distanceToSquared(this.end);
  }

  distance() {
    return this.start.distanceTo(this.end);
  }

  at(t: number, target: Vector3) {
    return this.delta(target)
      .multiplyScalar(t)
      .add(this.start);
  }

  closestPointToPointParameter(point: Vector3, clampToLine: number) {
    var startP = Line3.buffer1;
    var startEnd = Line3.buffer2;

    startP.subVectors(point, this.start);
    startEnd.subVectors(this.end, this.start);

    var startEnd2 = startEnd.dot(startEnd);
    var startEnd_startP = startEnd.dot(startP);

    var t = startEnd_startP / startEnd2;

    if (clampToLine) {
      t = _Math.clamp(t, 0, 1);
    }

    return t;
  }

  closestPointToPoint(point: Vector3, clampToLine: number, target: Vector3) {
    var t = this.closestPointToPointParameter(point, clampToLine);
    return this.delta(target)
      .multiplyScalar(t)
      .add(this.start);
  }

  applyMatrix4(matrix: Matrix4) {
    this.start.applyMatrix4(matrix);
    this.end.applyMatrix4(matrix);

    return this;
  }

  equals(line: Line3) {
    return line.start.equals(this.start) && line.end.equals(this.end);
  }
}
