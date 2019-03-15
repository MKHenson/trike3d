import { Quaternion } from '../maths/quaternion';
import { Vector3 } from '../maths/vector3';
import { Matrix4 } from '../maths/matrix4';
import { EventDispatcher } from './event-dispatcher';
import { Euler } from '../maths/euler';
import { Layers } from './layers';
import { Matrix3 } from '../maths/matrix3';
import { _Math } from '../maths/math';
import { Raycaster } from './raycaster';

let object3DId = 0;

export class Object3D extends EventDispatcher {
  static DefaultUp = new Vector3(0, 1, 0);
  static DefaultMatrixAutoUpdate = true;
  static buffer1 = new Quaternion();
  static buffer2 = new Vector3();
  static buffer3 = new Matrix4();
  static buffer4 = new Vector3();

  public uuid: string;
  public name: string;
  public type: string;
  public parent: Object3D | null;
  public children: Object3D[];
  public up: Vector3;
  public position: Vector3;
  public rotation: Euler;
  public quaternion: Quaternion;
  public scale: Vector3;
  public matrix: Matrix4;
  public matrixWorld: Matrix4;
  public modelViewMatrix: Matrix4;
  public normalMatrix: Matrix3;
  public matrixAutoUpdate: boolean;
  public matrixWorldNeedsUpdate: boolean;
  public layers: Layers;
  public visible: boolean;
  public castShadow: boolean;
  public receiveShadow: boolean;
  public frustumCulled: boolean;
  public renderOrder: number;
  public isObject3D = true;
  protected _id: number;

  constructor() {
    super();

    this._id = object3DId++;
    this.uuid = _Math.generateUUID();

    this.name = '';
    this.type = 'Object3D';

    this.parent = null;
    this.children = [];

    this.up = Object3D.DefaultUp.clone();

    this.position = new Vector3();
    this.rotation = new Euler();
    this.quaternion = new Quaternion();
    this.scale = new Vector3(1, 1, 1);

    this.matrix = new Matrix4();
    this.matrixWorld = new Matrix4();
    this.modelViewMatrix = new Matrix4();
    this.normalMatrix = new Matrix3();

    this.matrixAutoUpdate = Object3D.DefaultMatrixAutoUpdate;
    this.matrixWorldNeedsUpdate = false;

    this.layers = new Layers();
    this.visible = true;

    this.castShadow = false;
    this.receiveShadow = false;

    this.frustumCulled = true;
    this.renderOrder = 0;

    this.rotation.onChange(this.onRotationChange);
    this.quaternion.onChange(this.onQuaternionChange);
  }

  get id() {
    return this._id;
  }

  protected onRotationChange() {
    this.quaternion.setFromEuler(this.rotation, false);
  }

  protected onQuaternionChange() {
    this.rotation.setFromQuaternion(this.quaternion, undefined, false);
  }

  protected onBeforeRender() {}
  protected onAfterRender() {}

  applyMatrix(matrix: Matrix4) {
    this.matrix.multiplyMatrices(matrix, this.matrix);

    this.matrix.decompose(this.position, this.quaternion, this.scale);
  }

  applyQuaternion(q: Quaternion) {
    this.quaternion.premultiply(q);

    return this;
  }

  setRotationFromAxisAngle(axis: Vector3, angle: number) {
    // assumes axis is normalized
    this.quaternion.setFromAxisAngle(axis, angle);
  }

  setRotationFromEuler(euler: Euler) {
    this.quaternion.setFromEuler(euler, true);
  }

  setRotationFromMatrix(m: Matrix4) {
    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
    this.quaternion.setFromRotationMatrix(m);
  }

  setRotationFromQuaternion(q: Quaternion) {
    // assumes q is normalized
    this.quaternion.copy(q);
  }

  rotateOnAxis(axis: Vector3, angle: number) {
    // rotate object on axis in object space
    // axis is assumed to be normalized
    const q1 = Object3D.buffer1;

    q1.setFromAxisAngle(axis, angle);

    this.quaternion.multiply(q1);

    return this;
  }

