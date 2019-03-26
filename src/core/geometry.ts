import { EventDispatcher } from './event-dispatcher';
import { Face3 } from './face3';
import { Matrix3 } from '../maths/matrix3';
import { Sphere } from '../maths/sphere';
import { Box3 } from '../maths/box3';
import { Vector3 } from '../maths/vector3';
import { Matrix4 } from '../maths/matrix4';
import { Vector2 } from '../maths/vector2';
import { Color } from '../maths/color';
import { Object3D } from './object-3d';
import { _Math } from '../maths/math';
import { BufferGeometry } from './buffer-geometry';

let geometryId = 0; // Geometry uses even numbers as Id

export type MorphTarget = {
  faceNormals: Vector3[];
  vertexNormals: Vector3[];
  vertices: Vector3[];
  normals: Vector3[];
  name: string;
};

export type MorphNormal = {
  name?: string;
  vertexNormals?: VertexNormal[];
  faceNormals?: Vector3[];
};

export type MorphTargetPosition = { name?: string; data?: Vector3[] };

export type VertexNormal = {
  a: Vector3;
  b: Vector3;
  c: Vector3;
};

export class Geometry extends EventDispatcher {
  static buffer1 = new Matrix4();
  static buffer2 = new Object3D();
  static buffer3 = new Vector3();

  public type = 'GEOMETRY';
  public vertices: Vector3[];
  public colors: Color[];
  public faces: Face3[];
  public faceVertexUvs: Array<Vector2[][]>;
  public morphTargets: MorphTarget[];
  public morphNormals: MorphNormal[];
  public skinWeights: Vector3[];
  public skinIndices: Vector3[];
  public lineDistances: number[];
  public boundingBox: Box3 | null;
  public boundingSphere: Sphere | null;
  public name: string;

  public elementsNeedUpdate: boolean;
  public verticesNeedUpdate: boolean;
  public uvsNeedUpdate: boolean;
  public normalsNeedUpdate: boolean;
  public colorsNeedUpdate: boolean;
  public lineDistancesNeedUpdate: boolean;
  public groupsNeedUpdate: boolean;
  public uuid: string;

  constructor() {
    super();

    Object.defineProperty(this, 'id', { value: geometryId += 2 });

    this.uuid = _Math.generateUUID();

    this.name = '';

    this.vertices = [];
    this.colors = [];
    this.faces = [];
    this.faceVertexUvs = [[]];

    this.morphTargets = [];
    this.morphNormals = [];

    this.skinWeights = [];
    this.skinIndices = [];

    this.lineDistances = [];

    this.boundingBox = null;
    this.boundingSphere = null;

    // update flags

    this.elementsNeedUpdate = false;
    this.verticesNeedUpdate = false;
    this.uvsNeedUpdate = false;
    this.normalsNeedUpdate = false;
    this.colorsNeedUpdate = false;
    this.lineDistancesNeedUpdate = false;
    this.groupsNeedUpdate = false;
  }

  applyMatrix(matrix: Matrix4) {
    const normalMatrix = new Matrix3().getNormalMatrix(matrix);

    for (let i = 0, il = this.vertices.length; i < il; i++) {
      const vertex = this.vertices[i];
      vertex.applyMatrix4(matrix);
    }

    for (let i = 0, il = this.faces.length; i < il; i++) {
      const face = this.faces[i];
      face.normal.applyMatrix3(normalMatrix).normalize();

      for (let j = 0, jl = face.vertexNormals.length; j < jl; j++) {
        face.vertexNormals[j].applyMatrix3(normalMatrix).normalize();
      }
    }

    if (this.boundingBox !== null) {
      this.computeBoundingBox();
    }

    if (this.boundingSphere !== null) {
      this.computeBoundingSphere();
    }

    this.verticesNeedUpdate = true;
    this.normalsNeedUpdate = true;

    return this;
  }

