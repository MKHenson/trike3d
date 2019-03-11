import {Quaternion} from './quaternion';
import {Vector3} from './vector3';
import {Matrix4} from './matrix4';
import {_Math} from './math';

export type EulerOrder = 'XYZ' | 'YZX' | 'ZXY' | 'XZY' | 'YXZ' | 'ZYX';

export class Euler {
  static buffer1 = new Matrix4();
  static buffer2 = new Quaternion();
  static RotationOrders: EulerOrder[] = ['XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX'];
  static DefaultOrder: EulerOrder = 'XYZ';

  public _x: number;
  public _y: number;
  public _z: number;
  public _order: EulerOrder;
  public isEuler: boolean;

  constructor(x?: number, y?: number, z?: number, order?: EulerOrder) {
    this._x = x || 0;
    this._y = y || 0;
    this._z = z || 0;
    this.isEuler = true;
    this._order = order || Euler.DefaultOrder;
  }

  get x() {
    return this._x;
  }

  set x(value: number) {
    this._x = value;
    this.onChangeCallback();
  }

  get y() {
    return this._y;
  }

  set y(value: number) {
    this._y = value;
    this.onChangeCallback();
  }

  get z() {
    return this._z;
  }

  set z(value: number) {
    this._z = value;
    this.onChangeCallback();
  }

  get order() {
    return this._order;
  }

  set order(value: EulerOrder) {
    this._order = value;
    this.onChangeCallback();
  }

  set(x: number, y: number, z: number, order: EulerOrder) {
    this._x = x;
    this._y = y;
    this._z = z;
    this._order = order || this._order;

    this.onChangeCallback();

    return this;
  }

  clone() {
    return new Euler(this._x, this._y, this._z, this._order);
  }

  copy(euler: Euler) {
    this._x = euler._x;
    this._y = euler._y;
    this._z = euler._z;
    this._order = euler._order;

    this.onChangeCallback();

    return this;
  }

  setFromRotationMatrix(m: Matrix4, order: EulerOrder, update?: boolean) {
    var clamp = _Math.clamp;

    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

    var te = m.elements;
    var m11 = te[0],
      m12 = te[4],
      m13 = te[8];
    var m21 = te[1],
      m22 = te[5],
      m23 = te[9];
    var m31 = te[2],
      m32 = te[6],
      m33 = te[10];

    order = order || this._order;

    if (order === 'XYZ') {
      this._y = Math.asin(clamp(m13, -1, 1));

      if (Math.abs(m13) < 0.99999) {
        this._x = Math.atan2(-m23, m33);
        this._z = Math.atan2(-m12, m11);
      } else {
        this._x = Math.atan2(m32, m22);
        this._z = 0;
      }
    } else if (order === 'YXZ') {
      this._x = Math.asin(-clamp(m23, -1, 1));

      if (Math.abs(m23) < 0.99999) {
        this._y = Math.atan2(m13, m33);
        this._z = Math.atan2(m21, m22);
      } else {
        this._y = Math.atan2(-m31, m11);
        this._z = 0;
      }
    } else if (order === 'ZXY') {
      this._x = Math.asin(clamp(m32, -1, 1));

      if (Math.abs(m32) < 0.99999) {
        this._y = Math.atan2(-m31, m33);
        this._z = Math.atan2(-m12, m22);
      } else {
        this._y = 0;
        this._z = Math.atan2(m21, m11);
      }
    } else if (order === 'ZYX') {
      this._y = Math.asin(-clamp(m31, -1, 1));

      if (Math.abs(m31) < 0.99999) {
        this._x = Math.atan2(m32, m33);
        this._z = Math.atan2(m21, m11);
      } else {
        this._x = 0;
        this._z = Math.atan2(-m12, m22);
      }
    } else if (order === 'YZX') {
      this._z = Math.asin(clamp(m21, -1, 1));

      if (Math.abs(m21) < 0.99999) {
        this._x = Math.atan2(-m23, m22);
        this._y = Math.atan2(-m31, m11);
      } else {
        this._x = 0;
        this._y = Math.atan2(m13, m33);
      }
    } else if (order === 'XZY') {
      this._z = Math.asin(-clamp(m12, -1, 1));

      if (Math.abs(m12) < 0.99999) {
        this._x = Math.atan2(m32, m22);
        this._y = Math.atan2(m13, m11);
      } else {
        this._x = Math.atan2(-m23, m33);
        this._y = 0;
      }
    } else {
      console.warn('THREE.Euler: .setFromRotationMatrix() given unsupported order: ' + order);
    }

    this._order = order;

    if (update !== false) this.onChangeCallback();

    return this;
  }

  setFromQuaternion(q: Quaternion, order: EulerOrder, update?: boolean) {
    var matrix = Euler.buffer1;

    matrix.makeRotationFromQuaternion(q);

    return this.setFromRotationMatrix(matrix, order, update);
  }

  setFromVector3(v: Vector3, order: EulerOrder) {
    return this.set(v.x, v.y, v.z, order || this._order);
  }

  reorder(newOrder: EulerOrder) {
    // WARNING: this discards revolution information -bhouston

    var q = Euler.buffer2;

    q.setFromEuler(this);

    return this.setFromQuaternion(q, newOrder);
  }

  equals(euler: Euler) {
    return euler._x === this._x && euler._y === this._y && euler._z === this._z && euler._order === this._order;
  }

  toVector3(optionalResult?: Vector3) {
    if (optionalResult) {
      return optionalResult.set(this._x, this._y, this._z);
    } else {
      return new Vector3(this._x, this._y, this._z);
    }
  }

  onChange(callback: () => void) {
    this.onChangeCallback = callback;

    return this;
  }

  onChangeCallback() {}
}