  rotateOnWorldAxis(axis: Vector3, angle: number) {
    // rotate object on axis in world space
    // axis is assumed to be normalized
    // method assumes no rotated parent
    const q1 = Object3D.buffer1;

    q1.setFromAxisAngle(axis, angle);

    this.quaternion.premultiply(q1);

    return this;
  }

  rotateX(angle: number) {
    const v1 = Object3D.buffer2.set(1, 0, 0);
    return this.rotateOnAxis(v1, angle);
  }

  rotateY(angle: number) {
    const v1 = Object3D.buffer2.set(0, 1, 0);
    return this.rotateOnAxis(v1, angle);
  }

  rotateZ(angle: number) {
    const v1 = Object3D.buffer2.set(0, 0, 1);
    return this.rotateOnAxis(v1, angle);
  }

  translateOnAxis(axis: Vector3, distance: number) {
    // translate object by distance along axis in object space
    // axis is assumed to be normalized
    const v1 = Object3D.buffer2;
    v1.copy(axis).applyQuaternion(this.quaternion);
    this.position.add(v1.multiplyScalar(distance));

    return this;
  }

  translateX(distance: number) {
    const v1 = Object3D.buffer2.set(1, 0, 0);

    return this.translateOnAxis(v1, distance);
  }

  translateY(distance: number) {
    const v1 = Object3D.buffer2.set(0, 1, 0);

    return this.translateOnAxis(v1, distance);
  }

  translateZ(distance: number) {
    const v1 = Object3D.buffer2.set(0, 0, 1);

    return this.translateOnAxis(v1, distance);
  }

  localToWorld(vector: Vector3) {
    return vector.applyMatrix4(this.matrixWorld);
  }

  worldToLocal(vector: Vector3) {
    const m1 = Object3D.buffer3;

    return vector.applyMatrix4(m1.getInverse(this.matrixWorld));
  }

  lookAt(x: number, y: number, z: number) {
    // This method does not support objects having non-uniformly-scaled parent(s)

    const q1 = Object3D.buffer1;
    const m1 = Object3D.buffer3;
    const target = Object3D.buffer2;
    const position = Object3D.buffer4;

    target.set(x, y, z);

    const parent = this.parent;

    this.updateWorldMatrix(true, false);

    position.setFromMatrixPosition(this.matrixWorld);

    if (this.isCamera || this.isLight) {
      m1.lookAt(position, target, this.up);
    } else {
      m1.lookAt(target, position, this.up);
    }

    this.quaternion.setFromRotationMatrix(m1);

    if (parent) {
      m1.extractRotation(parent.matrixWorld);
      q1.setFromRotationMatrix(m1);
      this.quaternion.premultiply(q1.inverse());
    }
  }

  add(object: Object3D, ...args: Object3D[]) {
    if (arguments.length > 1) {
      for (let i = 0; i < arguments.length; i++) {
        this.add(arguments[i]);
      }

      return this;
    }

    if (object === this) {
      console.error("THREE.Object3D.add: object can't be added as a child of itself.", object);
      return this;
    }

    if (object && object.isObject3D) {
      if (object.parent !== null) {
        object.parent.remove(object);
      }

      object.parent = this;
      object.dispatchEvent({ type: 'added' });

      this.children.push(object);
    } else {
      console.error('THREE.Object3D.add: object not an instance of THREE.Object3D.', object);
    }

    return this;
  }

  remove(object: Object3D, ...args: Object3D[]) {
    if (arguments.length > 1) {
      for (let i = 0; i < arguments.length; i++) {
        this.remove(arguments[i]);
      }

      return this;
    }

    const index = this.children.indexOf(object);

    if (index !== -1) {
      object.parent = null;

      object.dispatchEvent({ type: 'removed' });

      this.children.splice(index, 1);
    }

    return this;
  }

  getObjectById(id: string) {
    return this.getObjectByProperty('id', id);
  }

  getObjectByName(name: string) {
    return this.getObjectByProperty('name', name);
  }

