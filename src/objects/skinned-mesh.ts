import { Mesh } from './mesh';
import { Matrix4 } from '../maths/matrix4';
import { Vector4 } from '../maths/vector4';
import { BufferGeometry } from '../core/buffer-geometry';
import { Material } from '../materials/material';
import { Skeleton } from './skeleton';

export class SkinnedMesh extends Mesh {
  public type = 'SkinnedMesh';
  public isSkinnedMesh = true;

  public skeleton: Skeleton;
  public bindMode: 'attached' | 'detached';
  public bindMatrix: Matrix4;
  public bindMatrixInverse: Matrix4;

  constructor(geometry: BufferGeometry, material: Material) {
    super(geometry, material);
    this.bindMode = 'attached';
    this.bindMatrix = new Matrix4();
    this.bindMatrixInverse = new Matrix4();
  }

  bind(skeleton: Skeleton, bindMatrix: Matrix4) {
    this.skeleton = skeleton;

    if (bindMatrix === undefined) {
      this.updateMatrixWorld(true);

      this.skeleton.calculateInverses();

      bindMatrix = this.matrixWorld;
    }

    this.bindMatrix.copy(bindMatrix);
    this.bindMatrixInverse.getInverse(bindMatrix);
  }

  pose() {
    this.skeleton.pose();
  }

  normalizeSkinWeights() {
    var vector = new Vector4();

    var skinWeight = (this.geometry as BufferGeometry).attributes.skinWeight!;

    for (var i = 0, l = skinWeight.count; i < l; i++) {
      vector.x = skinWeight.getX(i);
      vector.y = skinWeight.getY(i);
      vector.z = skinWeight.getZ(i);
      vector.w = skinWeight.getW(i);

      var scale = 1.0 / vector.manhattanLength();

      if (scale !== Infinity) {
        vector.multiplyScalar(scale);
      } else {
        vector.set(1, 0, 0, 0); // do something reasonable
      }

      skinWeight.setXYZW(i, vector.x, vector.y, vector.z, vector.w);
    }
  }

  updateMatrixWorld(force: boolean) {
    super.updateMatrixWorld(force);

    if (this.bindMode === 'attached') {
      this.bindMatrixInverse.getInverse(this.matrixWorld);
    } else if (this.bindMode === 'detached') {
      this.bindMatrixInverse.getInverse(this.bindMatrix);
    }
  }

  clone(): SkinnedMesh {
    return new SkinnedMesh(this.geometry as BufferGeometry, this.material).copy(this);
  }
}
