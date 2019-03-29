import { Vector3 } from '../maths/vector3';
import { Vector2 } from '../maths/vector2';
import { Sphere } from '../maths/sphere';
import { Ray } from '../maths/ray';
import { Matrix4 } from '../maths/matrix4';
import { Object3D } from '../core/object-3d';
import { Triangle } from '../maths/triangle';
import { Face3 } from '../core/face3';
import { DoubleSide, BackSide, DrawMode } from '../constants';
import { MeshBasicMaterial } from '../materials/mesh-basic-material';
import { BufferGeometry } from '../core/buffer-geometry';
import { Geometry } from '../core/geometry';
import { Material } from '../materials/material';
import { Raycaster, Intersects } from '../core/raycaster';
import { BufferAttribute, TypeArray } from '../core/buffer-attribute';

const buffer1 = new Matrix4();
const buffer2 = new Ray();
const buffer3 = new Sphere();
const buffer4 = new Vector3();
const buffer5 = new Vector3();
const buffer6 = new Vector3();
const buffer7 = new Vector3();
const buffer8 = new Vector3();
const buffer9 = new Vector3();
const buffer10 = new Vector2();
const buffer11 = new Vector2();
const buffer12 = new Vector2();
const buffer13 = new Vector3();
const buffer14 = new Vector3();

export class Mesh extends Object3D {
  public type = 'Mesh';
  public isMesh: true;
  public geometry: Geometry | BufferGeometry;
  public material: Material;
  protected drawMode: DrawMode;
  public morphTargetDictionary: any;
  public morphTargetInfluences: number[];

  constructor(geometry: Geometry | BufferGeometry, material: Material) {
    super();

    this.geometry = geometry !== undefined ? geometry : new BufferGeometry();
    this.material = material !== undefined ? material : new MeshBasicMaterial({ color: Math.random() * 0xffffff });

    this.drawMode = DrawMode.TrianglesDrawMode;

    this.updateMorphTargets();
  }

  setDrawMode(value: DrawMode) {
    this.drawMode = value;
  }

  copy(source: Mesh) {
    super.copy(source);

    this.drawMode = source.drawMode;

    if (source.morphTargetInfluences !== undefined) {
      this.morphTargetInfluences = source.morphTargetInfluences.slice();
    }

    if (source.morphTargetDictionary !== undefined) {
      this.morphTargetDictionary = Object.assign({}, source.morphTargetDictionary);
    }

    return this;
  }

  updateMorphTargets() {
    const geometry = this.geometry;
    let m, ml, name;

    if ((geometry as BufferGeometry).isBufferGeometry) {
      const morphAttributes = (geometry as BufferGeometry).morphAttributes;
      const keys = Object.keys(morphAttributes);

      if (keys.length > 0) {
        const morphAttribute = morphAttributes[keys[0]];

        if (morphAttribute !== undefined) {
          this.morphTargetInfluences = [];
          this.morphTargetDictionary = {};

          for (m = 0, ml = morphAttribute.length; m < ml; m++) {
            name = morphAttribute[m].name || String(m);

            this.morphTargetInfluences.push(0);
            this.morphTargetDictionary[name] = m;
          }
        }
      }
    } else {
      const morphTargets = (geometry as Geometry).morphTargets;

      if (morphTargets !== undefined && morphTargets.length > 0) {
        console.error(
          'THREE.Mesh.updateMorphTargets() no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.'
        );
      }
    }
  }