  getObjectByProperty(name: string, value: any): undefined | Object3D {
    if ((this as any)[name] === value) return this;

    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      const object = child.getObjectByProperty(name, value);

      if (object !== undefined) {
        return object;
      }
    }

    return undefined;
  }

  getWorldPosition(target: Vector3) {
    this.updateMatrixWorld(true);

    return target.setFromMatrixPosition(this.matrixWorld);
  }

  getWorldQuaternion(target: Quaternion) {
    const position = Object3D.buffer2;
    const scale = Object3D.buffer4;

    this.updateMatrixWorld(true);

    this.matrixWorld.decompose(position, target, scale);

    return target;
  }

  getWorldScale(target: Vector3) {
    const position = Object3D.buffer2;
    const quaternion = Object3D.buffer1;
    this.updateMatrixWorld(true);

    this.matrixWorld.decompose(position, quaternion, target);

    return target;
  }

  getWorldDirection(target: Vector3) {
    this.updateMatrixWorld(true);

    const e = this.matrixWorld.elements;

    return target.set(e[8], e[9], e[10]).normalize();
  }

  raycast(raycaster: Raycaster, intersects: Vector3[]) {}

  traverse(callback: (obj: Object3D) => void) {
    callback(this);

    const children = this.children;

    for (let i = 0, l = children.length; i < l; i++) {
      children[i].traverse(callback);
    }
  }

  traverseVisible(callback: (obj: Object3D) => void) {
    if (this.visible === false) return;

    callback(this);

    const children = this.children;

    for (let i = 0, l = children.length; i < l; i++) {
      children[i].traverseVisible(callback);
    }
  }

  traverseAncestors(callback: (obj: Object3D) => void) {
    const parent = this.parent;

    if (parent !== null) {
      callback(parent);

      parent.traverseAncestors(callback);
    }
  }

  updateMatrix() {
    this.matrix.compose(
      this.position,
      this.quaternion,
      this.scale
    );

    this.matrixWorldNeedsUpdate = true;
  }

  updateMatrixWorld(force: boolean) {
    if (this.matrixAutoUpdate) this.updateMatrix();

    if (this.matrixWorldNeedsUpdate || force) {
      if (this.parent === null) {
        this.matrixWorld.copy(this.matrix);
      } else {
        this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
      }

      this.matrixWorldNeedsUpdate = false;

      force = true;
    }

    // update children

    const children = this.children;

    for (let i = 0, l = children.length; i < l; i++) {
      children[i].updateMatrixWorld(force);
    }
  }

  updateWorldMatrix(updateParents: boolean, updateChildren: boolean) {
    const parent = this.parent;

    if (updateParents === true && parent !== null) {
      parent.updateWorldMatrix(true, false);
    }

    if (this.matrixAutoUpdate) this.updateMatrix();

    if (this.parent === null) {
      this.matrixWorld.copy(this.matrix);
    } else {
      this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
    }

    // update children

    if (updateChildren === true) {
      const children = this.children;

      for (let i = 0, l = children.length; i < l; i++) {
        children[i].updateWorldMatrix(false, true);
      }
    }
  }

  clone(obj?: Object3D, recursive: boolean = false) {
    return (obj || new Object3D()).copy(this, recursive);
  }

  copy(source: Object3D, recursive?: boolean) {
    if (recursive === undefined) recursive = true;

    this.name = source.name;

    this.up.copy(source.up);

    this.position.copy(source.position);
    this.quaternion.copy(source.quaternion);
    this.scale.copy(source.scale);

    this.matrix.copy(source.matrix);
    this.matrixWorld.copy(source.matrixWorld);

    this.matrixAutoUpdate = source.matrixAutoUpdate;
    this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;

    this.layers.mask = source.layers.mask;
    this.visible = source.visible;

    this.castShadow = source.castShadow;
    this.receiveShadow = source.receiveShadow;

    this.frustumCulled = source.frustumCulled;
    this.renderOrder = source.renderOrder;

    if (recursive === true) {
      for (let i = 0; i < source.children.length; i++) {
        const child = source.children[i];
        this.add(child.clone());
      }
    }

    return this;
  }
}
