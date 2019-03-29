import { Vector2 } from '../maths/vector2';
import { Vector3 } from '../maths/vector3';
import { Matrix4 } from '../maths/matrix4';
import { Triangle } from '../maths/triangle';
import { Object3D } from '../core/Object-3d';
import { BufferGeometry } from '../core/buffer-geometry';
import { InterleavedBuffer } from '../core/interleaved-buffer';
import { InterleavedBufferAttribute } from '../core/interleaved-buffer-attribute.js';
import { SpriteMaterial } from '../materials/sprite-material.js';
import { Raycaster, Intersects } from '../core/raycaster';

const buffer1 = new Vector3();
const buffer2 = new Vector3();
const buffer3 = new Vector3();
const buffer4 = new Vector2();
const buffer5 = new Vector2();
const buffer6 = new Matrix4();
const buffer7 = new Vector3();
const buffer8 = new Vector3();
const buffer9 = new Vector3();
const buffer10 = new Vector2();
const buffer11 = new Vector2();
const buffer12 = new Vector2();

let geometry: BufferGeometry;

export class Sprite extends Object3D {
  public isSprite = true;
  public geometry: BufferGeometry;
  public material: SpriteMaterial;
  public center: Vector2;

  constructor(material: SpriteMaterial) {
    super();

    this.type = 'Sprite';

    if (geometry === undefined) {
      geometry = new BufferGeometry();

      const float32Array = new Float32Array([
        -0.5,
        -0.5,
        0,
        0,
        0,
        0.5,
        -0.5,
        0,
        1,
        0,
        0.5,
        0.5,
        0,
        1,
        1,
        -0.5,
        0.5,
        0,
        0,
        1
      ]);

      const interleavedBuffer = new InterleavedBuffer(float32Array, 5);

      geometry.setIndex([0, 1, 2, 0, 2, 3]);
      geometry.addAttribute('position', new InterleavedBufferAttribute(interleavedBuffer, 3, 0, false));
      geometry.addAttribute('uv', new InterleavedBufferAttribute(interleavedBuffer, 2, 3, false));
    }

    this.geometry = geometry;
    this.material = material !== undefined ? material : new SpriteMaterial();

    this.center = new Vector2(0.5, 0.5);
  }

  raycast(raycaster: Raycaster, intersects: Intersects[]) {
    const intersectPoint = buffer1;
    const worldScale = buffer2;
    const mvPosition = buffer3;

    const alignedPosition = buffer4;
    const rotatedPosition = buffer5;
    const viewWorldMatrix = buffer6;

    const vA = buffer7;
    const vB = buffer8;
    const vC = buffer9;

    const uvA = buffer10;
    const uvB = buffer11;
    const uvC = buffer12;

    function transformVertex(
      vertexPosition: Vector3,
      mvPosition: Vector3,
      center: Vector2,
      scale: Vector3,
      sin: number,
      cos: number
    ) {
      // compute position in camera space
      alignedPosition
        .subVectors(vertexPosition, center)
        .addScalar(0.5)
        .multiply(scale);

      // to check if rotation is not zero
      if (sin !== undefined) {
        rotatedPosition.x = cos * alignedPosition.x - sin * alignedPosition.y;
        rotatedPosition.y = sin * alignedPosition.x + cos * alignedPosition.y;
      } else {
        rotatedPosition.copy(alignedPosition);
      }

      vertexPosition.copy(mvPosition);
      vertexPosition.x += rotatedPosition.x;
      vertexPosition.y += rotatedPosition.y;

      // transform to world space
      vertexPosition.applyMatrix4(viewWorldMatrix);
    }

    worldScale.setFromMatrixScale(this.matrixWorld);
    viewWorldMatrix.getInverse(this.modelViewMatrix).premultiply(this.matrixWorld);
    mvPosition.setFromMatrixPosition(this.modelViewMatrix);

    const rotation = this.material.rotation;
    let sin: number = 0,
      cos: number = 0;
    if (rotation !== 0) {
      cos = Math.cos(rotation);
      sin = Math.sin(rotation);
    }

    const center = this.center;

    transformVertex(vA.set(-0.5, -0.5, 0), mvPosition, center, worldScale, sin, cos);
    transformVertex(vB.set(0.5, -0.5, 0), mvPosition, center, worldScale, sin, cos);
    transformVertex(vC.set(0.5, 0.5, 0), mvPosition, center, worldScale, sin, cos);

    uvA.set(0, 0);
    uvB.set(1, 0);
    uvC.set(1, 1);

    // check first triangle
    let intersect = raycaster.ray.intersectTriangle(vA, vB, vC, false, intersectPoint);

    if (intersect === null) {
      // check second triangle
      transformVertex(vB.set(-0.5, 0.5, 0), mvPosition, center, worldScale, sin, cos);
      uvB.set(0, 1);

      intersect = raycaster.ray.intersectTriangle(vA, vC, vB, false, intersectPoint);
      if (intersect === null) {
        return;
      }
    }

    const distance = raycaster.ray.origin.distanceTo(intersectPoint);

    if (distance < raycaster.near || distance > raycaster.far) return;

    intersects.push({
      distance: distance,
      point: intersectPoint.clone(),
      uv: Triangle.getUV(intersectPoint, vA, vB, vC, uvA, uvB, uvC, new Vector2()),
      face: null,
      object: this
    } as Intersects);
  }

  clone() {
    return new Sprite(this.material).copy(this);
  }

  copy(source: Sprite) {
    super.copy(source);

    if (source.center !== undefined) this.center.copy(source.center);

    return this;
  }
}
