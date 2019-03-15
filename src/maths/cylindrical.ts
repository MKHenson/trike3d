import { Vector3 } from './vector3';

export class Cylindrical {
  public theta: number;
  public radius: number;
  public y: number;

  constructor(radius?: number, theta?: number, y?: number) {
    this.radius = radius !== undefined ? radius : 1.0; // distance from the origin to a point in the x-z plane
    this.theta = theta !== undefined ? theta : 0; // counterclockwise angle in the x-z plane measured in radians from the positive z-axis
    this.y = y !== undefined ? y : 0; // height above the x-z plane

    return this;
  }

  set(radius: number, theta: number, y: number) {
    this.radius = radius;
    this.theta = theta;
    this.y = y;

    return this;
  }

  clone() {
    return new Cylindrical().copy(this);
  }

  copy(other: Cylindrical) {
    this.radius = other.radius;
    this.theta = other.theta;
    this.y = other.y;

    return this;
  }

  setFromVector3(v: Vector3) {
    return this.setFromCartesianCoords(v.x, v.y, v.z);
  }

  setFromCartesianCoords(x: number, y: number, z: number) {
    this.radius = Math.sqrt(x * x + z * z);
    this.theta = Math.atan2(x, z);
    this.y = y;

    return this;
  }
}
