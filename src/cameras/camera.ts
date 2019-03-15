import { Matrix4 } from '../maths/matrix4';
import { Object3D } from '../core/object-3d';
import { Vector3 } from '../maths/vector3';

export class Camera extends Object3D {
  public isCamera = true;
  public type = 'camera';
  public matrixWorldInverse: Matrix4;
  public projectionMatrix: Matrix4;
  public projectionMatrixInverse: Matrix4;

  constructor() {
    super();

    this.matrixWorldInverse = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.projectionMatrixInverse = new Matrix4();
  }

  copy(source: Camera, recursive?: boolean) {
    super.copy(this, recursive);

    this.matrixWorldInverse.copy(source.matrixWorldInverse);
    this.projectionMatrix.copy(source.projectionMatrix);
    this.projectionMatrixInverse.copy(source.projectionMatrixInverse);

    return this;
  }

  getWorldDirection(target: Vector3) {
    this.updateMatrixWorld(true);
    var e = this.matrixWorld.elements;
    return target.set(-e[8], -e[9], -e[10]).normalize();
  }

  updateMatrixWorld(force: boolean) {
    super.updateMatrixWorld(force);
    this.matrixWorldInverse.getInverse(this.matrixWorld);
  }

  clone(obj?: Camera) {
    return (obj || new Camera()).copy(this);
  }

  lookAt(x: number, y: number, z: number) {
    const q1 = Object3D.buffer1;
    const m1 = Object3D.buffer3;
    const target = Object3D.buffer2;
    const position = Object3D.buffer4;

    target.set(x, y, z);
    const parent = this.parent;

    this.updateWorldMatrix(true, false);
    position.setFromMatrixPosition(this.matrixWorld);
    m1.lookAt(position, target, this.up);
    this.quaternion.setFromRotationMatrix(m1);

    if (parent) {
      m1.extractRotation(parent.matrixWorld);
      q1.setFromRotationMatrix(m1);
      this.quaternion.premultiply(q1.inverse());
    }
  }
}