  raycast(raycaster: Raycaster, intersects: Intersects[]) {
    const inverseMatrix = buffer1;
    const ray = buffer2;
    const sphere = buffer3;
    const vA = buffer4;
    const vB = buffer5;
    const vC = buffer6;
    const tempA = buffer7;
    const tempB = buffer8;
    const tempC = buffer9;
    const uvA = buffer10;
    const uvB = buffer11;
    const uvC = buffer12;
    const intersectionPoint = buffer13;
    const intersectionPointWorld = buffer14;

    function checkIntersection(
      object: Object3D,
      material: Material,
      raycaster: Raycaster,
      ray: Ray,
      pA: Vector3,
      pB: Vector3,
      pC: Vector3,
      point: Vector3
    ): Partial<Intersects> | null {
      let intersect: Vector3 | null;

      if (material.side === BackSide) {
        intersect = ray.intersectTriangle(pC, pB, pA, true, point);
      } else {
        intersect = ray.intersectTriangle(pA, pB, pC, material.side !== DoubleSide, point);
      }

      if (intersect === null) return null;

      intersectionPointWorld.copy(point);
      intersectionPointWorld.applyMatrix4(object.matrixWorld);

      const distance = raycaster.ray.origin.distanceTo(intersectionPointWorld);

      if (distance < raycaster.near || distance > raycaster.far) return null;

      return {
        distance: distance,
        point: intersectionPointWorld.clone(),
        object: object
      };
    }

    function checkBufferGeometryIntersection(
      object: Object3D,
      material: Material,
      raycaster: Raycaster,
      ray: Ray,
      position: BufferAttribute<TypeArray>,
      uv: BufferAttribute<TypeArray>,
      a: number,
      b: number,
      c: number
    ) {
      vA.fromBufferAttribute(position, a);
      vB.fromBufferAttribute(position, b);
      vC.fromBufferAttribute(position, c);

      const intersection = checkIntersection(object, material, raycaster, ray, vA, vB, vC, intersectionPoint);

      if (intersection) {
        if (uv) {
          uvA.fromBufferAttribute(uv, a);
          uvB.fromBufferAttribute(uv, b);
          uvC.fromBufferAttribute(uv, c);

          intersection.uv = Triangle.getUV(intersectionPoint, vA, vB, vC, uvA, uvB, uvC, new Vector2());
        }

        const face = new Face3(a, b, c);
        Triangle.getNormal(vA, vB, vC, face.normal);

        intersection.face = face;
      }

      return intersection;
    }

    const geometry = this.geometry;
    const material = this.material;
    const matrixWorld = this.matrixWorld;

    if (material === undefined) return;

    // Checking boundingSphere distance to ray

    if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

    sphere.copy(geometry.boundingSphere!);
    sphere.applyMatrix4(matrixWorld);

    if (raycaster.ray.intersectsSphere(sphere) === false) return;

    //

    inverseMatrix.getInverse(matrixWorld);
    ray.copy(raycaster.ray).applyMatrix4(inverseMatrix);

    // Check boundingBox before continuing

    if (geometry.boundingBox !== null) {
      if (ray.intersectsBox(geometry.boundingBox) === false) return;
    }

    let intersection: Partial<Intersects> | null;

    if ((geometry as BufferGeometry).isBufferGeometry) {
      const bufferGeom = geometry as BufferGeometry;
      let a: number, b: number, c: number;
      const index = bufferGeom.index;
      const position = bufferGeom.attributes.position!;
      const uv = bufferGeom.attributes.uv!;
      const groups = bufferGeom.groups;
      const drawRange = bufferGeom.drawRange;
      let i: number, j: number, il: number, jl: number;
      let group, groupMaterial;
      let start: number, end: number;

      if (index !== null) {
        // indexed buffer geometry

        if (Array.isArray(material)) {
          for (i = 0, il = groups.length; i < il; i++) {
            group = groups[i];
            groupMaterial = material[group.materialIndex];

            start = Math.max(group.start, drawRange.start);
            end = Math.min(group.start + group.count, drawRange.start + drawRange.count);

            for (j = start, jl = end; j < jl; j += 3) {
              a = index.getX(j);
              b = index.getX(j + 1);
              c = index.getX(j + 2);

              intersection = checkBufferGeometryIntersection(
                this,
                groupMaterial,
                raycaster,
                ray,
                position,
                uv,
                a,
                b,
                c
              );

              if (intersection) {
                intersection.faceIndex = Math.floor(j / 3); // triangle number in indexed buffer semantics
                intersection.face!.materialIndex = group.materialIndex;
                intersects.push(intersection as Intersects);
              }
            }
          }
        } else {
          start = Math.max(0, drawRange.start);
          end = Math.min(index.count, drawRange.start + drawRange.count);

          for (i = start, il = end; i < il; i += 3) {
            a = index.getX(i);
            b = index.getX(i + 1);
            c = index.getX(i + 2);

            intersection = checkBufferGeometryIntersection(this, material, raycaster, ray, position, uv, a, b, c);

            if (intersection) {
              intersection.faceIndex = Math.floor(i / 3); // triangle number in indexed buffer semantics
              intersects.push(intersection as Intersects);
            }
          }
        }
      } else if (position !== undefined) {
        // non-indexed buffer geometry

        if (Array.isArray(material)) {
          for (i = 0, il = groups.length; i < il; i++) {
            group = groups[i];
            groupMaterial = material[group.materialIndex];

            start = Math.max(group.start, drawRange.start);
            end = Math.min(group.start + group.count, drawRange.start + drawRange.count);

            for (j = start, jl = end; j < jl; j += 3) {
              a = j;
              b = j + 1;
              c = j + 2;

              intersection = checkBufferGeometryIntersection(
                this,
                groupMaterial,
                raycaster,
                ray,
                position,
                uv,
                a,
                b,
                c
              );

              if (intersection) {
                intersection.faceIndex = Math.floor(j / 3); // triangle number in non-indexed buffer semantics
                intersection.face!.materialIndex = group.materialIndex;
                intersects.push(intersection as Intersects);
              }
            }
          }
        } else {
          start = Math.max(0, drawRange.start);
          end = Math.min(position.count, drawRange.start + drawRange.count);

          for (i = start, il = end; i < il; i += 3) {
            a = i;
            b = i + 1;
            c = i + 2;

            intersection = checkBufferGeometryIntersection(this, material, raycaster, ray, position, uv, a, b, c);

            if (intersection) {
              intersection.faceIndex = Math.floor(i / 3); // triangle number in non-indexed buffer semantics
              intersects.push(intersection as Intersects);
            }
          }
        }
      }
    } else if ((geometry as Geometry).isGeometry) {
      const regGeom = geometry as Geometry;
      let fvA: Vector3, fvB: Vector3, fvC: Vector3;
      const isMultiMaterial = Array.isArray(material);

      const vertices = regGeom.vertices;
      const faces = regGeom.faces;
      let uvs;

      const faceVertexUvs = regGeom.faceVertexUvs[0];
      if (faceVertexUvs.length > 0) uvs = faceVertexUvs;

      for (let f = 0, fl = faces.length; f < fl; f++) {
        const face = faces[f];
        const faceMaterial = isMultiMaterial ? material[face.materialIndex] : material;

        if (faceMaterial === undefined) continue;

        fvA = vertices[face.a];
        fvB = vertices[face.b];
        fvC = vertices[face.c];

        if (faceMaterial.morphTargets === true) {
          const morphTargets = regGeom.morphTargets;
          const morphInfluences = this.morphTargetInfluences;

          vA.set(0, 0, 0);
          vB.set(0, 0, 0);
          vC.set(0, 0, 0);

          for (let t = 0, tl = morphTargets.length; t < tl; t++) {
            const influence = morphInfluences[t];

            if (influence === 0) continue;

            const targets = morphTargets[t].vertices;

            vA.addScaledVector(tempA.subVectors(targets[face.a], fvA), influence);
            vB.addScaledVector(tempB.subVectors(targets[face.b], fvB), influence);
            vC.addScaledVector(tempC.subVectors(targets[face.c], fvC), influence);
          }

          vA.add(fvA);
          vB.add(fvB);
          vC.add(fvC);

          fvA = vA;
          fvB = vB;
          fvC = vC;
        }

        intersection = checkIntersection(this, faceMaterial, raycaster, ray, fvA, fvB, fvC, intersectionPoint);

        if (intersection) {
          if (uvs && uvs[f]) {
            const uvs_f = uvs[f];
            uvA.copy(uvs_f[0]);
            uvB.copy(uvs_f[1]);
            uvC.copy(uvs_f[2]);

            intersection.uv = Triangle.getUV(intersectionPoint, fvA, fvB, fvC, uvA, uvB, uvC, new Vector2());
          }

          intersection.face = face;
          intersection.faceIndex = f;
          intersects.push(intersection as Intersects);
        }
      }
    }
  }

  clone(source?: Mesh) {
    return (source || new Mesh(this.geometry, this.material)).copy(this);
  }
}
