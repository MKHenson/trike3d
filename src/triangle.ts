import {Vector3} from './vector3';
import {Vector2} from './vector2';
import {Box3} from './box3';
import {Plane} from './plane';

export class Triangle {
  static buffer1 = new Vector3();
  static buffer2 = new Vector3();
  static buffer3 = new Vector3();
  static buffer4 = new Vector3();
  static buffer5 = new Vector3();
  static buffer6 = new Vector3();

  public a: Vector3;
  public b: Vector3;
  public c: Vector3;

  constructor(a?: Vector3, b?: Vector3, c?: Vector3) {
    this.a = a !== undefined ? a : new Vector3();
    this.b = b !== undefined ? b : new Vector3();
    this.c = c !== undefined ? c : new Vector3();
  }

  static getNormal(a: Vector3, b: Vector3, c: Vector3, target: Vector3) {
    const v0 = Triangle.buffer1;

    target.subVectors(c, b);
    v0.subVectors(a, b);
    target.cross(v0);

    const targetLengthSq = target.lengthSq();
    if (targetLengthSq > 0) {
      return target.multiplyScalar(1 / Math.sqrt(targetLengthSq));
    }

    return target.set(0, 0, 0);
  }

  // static/instance method to calculate barycentric coordinates
  // based on: http://www.blackpawn.com/texts/pointinpoly/default.html
  static getBarycoord(point: Vector3, a: Vector3, b: Vector3, c: Vector3, target: Vector3) {
    const v0 = Triangle.buffer1;
    const v1 = Triangle.buffer2;
    const v2 = Triangle.buffer3;

    v0.subVectors(c, a);
    v1.subVectors(b, a);
    v2.subVectors(point, a);

    const dot00 = v0.dot(v0);
    const dot01 = v0.dot(v1);
    const dot02 = v0.dot(v2);
    const dot11 = v1.dot(v1);
    const dot12 = v1.dot(v2);

    const denom = dot00 * dot11 - dot01 * dot01;

    // collinear or singular triangle
    if (denom === 0) {
      // arbitrary location outside of triangle?
      // not sure if this is the best idea, maybe should be returning undefined
      return target.set(-2, -1, -1);
    }

    const invDenom = 1 / denom;
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    // barycentric coordinates must always sum to 1
    return target.set(1 - u - v, v, u);
  }

  static containsPoint(point: Vector3, a: Vector3, b: Vector3, c: Vector3) {
    const v1 = Triangle.buffer1;

    Triangle.getBarycoord(point, a, b, c, v1);

    return v1.x >= 0 && v1.y >= 0 && v1.x + v1.y <= 1;
  }

  static getUV(
    point: Vector3,
    p1: Vector3,
    p2: Vector3,
    p3: Vector3,
    uv1: Vector2,
    uv2: Vector2,
    uv3: Vector2,
    target: Vector2
  ) {
    const barycoord = Triangle.buffer1;

    this.getBarycoord(point, p1, p2, p3, barycoord);

    target.set(0, 0);
    target.addScaledVector(uv1, barycoord.x);
    target.addScaledVector(uv2, barycoord.y);
    target.addScaledVector(uv3, barycoord.z);

    return target;
  }

  set(a: Vector3, b: Vector3, c: Vector3) {
    this.a.copy(a);
    this.b.copy(b);
    this.c.copy(c);

    return this;
  }

  setFromPointsAndIndices(points: Vector3[], i0: number, i1: number, i2: number) {
    this.a.copy(points[i0]);
    this.b.copy(points[i1]);
    this.c.copy(points[i2]);

    return this;
  }

  clone() {
    return new Triangle().copy(this);
  }

  copy(triangle: Triangle) {
    this.a.copy(triangle.a);
    this.b.copy(triangle.b);
    this.c.copy(triangle.c);

    return this;
  }

