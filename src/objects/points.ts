import { Sphere } from '../maths/sphere';
import { Ray } from '../maths/ray';
import { Matrix4 } from '../maths/matrix4';
import { Object3D } from '../core/object-3d';
import { Vector3 } from '../maths/vector3';
import { PointsMaterial } from '../materials/points-material';
import { BufferGeometry } from '../core/buffer-geometry';
import { Intersects, Raycaster } from '../core/raycaster';
import { Geometry } from '../core/geometry';

const buffer1 = new Matrix4();
const buffer2 = new Ray();
const buffer3 = new Sphere();

export class Points extends Object3D {
  public type = 'Points';
  public isPoints = true;
  public geometry: Geometry | BufferGeometry;
  public material: PointsMaterial;

  constructor(geometry: Geometry | BufferGeometry, material: PointsMaterial) {
    super();
    this.geometry = geometry !== undefined ? geometry : new BufferGeometry();
    this.material = material !== undefined ? material : new PointsMaterial({ color: Math.random() * 0xffffff });
  }

  raycast(raycaster: Raycaster, intersects: Intersects[]) {
    const inverseMatrix = buffer1;
    const ray = buffer2;
    const sphere = buffer3;

    const object = this;
    const geometry = this.geometry;
    const matrixWorld = this.matrixWorld;
    const threshold = raycaster.params.Points.threshold;

    // Checking boundingSphere distance to ray
    if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

    sphere.copy(geometry.boundingSphere!);
    sphere.applyMatrix4(matrixWorld);
    sphere.radius += threshold;

    if (raycaster.ray.intersectsSphere(sphere) === false) return;

    inverseMatrix.getInverse(matrixWorld);
    ray.copy(raycaster.ray).applyMatrix4(inverseMatrix);

    const localThreshold = threshold / ((this.scale.x + this.scale.y + this.scale.z) / 3);
    const localThresholdSq = localThreshold * localThreshold;
    const position = new Vector3();
    const intersectPoint = new Vector3();

    function testPoint(point: Vector3, index: number) {
      const rayPointDistanceSq = ray.distanceSqToPoint(point);

      if (rayPointDistanceSq < localThresholdSq) {
        ray.closestPointToPoint(point, intersectPoint);
        intersectPoint.applyMatrix4(matrixWorld);

        const distance = raycaster.ray.origin.distanceTo(intersectPoint);

        if (distance < raycaster.near || distance > raycaster.far) return;

        intersects.push({
          distance: distance,
          distanceToRay: Math.sqrt(rayPointDistanceSq),
          point: intersectPoint.clone(),
          index: index,
          face: null,
          object: object
        });
      }
    }

    if ((geometry as BufferGeometry).isBufferGeometry) {
      const index = (geometry as BufferGeometry).index;
      const attributes = (geometry as BufferGeometry).attributes;
      const positions = attributes.position!.array;

      if (index !== null) {
        const indices = index.array;

        for (let i = 0, il = indices.length; i < il; i++) {
          const a = indices[i];

          position.fromArray(positions, a * 3);

          testPoint(position, a);
        }
      } else {
        for (let i = 0, l = positions.length / 3; i < l; i++) {
          position.fromArray(positions, i * 3);

          testPoint(position, i);
        }
      }
    } else {
      const vertices = (geometry as Geometry).vertices;

      for (let i = 0, l = vertices.length; i < l; i++) {
        testPoint(vertices[i], i);
      }
    }
  }

  clone(source?: Points): Points {
    return (source || new Points(this.geometry, this.material)).copy(this);
  }
}