  rotateX(angle: number) {
    // rotate geometry around world x-axis

    const m1 = Geometry.buffer1;

    m1.makeRotationX(angle);

    this.applyMatrix(m1);

    return this;
  }

  rotateY(angle: number) {
    // rotate geometry around world y-axis

    const m1 = Geometry.buffer1;

    m1.makeRotationY(angle);

    this.applyMatrix(m1);

    return this;
  }

  rotateZ(angle: number) {
    // rotate geometry around world z-axis

    const m1 = Geometry.buffer1;

    m1.makeRotationZ(angle);

    this.applyMatrix(m1);

    return this;
  }

  translate(x: number, y: number, z: number) {
    // translate geometry

    const m1 = Geometry.buffer1;

    m1.makeTranslation(x, y, z);

    this.applyMatrix(m1);

    return this;
  }

  scale(x: number, y: number, z: number) {
    // scale geometry

    const m1 = Geometry.buffer1;

    m1.makeScale(x, y, z);

    this.applyMatrix(m1);

    return this;
  }

  lookAt(vector: Vector3) {
    const obj = Geometry.buffer2;

    obj.lookAt(vector);

    obj.updateMatrix();

    this.applyMatrix(obj.matrix);
  }

  fromBufferGeometry(geometry: BufferGeometry) {
    const indices = geometry.index !== null ? geometry.index.array : undefined;
    const attributes = geometry.attributes;

    const positions = attributes.position!.array;
    const normals = attributes.normal !== undefined ? attributes.normal.array : undefined;
    const colors = attributes.color !== undefined ? attributes.color.array : undefined;
    const uvs = attributes.uv !== undefined ? attributes.uv.array : undefined;
    const uvs2 = attributes.uv2 !== undefined ? attributes.uv2.array : undefined;

    if (uvs2 !== undefined) this.faceVertexUvs[1] = [];

    for (let i = 0, j = 0; i < positions.length; i += 3, j += 2) {
      this.vertices.push(new Vector3().fromArray(positions, i));

      if (colors !== undefined) {
        this.colors.push(new Color().fromArray(colors, i));
      }
    }

    function addFace(a: number, b: number, c: number, materialIndex?: number) {
      const vertexColors =
        colors === undefined ? [] : [this.colors[a].clone(), this.colors[b].clone(), this.colors[c].clone()];

      const vertexNormals =
        normals === undefined
          ? []
          : [
              new Vector3().fromArray(normals, a * 3),
              new Vector3().fromArray(normals, b * 3),
              new Vector3().fromArray(normals, c * 3)
            ];

      const face = new Face3(a, b, c, vertexNormals, vertexColors, materialIndex);

      this.faces.push(face);

      if (uvs !== undefined) {
        this.faceVertexUvs[0].push([
          new Vector2().fromArray(uvs, a * 2),
          new Vector2().fromArray(uvs, b * 2),
          new Vector2().fromArray(uvs, c * 2)
        ]);
      }

      if (uvs2 !== undefined) {
        this.faceVertexUvs[1].push([
          new Vector2().fromArray(uvs2, a * 2),
          new Vector2().fromArray(uvs2, b * 2),
          new Vector2().fromArray(uvs2, c * 2)
        ]);
      }
    }

    const groups = geometry.groups;

    if (groups.length > 0) {
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];

        const start = group.start;
        const count = group.count;

        for (let j = start, jl = start + count; j < jl; j += 3) {
          if (indices !== undefined) {
            addFace(indices[j], indices[j + 1], indices[j + 2], group.materialIndex);
          } else {
            addFace(j, j + 1, j + 2, group.materialIndex);
          }
        }
      }
    } else {
      if (indices !== undefined) {
        for (let i = 0; i < indices.length; i += 3) {
          addFace(indices[i], indices[i + 1], indices[i + 2]);
        }
      } else {
        for (let i = 0; i < positions.length / 3; i += 3) {
          addFace(i, i + 1, i + 2);
        }
      }
    }

    this.computeFaceNormals();

    if (geometry.boundingBox !== null) {
      this.boundingBox = geometry.boundingBox.clone();
    }

    if (geometry.boundingSphere !== null) {
      this.boundingSphere = geometry.boundingSphere.clone();
    }

    return this;
  }

  center() {
    const offset = Geometry.buffer3;

    this.computeBoundingBox();

    this.boundingBox!.getCenter(offset).negate();

    this.translate(offset.x, offset.y, offset.z);

    return this;
  }

  normalize() {
    this.computeBoundingSphere();

    const center = this.boundingSphere!.center;
    const radius = this.boundingSphere!.radius;

    const s = radius === 0 ? 1 : 1.0 / radius;

    const matrix = Geometry.buffer1;
    matrix.set(s, 0, 0, -s * center.x, 0, s, 0, -s * center.y, 0, 0, s, -s * center.z, 0, 0, 0, 1);

    this.applyMatrix(matrix);

    return this;
  }

  computeFaceNormals() {
    const cb = new Vector3(),
      ab = new Vector3();

    for (let f = 0, fl = this.faces.length; f < fl; f++) {
      const face = this.faces[f];

      const vA = this.vertices[face.a];
      const vB = this.vertices[face.b];
      const vC = this.vertices[face.c];

      cb.subVectors(vC, vB);
      ab.subVectors(vA, vB);
      cb.cross(ab);

      cb.normalize();

      face.normal.copy(cb);
    }
  }

  computeVertexNormals(areaWeighted?: boolean) {
    if (areaWeighted === undefined) areaWeighted = true;

    let v: number, vl: number, f: number, fl: number, face: Face3, vertices: Vector3[];

    vertices = new Array(this.vertices.length);

    for (v = 0, vl = this.vertices.length; v < vl; v++) {
      vertices[v] = new Vector3();
    }

    if (areaWeighted) {
      // vertex normals weighted by triangle areas
      // http://www.iquilezles.org/www/articles/normals/normals.htm
      let vA: Vector3, vB: Vector3, vC: Vector3;
      const cb = new Vector3(),
        ab = new Vector3();

      for (f = 0, fl = this.faces.length; f < fl; f++) {
        face = this.faces[f];

        vA = this.vertices[face.a];
        vB = this.vertices[face.b];
        vC = this.vertices[face.c];

        cb.subVectors(vC, vB);
        ab.subVectors(vA, vB);
        cb.cross(ab);

        vertices[face.a].add(cb);
        vertices[face.b].add(cb);
        vertices[face.c].add(cb);
      }
    } else {
      this.computeFaceNormals();

      for (f = 0, fl = this.faces.length; f < fl; f++) {
        face = this.faces[f];

        vertices[face.a].add(face.normal);
        vertices[face.b].add(face.normal);
        vertices[face.c].add(face.normal);
      }
    }

    for (v = 0, vl = this.vertices.length; v < vl; v++) {
      vertices[v].normalize();
    }

    for (f = 0, fl = this.faces.length; f < fl; f++) {
      face = this.faces[f];

      const vertexNormals = face.vertexNormals;

      if (vertexNormals.length === 3) {
        vertexNormals[0].copy(vertices[face.a]);
        vertexNormals[1].copy(vertices[face.b]);
        vertexNormals[2].copy(vertices[face.c]);
      } else {
        vertexNormals[0] = vertices[face.a].clone();
        vertexNormals[1] = vertices[face.b].clone();
        vertexNormals[2] = vertices[face.c].clone();
      }
    }

    if (this.faces.length > 0) {
      this.normalsNeedUpdate = true;
    }
  }

  computeFlatVertexNormals() {
    let f: number, fl: number, face: Face3;

    this.computeFaceNormals();

    for (f = 0, fl = this.faces.length; f < fl; f++) {
      face = this.faces[f];

      const vertexNormals = face.vertexNormals;

      if (vertexNormals.length === 3) {
        vertexNormals[0].copy(face.normal);
        vertexNormals[1].copy(face.normal);
        vertexNormals[2].copy(face.normal);
      } else {
        vertexNormals[0] = face.normal.clone();
        vertexNormals[1] = face.normal.clone();
        vertexNormals[2] = face.normal.clone();
      }
    }

    if (this.faces.length > 0) {
      this.normalsNeedUpdate = true;
    }
  }

  computeMorphNormals() {
    let i: number, il: number, f: number, fl: number, face: Face3;

    // save original normals
    // - create temp variables on first access
    //   otherwise just copy (for faster repeated calls)

    for (f = 0, fl = this.faces.length; f < fl; f++) {
      face = this.faces[f];

      if (!face.__originalFaceNormal) {
        face.__originalFaceNormal = face.normal.clone();
      } else {
        face.__originalFaceNormal.copy(face.normal);
      }

      if (!face.__originalVertexNormals) face.__originalVertexNormals = [];

      for (i = 0, il = face.vertexNormals.length; i < il; i++) {
        if (!face.__originalVertexNormals[i]) {
          face.__originalVertexNormals[i] = face.vertexNormals[i].clone();
        } else {
          face.__originalVertexNormals[i].copy(face.vertexNormals[i]);
        }
      }
    }

    // use temp geometry to compute face and vertex normals for each morph
    const tmpGeo = new Geometry();
    tmpGeo.faces = this.faces;

    for (i = 0, il = this.morphTargets.length; i < il; i++) {
      // create on first access

      if (!this.morphNormals[i]) {
        this.morphNormals[i] = {};
        this.morphNormals[i].faceNormals = [];
        this.morphNormals[i].vertexNormals = [];

        const dstNormalsFace = this.morphNormals[i].faceNormals!;
        const dstNormalsVertex = this.morphNormals[i].vertexNormals!;

        let faceNormal: Vector3, vertexNormals: { a: Vector3; b: Vector3; c: Vector3 };

        for (f = 0, fl = this.faces.length; f < fl; f++) {
          faceNormal = new Vector3();
          vertexNormals = { a: new Vector3(), b: new Vector3(), c: new Vector3() };

          dstNormalsFace.push(faceNormal);
          dstNormalsVertex.push(vertexNormals);
        }
      }

      const morphNormals = this.morphNormals[i];

      // set vertices to morph target
      tmpGeo.vertices = this.morphTargets[i].vertices;

      // compute morph normals
      tmpGeo.computeFaceNormals();
      tmpGeo.computeVertexNormals();

      // store morph normals
      let faceNormal: Vector3, vertexNormals: VertexNormal;

      for (f = 0, fl = this.faces.length; f < fl; f++) {
        face = this.faces[f];

        faceNormal = morphNormals.faceNormals![f];
        vertexNormals = morphNormals.vertexNormals![f];

        faceNormal.copy(face.normal);

        vertexNormals.a.copy(face.vertexNormals[0]);
        vertexNormals.b.copy(face.vertexNormals[1]);
        vertexNormals.c.copy(face.vertexNormals[2]);
      }
    }

    // restore original normals

    for (f = 0, fl = this.faces.length; f < fl; f++) {
      face = this.faces[f];

      face.normal = face.__originalFaceNormal;
      face.vertexNormals = face.__originalVertexNormals;
    }
  }

  computeBoundingBox() {
    if (this.boundingBox === null) {
      this.boundingBox = new Box3();
    }

    this.boundingBox.setFromPoints(this.vertices);
  }

  computeBoundingSphere() {
    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere();
    }

    this.boundingSphere.setFromPoints(this.vertices);
  }

  merge(geometry: Geometry, matrix: Matrix4, materialIndexOffset: number) {
    let normalMatrix: Matrix3 | undefined,
      vertexOffset = this.vertices.length,
      vertices1 = this.vertices,
      vertices2 = geometry.vertices,
      faces1 = this.faces,
      faces2 = geometry.faces,
      uvs1 = this.faceVertexUvs[0],
      uvs2 = geometry.faceVertexUvs[0],
      colors1 = this.colors,
      colors2 = geometry.colors;

    if (materialIndexOffset === undefined) materialIndexOffset = 0;

    if (matrix !== undefined) {
      normalMatrix = new Matrix3().getNormalMatrix(matrix);
    }

    // vertices
    for (let i = 0, il = vertices2.length; i < il; i++) {
      const vertex = vertices2[i];

      const vertexCopy = vertex.clone();

      if (matrix !== undefined) vertexCopy.applyMatrix4(matrix);

      vertices1.push(vertexCopy);
    }

    // colors
    for (let i = 0, il = colors2.length; i < il; i++) {
      colors1.push(colors2[i].clone());
    }

    // faces
    for (let i = 0, il = faces2.length; i < il; i++) {
      let face = faces2[i],
        faceCopy,
        normal,
        color,
        faceVertexNormals = face.vertexNormals,
        faceVertexColors = face.vertexColors;

      faceCopy = new Face3(face.a + vertexOffset, face.b + vertexOffset, face.c + vertexOffset);
      faceCopy.normal.copy(face.normal);

      if (normalMatrix !== undefined) {
        faceCopy.normal.applyMatrix3(normalMatrix).normalize();
      }

      for (let j = 0, jl = faceVertexNormals.length; j < jl; j++) {
        normal = faceVertexNormals[j].clone();

        if (normalMatrix !== undefined) {
          normal.applyMatrix3(normalMatrix).normalize();
        }

        faceCopy.vertexNormals.push(normal);
      }

      faceCopy.color.copy(face.color);

      for (let j = 0, jl = faceVertexColors.length; j < jl; j++) {
        color = faceVertexColors[j];
        faceCopy.vertexColors.push(color.clone());
      }

      faceCopy.materialIndex = face.materialIndex + materialIndexOffset;

      faces1.push(faceCopy);
    }

    // uvs
    for (let i = 0, il = uvs2.length; i < il; i++) {
      const uv = uvs2[i],
        uvCopy = [];

      if (uv === undefined) {
        continue;
      }

      for (let j = 0, jl = uv.length; j < jl; j++) {
        uvCopy.push(uv[j].clone());
      }

      uvs1.push(uvCopy);
    }
  }

  mergeMesh(mesh: Mesh) {
    if (mesh.matrixAutoUpdate) mesh.updateMatrix();

    this.merge(mesh.geometry, mesh.matrix);
  }

  /*
   * Checks for duplicate vertices with hashmap.
   * Duplicated vertices are removed
   * and faces' vertices are updated.
   */

  mergeVertices() {
    const verticesMap: { [key: string]: number } = {}; // Hashmap for looking up vertices by position coordinates (and making sure they are unique)
    const unique: Vector3[] = [],
      changes: number[] = [];

    let v: Vector3, key: string;
    const precisionPoints = 4; // number of decimal points, e.g. 4 for epsilon of 0.0001
    const precision = Math.pow(10, precisionPoints);
    let i: number, il: number, face: Face3;
    let indices: number[], j: number, jl: number;

    for (i = 0, il = this.vertices.length; i < il; i++) {
      v = this.vertices[i];
      key = Math.round(v.x * precision) + '_' + Math.round(v.y * precision) + '_' + Math.round(v.z * precision);

      if (verticesMap[key] === undefined) {
        verticesMap[key] = i;
        unique.push(this.vertices[i]);
        changes[i] = unique.length - 1;
      } else {
        //console.log('Duplicate vertex found. ', i, ' could be using ', verticesMap[key]);
        changes[i] = changes[verticesMap[key]];
      }
    }

    // if faces are completely degenerate after merging vertices, we
    // have to remove them from the geometry.
    const faceIndicesToRemove = [];

    for (let i = 0, il = this.faces.length; i < il; i++) {
      face = this.faces[i];

      face.a = changes[face.a];
      face.b = changes[face.b];
      face.c = changes[face.c];

      indices = [face.a, face.b, face.c];

      // if any duplicate vertices are found in a Face3
      // we have to remove the face as nothing can be saved
      for (let n = 0; n < 3; n++) {
        if (indices[n] === indices[(n + 1) % 3]) {
          faceIndicesToRemove.push(i);
          break;
        }
      }
    }

    for (let i = faceIndicesToRemove.length - 1; i >= 0; i--) {
      const idx = faceIndicesToRemove[i];

      this.faces.splice(idx, 1);

      for (j = 0, jl = this.faceVertexUvs.length; j < jl; j++) {
        this.faceVertexUvs[j].splice(idx, 1);
      }
    }

    // Use unique set of vertices
    const diff = this.vertices.length - unique.length;
    this.vertices = unique;
    return diff;
  }

  setFromPoints(points: Vector3[]) {
    this.vertices = [];

    for (let i = 0, l = points.length; i < l; i++) {
      const point = points[i];
      this.vertices.push(new Vector3(point.x, point.y, point.z || 0));
    }

    return this;
  }

  sortFacesByMaterialIndex() {
    const faces = this.faces;
    const length = faces.length;

    // tag faces
    for (let i = 0; i < length; i++) {
      faces[i]._id = i;
    }

    // sort faces
    function materialIndexSort(a: Face3, b: Face3) {
      return a.materialIndex - b.materialIndex;
    }

    faces.sort(materialIndexSort);

    // sort uvs
    const uvs1 = this.faceVertexUvs[0];
    const uvs2 = this.faceVertexUvs[1];

    let newUvs1: Vector2[][] | undefined, newUvs2: Vector2[][] | undefined;

    if (uvs1 && uvs1.length === length) newUvs1 = [];
    if (uvs2 && uvs2.length === length) newUvs2 = [];

    for (let i = 0; i < length; i++) {
      const id = faces[i]._id;

      if (newUvs1) newUvs1.push(uvs1[id]);
      if (newUvs2) newUvs2.push(uvs2[id]);
    }

    if (newUvs1) this.faceVertexUvs[0] = newUvs1;
    if (newUvs2) this.faceVertexUvs[1] = newUvs2;
  }

  clone() {
    return new Geometry().copy(this);
  }

  copy(source: Geometry) {
    let i: number, il: number, j: number, jl: number, k: number, kl: number;

    // reset
    this.vertices = [];
    this.colors = [];
    this.faces = [];
    this.faceVertexUvs = [[]];
    this.morphTargets = [];
    this.morphNormals = [];
    this.skinWeights = [];
    this.skinIndices = [];
    this.lineDistances = [];
    this.boundingBox = null;
    this.boundingSphere = null;

    // name
    this.name = source.name;

    // vertices
    const vertices = source.vertices;

    for (i = 0, il = vertices.length; i < il; i++) {
      this.vertices.push(vertices[i].clone());
    }

    // colors
    const colors = source.colors;

    for (i = 0, il = colors.length; i < il; i++) {
      this.colors.push(colors[i].clone());
    }

    // faces
    const faces = source.faces;

    for (i = 0, il = faces.length; i < il; i++) {
      this.faces.push(faces[i].clone());
    }

    // face vertex uvs
    for (i = 0, il = source.faceVertexUvs.length; i < il; i++) {
      const faceVertexUvs = source.faceVertexUvs[i];

      if (this.faceVertexUvs[i] === undefined) {
        this.faceVertexUvs[i] = [];
      }

      for (j = 0, jl = faceVertexUvs.length; j < jl; j++) {
        const uvs = faceVertexUvs[j],
          uvsCopy = [];

        for (k = 0, kl = uvs.length; k < kl; k++) {
          const uv = uvs[k];

          uvsCopy.push(uv.clone());
        }

        this.faceVertexUvs[i].push(uvsCopy);
      }
    }

    // morph targets
    const morphTargets = source.morphTargets;

    for (i = 0, il = morphTargets.length; i < il; i++) {
      const morphTarget: Partial<MorphTarget> = {};
      morphTarget.name = morphTargets[i].name;

      // vertices
      if (morphTargets[i].vertices !== undefined) {
        morphTarget.vertices = [];

        for (j = 0, jl = morphTargets[i].vertices.length; j < jl; j++) {
          morphTarget.vertices.push(morphTargets[i].vertices[j].clone());
        }
      }

      // normals
      if (morphTargets[i].normals !== undefined) {
        morphTarget.normals = [];

        for (j = 0, jl = morphTargets[i].normals.length; j < jl; j++) {
          morphTarget.normals.push(morphTargets[i].normals[j].clone());
        }
      }

      this.morphTargets.push(morphTarget as MorphTarget);
    }

    // morph normals
    const morphNormals = source.morphNormals;

    for (i = 0, il = morphNormals.length; i < il; i++) {
      const morphNormal: MorphNormal = {};

      // vertex normals

      if (morphNormals[i].vertexNormals !== undefined) {
        morphNormal.vertexNormals = [];

        for (j = 0, jl = morphNormals[i].vertexNormals!.length; j < jl; j++) {
          const srcVertexNormal = morphNormals[i].vertexNormals![j];
          const destVertexNormal: Partial<VertexNormal> = {};

          destVertexNormal.a = srcVertexNormal.a.clone();
          destVertexNormal.b = srcVertexNormal.b.clone();
          destVertexNormal.c = srcVertexNormal.c.clone();

          morphNormal.vertexNormals.push(destVertexNormal as VertexNormal);
        }
      }

      // face normals
      if (morphNormals[i].faceNormals !== undefined) {
        morphNormal.faceNormals = [];

        for (j = 0, jl = morphNormals[i].faceNormals!.length; j < jl; j++) {
          morphNormal.faceNormals.push(morphNormals[i].faceNormals![j].clone());
        }
      }

      this.morphNormals.push(morphNormal);
    }

    // skin weights
    const skinWeights = source.skinWeights;

    for (i = 0, il = skinWeights.length; i < il; i++) {
      this.skinWeights.push(skinWeights[i].clone());
    }

    // skin indices
    const skinIndices = source.skinIndices;

    for (i = 0, il = skinIndices.length; i < il; i++) {
      this.skinIndices.push(skinIndices[i].clone());
    }

    // line distances
    const lineDistances = source.lineDistances;

    for (i = 0, il = lineDistances.length; i < il; i++) {
      this.lineDistances.push(lineDistances[i]);
    }

    // bounding box
    const boundingBox = source.boundingBox;

    if (boundingBox !== null) {
      this.boundingBox = boundingBox.clone();
    }

    // bounding sphere
    const boundingSphere = source.boundingSphere;

    if (boundingSphere !== null) {
      this.boundingSphere = boundingSphere.clone();
    }

    // update flags
    this.elementsNeedUpdate = source.elementsNeedUpdate;
    this.verticesNeedUpdate = source.verticesNeedUpdate;
    this.uvsNeedUpdate = source.uvsNeedUpdate;
    this.normalsNeedUpdate = source.normalsNeedUpdate;
    this.colorsNeedUpdate = source.colorsNeedUpdate;
    this.lineDistancesNeedUpdate = source.lineDistancesNeedUpdate;
    this.groupsNeedUpdate = source.groupsNeedUpdate;

    return this;
  }

  dispose() {
    this.dispatchEvent({ type: 'dispose' });
  }
}
