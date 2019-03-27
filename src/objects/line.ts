import { Sphere } from '../maths/sphere';
import { Ray } from '../maths/ray';
import { Matrix4 } from '../maths/matrix4';
import { Object3D } from '../core/object-3d';
import { Vector3 } from '../maths/vector3';
import { BufferGeometry } from '../core/buffer-geometry';
import { Float32BufferAttribute } from '../core/buffer-attribute';
import { LineBasicMaterial } from '../materials/line-basic-material';
import { Geometry } from '../core/geometry';
import { Raycaster, Intersects } from '../core/raycaster';
import { LineSegments } from './line-segments';

const buffer1 = new Vector3();
const buffer2 = new Vector3();
const buffer3 = new Matrix4();
const buffer4 = new Ray();
const buffer5 = new Sphere();

export class Line extends Object3D {
  public isLine: true;
  public type = 'Line';
  public geometry: Geometry | BufferGeometry;
  public material: LineBasicMaterial;

  constructor(geometry?: Geometry | BufferGeometry, material?: LineBasicMaterial, mode?: number) {
    super();

    if (mode === 1) {
      console.error('THREE.Line: parameter THREE.LinePieces no longer supported. Use THREE.LineSegments instead.');
    }

    this.geometry = geometry !== undefined ? geometry : new BufferGeometry();
    this.material = material !== undefined ? material : new LineBasicMaterial({ color: Math.random() * 0xffffff });
  }

  computeLineDistances() {
    var start = buffer1;
    var end = buffer2;

    var geometry = this.geometry;

    if ((geometry as BufferGeometry).isBufferGeometry) {
      // we assume non-indexed geometry

      const bufferGeom = geometry as BufferGeometry;

      if (bufferGeom.index === null) {
        var positionAttribute = bufferGeom.attributes.position!;
        var lineDistances = [0];

        for (var i = 1, l = positionAttribute.count; i < l; i++) {
          start.fromBufferAttribute(positionAttribute, i - 1);
          end.fromBufferAttribute(positionAttribute, i);

          lineDistances[i] = lineDistances[i - 1];
          lineDistances[i] += start.distanceTo(end);
        }

        bufferGeom.addAttribute('lineDistance', new Float32BufferAttribute(lineDistances, 1));
      } else {
        console.warn('THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.');
      }
    } else if ((geometry as Geometry).isGeometry) {
      var vertices = (geometry as Geometry).vertices;
      var lineDistances = (geometry as Geometry).lineDistances;

      lineDistances[0] = 0;

      for (var i = 1, l = vertices.length; i < l; i++) {
        lineDistances[i] = lineDistances[i - 1];
        lineDistances[i] += vertices[i - 1].distanceTo(vertices[i]);
      }
    }

    return this;
  }

  raycast(raycaster: Raycaster, intersects: Intersects[]) {
    var inverseMatrix = buffer3;
    var ray = buffer4;
    var sphere = buffer5;

    var precision = raycaster.linePrecision;

    var geometry = this.geometry;
    var matrixWorld = this.matrixWorld;

    // Checking boundingSphere distance to ray
    if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

    sphere.copy(geometry.boundingSphere!);
    sphere.applyMatrix4(matrixWorld);
    sphere.radius += precision;

    if (raycaster.ray.intersectsSphere(sphere) === false) return;

    inverseMatrix.getInverse(matrixWorld);
    ray.copy(raycaster.ray).applyMatrix4(inverseMatrix);

    var localPrecision = precision / ((this.scale.x + this.scale.y + this.scale.z) / 3);
    var localPrecisionSq = localPrecision * localPrecision;

    var vStart = new Vector3();
    var vEnd = new Vector3();
    var interSegment = new Vector3();
    var interRay = new Vector3();
    var step = this && ((this as any) as LineSegments).isLineSegments ? 2 : 1;

    if ((geometry as BufferGeometry).isBufferGeometry) {
      var index = (geometry as BufferGeometry).index;
      var attributes = (geometry as BufferGeometry).attributes;
      var positions = attributes.position!.array;

      if (index !== null) {
        var indices = index.array;

        for (var i = 0, l = indices.length - 1; i < l; i += step) {
          var a = indices[i];
          var b = indices[i + 1];

          vStart.fromArray(positions, a * 3);
          vEnd.fromArray(positions, b * 3);

          var distSq = ray.distanceSqToSegment(vStart, vEnd, interRay, interSegment);

          if (distSq > localPrecisionSq) continue;

          interRay.applyMatrix4(this.matrixWorld); //Move back to world space for distance calculation

          var distance = raycaster.ray.origin.distanceTo(interRay);

          if (distance < raycaster.near || distance > raycaster.far) continue;

          intersects.push({
            distance: distance,
            // What do we want? intersection point on the ray or on the segment??
            // point: raycaster.ray.at( distance ),
            point: interSegment.clone().applyMatrix4(this.matrixWorld),
            index: i,
            face: null,
            faceIndex: null,
            object: this
          });
        }
      } else {
        for (var i = 0, l = positions.length / 3 - 1; i < l; i += step) {
          vStart.fromArray(positions, 3 * i);
          vEnd.fromArray(positions, 3 * i + 3);

          var distSq = ray.distanceSqToSegment(vStart, vEnd, interRay, interSegment);

          if (distSq > localPrecisionSq) continue;

          interRay.applyMatrix4(this.matrixWorld); //Move back to world space for distance calculation

          var distance = raycaster.ray.origin.distanceTo(interRay);

          if (distance < raycaster.near || distance > raycaster.far) continue;

          intersects.push({
            distance: distance,
            // What do we want? intersection point on the ray or on the segment??
            // point: raycaster.ray.at( distance ),
            point: interSegment.clone().applyMatrix4(this.matrixWorld),
            index: i,
            face: null,
            faceIndex: null,
            object: this
          });
        }
      }
    } else if ((geometry as Geometry).isGeometry) {
      var vertices = (geometry as Geometry).vertices;
      var nbVertices = vertices.length;

      for (var i = 0; i < nbVertices - 1; i += step) {
        var distSq = ray.distanceSqToSegment(vertices[i], vertices[i + 1], interRay, interSegment);

        if (distSq > localPrecisionSq) continue;

        interRay.applyMatrix4(this.matrixWorld); //Move back to world space for distance calculation

        var distance = raycaster.ray.origin.distanceTo(interRay);

        if (distance < raycaster.near || distance > raycaster.far) continue;

        intersects.push({
          distance: distance,
          // What do we want? intersection point on the ray or on the segment??
          // point: raycaster.ray.at( distance ),
          point: interSegment.clone().applyMatrix4(this.matrixWorld),
          index: i,
          face: null,
          faceIndex: null,
          object: this
        });
      }
    }
  }

  copy(source: Line) {
    super.copy(source);
    this.geometry.copy(source.geometry as any);
    this.material.copy(source.material);
    return this;
  }

  clone() {
    return new Line().copy(this);
  }
}