  getArea() {
    const v0 = Triangle.buffer1;
    const v1 = Triangle.buffer2;

    v0.subVectors(this.c, this.b);
    v1.subVectors(this.a, this.b);

    return v0.cross(v1).length() * 0.5;
  }

  getMidpoint(target: Vector3) {
    return target
      .addVectors(this.a, this.b)
      .add(this.c)
      .multiplyScalar(1 / 3);
  }

  getNormal(target: Vector3) {
    return Triangle.getNormal(this.a, this.b, this.c, target);
  }

  getPlane(target: Plane) {
    return target.setFromCoplanarPoints(this.a, this.b, this.c);
  }

  getBarycoord(point: Vector3, target: Vector3) {
    return Triangle.getBarycoord(point, this.a, this.b, this.c, target);
  }

  containsPoint(point: Vector3) {
    return Triangle.containsPoint(point, this.a, this.b, this.c);
  }

  getUV(point: Vector3, uv1: Vector2, uv2: Vector2, uv3: Vector2, result: Vector2) {
    return Triangle.getUV(point, this.a, this.b, this.c, uv1, uv2, uv3, result);
  }

  intersectsBox(box: Box3) {
    return box.intersectsTriangle(this);
  }

  closestPointToPoint(p: Vector3, target: Vector3) {
    const vab = Triangle.buffer1;
    const vac = Triangle.buffer2;
    const vbc = Triangle.buffer3;
    const vap = Triangle.buffer4;
    const vbp = Triangle.buffer5;
    const vcp = Triangle.buffer6;

    if (target === undefined) {
      console.warn('THREE.Triangle: .closestPointToPoint() target is now required');
      target = new Vector3();
    }

    const a = this.a,
      b = this.b,
      c = this.c;
    let v, w;

    // algorithm thanks to Real-Time Collision Detection by Christer Ericson,
    // published by Morgan Kaufmann Publishers, (c) 2005 Elsevier Inc.,
    // under the accompanying license; see chapter 5.1.5 for detailed explanation.
    // basically, we're distinguishing which of the voronoi regions of the triangle
    // the point lies in with the minimum amount of redundant computation.

    vab.subVectors(b, a);
    vac.subVectors(c, a);
    vap.subVectors(p, a);
    const d1 = vab.dot(vap);
    const d2 = vac.dot(vap);
    if (d1 <= 0 && d2 <= 0) {
      // vertex region of A; barycentric coords (1, 0, 0)
      return target.copy(a);
    }

    vbp.subVectors(p, b);
    const d3 = vab.dot(vbp);
    const d4 = vac.dot(vbp);
    if (d3 >= 0 && d4 <= d3) {
      // vertex region of B; barycentric coords (0, 1, 0)
      return target.copy(b);
    }

    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      v = d1 / (d1 - d3);
      // edge region of AB; barycentric coords (1-v, v, 0)
      return target.copy(a).addScaledVector(vab, v);
    }

    vcp.subVectors(p, c);
    const d5 = vab.dot(vcp);
    const d6 = vac.dot(vcp);
    if (d6 >= 0 && d5 <= d6) {
      // vertex region of C; barycentric coords (0, 0, 1)
      return target.copy(c);
    }

    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      w = d2 / (d2 - d6);
      // edge region of AC; barycentric coords (1-w, 0, w)
      return target.copy(a).addScaledVector(vac, w);
    }

    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      vbc.subVectors(c, b);
      w = (d4 - d3) / (d4 - d3 + (d5 - d6));
      // edge region of BC; barycentric coords (0, 1-w, w)
      return target.copy(b).addScaledVector(vbc, w); // edge region of BC
    }

    // face region
    const denom = 1 / (va + vb + vc);
    // u = va * denom
    v = vb * denom;
    w = vc * denom;
    return target
      .copy(a)
      .addScaledVector(vab, v)
      .addScaledVector(vac, w);
  }

  equals(triangle: Triangle) {
    return triangle.a.equals(this.a) && triangle.b.equals(this.b) && triangle.c.equals(this.c);
  }
}
