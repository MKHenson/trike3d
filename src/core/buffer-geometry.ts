import { Vector3 } from '../maths/vector3.js';
import { Box3 } from '../maths/box3.js';
import { EventDispatcher } from './event-dispatcher.js';
import {
  BufferAttribute,
  TypeArray,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Uint32BufferAttribute
} from './buffer-attribute.js';
import { Sphere } from '../maths/Sphere.js';
import { DirectGeometry } from './direct-geometry.js';
import { Object3D } from './object-3d.js';
import { Matrix4 } from '../maths/matrix4.js';
import { Matrix3 } from '../maths/matrix3.js';
import { _Math } from '../maths/math.js';
import { arrayMax } from '../utils.js';
import { Geometry } from './geometry.js';

export type Group = {
  start: number;
  count: number;
  materialIndex: number;
};

let bufferGeometryId = 1; // BufferGeometry uses odd numbers as Id

export class BufferGeometry extends EventDispatcher {
  static buffer1 = new Box3();
  static buffer2 = new Vector3();
  static buffer3 = new Matrix4();
  static buffer4 = new Object3D();

  public isBufferGeometry = true;
  public uuid: string;
  private _id: number;
  public name: string;
  public type = 'BufferGeometry';
  public index: null | Uint32BufferAttribute | Uint16BufferAttribute;
  public attributes: Partial<{
    color: BufferAttribute<Uint16Array>;
    position: BufferAttribute<Float32Array>;
    uv: BufferAttribute<Float32Array>;
    uv2: BufferAttribute<Float32Array>;
    tangent: BufferAttribute<Float32Array>;
    normal: BufferAttribute<Float32Array>;
    [type: string]: BufferAttribute<TypeArray>;
  }>;
  public morphAttributes: {};
  public groups: Group[];
  public boundingBox: Box3 | null;
  public boundingSphere: Sphere | null;
  public drawRange: { start: number; count: number };

  public userData: any;

  constructor() {
    super();

    this.uuid = _Math.generateUUID();
    this.name = '';
    this.index = null;
    this.attributes = {};
    this.morphAttributes = {};
    this.groups = [];
    this.boundingBox = null;
    this.boundingSphere = null;
    this.drawRange = { start: 0, count: Infinity };
    this.userData = {};
  }

  set id(val: number) {
    this._id = bufferGeometryId += 2;
  }

  get id() {
    return this._id;
  }

  getIndex() {
    return this.index;
  }

  setIndex(index: Uint32BufferAttribute | Uint16BufferAttribute) {
    if (Array.isArray(index)) {
      this.index = new (arrayMax(index) > 65535 ? Uint32BufferAttribute : Uint16BufferAttribute)(index, 1);
    } else {
      this.index = index;
    }
  }

  addAttribute(name: string, attribute: BufferAttribute<TypeArray>) {
    this.attributes[name] = attribute;
    return this;
  }

  getAttribute(name: string) {
    return this.attributes[name];
  }

  removeAttribute(name: string) {
    delete this.attributes[name];

    return this;
  }

  addGroup(start: number, count: number, materialIndex: number) {
    this.groups.push({
      start: start,
      count: count,
      materialIndex: materialIndex !== undefined ? materialIndex : 0
    });
  }

  clearGroups() {
    this.groups = [];
  }

  setDrawRange(start: number, count: number) {
    this.drawRange.start = start;
    this.drawRange.count = count;
  }

  applyMatrix(matrix: Matrix4) {
    const position = this.attributes.position;

    if (position !== undefined) {
      matrix.applyToBufferAttribute(position);
      position.needsUpdate = true;
    }

    const normal = this.attributes.normal;

    if (normal !== undefined) {
      const normalMatrix = new Matrix3().getNormalMatrix(matrix);

      normalMatrix.applyToBufferAttribute(normal);
      normal.needsUpdate = true;
    }

    const tangent = this.attributes.tangent;

    if (tangent !== undefined) {
      const normalMatrix = new Matrix3().getNormalMatrix(matrix);

      // Tangent is vec4, but the '.w' component is a sign value (+1/-1).
      normalMatrix.applyToBufferAttribute(tangent);
      tangent.needsUpdate = true;
    }

    if (this.boundingBox !== null) {
      this.computeBoundingBox();
    }

    if (this.boundingSphere !== null) {
      this.computeBoundingSphere();
    }

    return this;
  }

  rotateX(angle: number) {
    // rotate geometry around world x-axis

    const m1 = BufferGeometry.buffer3;

    m1.makeRotationX(angle);

    this.applyMatrix(m1);

    return this;
  }

  rotateY(angle: number) {
    // rotate geometry around world y-axis

    const m1 = BufferGeometry.buffer3;

    m1.makeRotationY(angle);

    this.applyMatrix(m1);

    return this;
  }

  rotateZ(angle: number) {
    // rotate geometry around world z-axis

    const m1 = BufferGeometry.buffer3;

    m1.makeRotationZ(angle);

    this.applyMatrix(m1);

    return this;
  }

  translate(x: number, y: number, z: number) {
    // translate geometry

    const m1 = BufferGeometry.buffer3;

    m1.makeTranslation(x, y, z);

    this.applyMatrix(m1);

    return this;
  }

  scale(x: number, y: number, z: number) {
    // scale geometry

    const m1 = BufferGeometry.buffer3;

    m1.makeScale(x, y, z);

    this.applyMatrix(m1);

    return this;
  }

  lookAt(vector: Vector3) {
    const obj = BufferGeometry.buffer4;

    obj.lookAt(vector);

    obj.updateMatrix();

    this.applyMatrix(obj.matrix);
  }

  center() {
    const offset = BufferGeometry.buffer2;

    this.computeBoundingBox();

    this.boundingBox!.getCenter(offset).negate();

    this.translate(offset.x, offset.y, offset.z);

    return this;
  }

  setFromObject(object) {
    // console.log( 'THREE.BufferGeometry.setFromObject(). Converting', object, this );

    const geometry = object.geometry;

    if (object.isPoints || object.isLine) {
      const positions = new Float32BufferAttribute(geometry.vertices.length * 3, 3);
      const colors = new Float32BufferAttribute(geometry.colors.length * 3, 3);

      this.addAttribute('position', positions.copyVector3sArray(geometry.vertices));
      this.addAttribute('color', colors.copyColorsArray(geometry.colors));

      if (geometry.lineDistances && geometry.lineDistances.length === geometry.vertices.length) {
        const lineDistances = new Float32BufferAttribute(geometry.lineDistances.length, 1);

        this.addAttribute('lineDistance', lineDistances.copyArray(geometry.lineDistances));
      }

      if (geometry.boundingSphere !== null) {
        this.boundingSphere = geometry.boundingSphere.clone();
      }

      if (geometry.boundingBox !== null) {
        this.boundingBox = geometry.boundingBox.clone();
      }
    } else if (object.isMesh) {
      if (geometry && geometry.isGeometry) {
        this.fromGeometry(geometry);
      }
    }

    return this;
  }

  setFromPoints(points: Vector3[]) {
    const position: number[] = [];

    for (let i = 0, l = points.length; i < l; i++) {
      const point = points[i];
      position.push(point.x, point.y, point.z || 0);
    }

    this.addAttribute('position', new Float32BufferAttribute(position, 3));

    return this;
  }

  updateFromObject(object) {
    const geometry = object.geometry;

    if (object.isMesh) {
      const direct = geometry.__directGeometry;

      if (geometry.elementsNeedUpdate === true) {
        direct = undefined;
        geometry.elementsNeedUpdate = false;
      }

      if (direct === undefined) {
        return this.fromGeometry(geometry);
      }

      direct.verticesNeedUpdate = geometry.verticesNeedUpdate;
      direct.normalsNeedUpdate = geometry.normalsNeedUpdate;
      direct.colorsNeedUpdate = geometry.colorsNeedUpdate;
      direct.uvsNeedUpdate = geometry.uvsNeedUpdate;
      direct.groupsNeedUpdate = geometry.groupsNeedUpdate;

      geometry.verticesNeedUpdate = false;
      geometry.normalsNeedUpdate = false;
      geometry.colorsNeedUpdate = false;
      geometry.uvsNeedUpdate = false;
      geometry.groupsNeedUpdate = false;

      geometry = direct;
    }

    const attribute;

    if (geometry.verticesNeedUpdate === true) {
      attribute = this.attributes.position;

      if (attribute !== undefined) {
        attribute.copyVector3sArray(geometry.vertices);
        attribute.needsUpdate = true;
      }

      geometry.verticesNeedUpdate = false;
    }

    if (geometry.normalsNeedUpdate === true) {
      attribute = this.attributes.normal;

      if (attribute !== undefined) {
        attribute.copyVector3sArray(geometry.normals);
        attribute.needsUpdate = true;
      }

      geometry.normalsNeedUpdate = false;
    }

    if (geometry.colorsNeedUpdate === true) {
      attribute = this.attributes.color;

      if (attribute !== undefined) {
        attribute.copyColorsArray(geometry.colors);
        attribute.needsUpdate = true;
      }

      geometry.colorsNeedUpdate = false;
    }

    if (geometry.uvsNeedUpdate) {
      attribute = this.attributes.uv;

      if (attribute !== undefined) {
        attribute.copyVector2sArray(geometry.uvs);
        attribute.needsUpdate = true;
      }

      geometry.uvsNeedUpdate = false;
    }

    if (geometry.lineDistancesNeedUpdate) {
      attribute = this.attributes.lineDistance;

      if (attribute !== undefined) {
        attribute.copyArray(geometry.lineDistances);
        attribute.needsUpdate = true;
      }

      geometry.lineDistancesNeedUpdate = false;
    }

    if (geometry.groupsNeedUpdate) {
      geometry.computeGroups(object.geometry);
      this.groups = geometry.groups;

      geometry.groupsNeedUpdate = false;
    }

    return this;
  }

  fromGeometry(geometry: Geometry) {
    geometry.__directGeometry = new DirectGeometry().fromGeometry(geometry);

    return this.fromDirectGeometry(geometry.__directGeometry);
  }

  fromDirectGeometry(geometry: DirectGeometry) {
    const positions = new Float32Array(geometry.vertices.length * 3);
    this.addAttribute('position', new BufferAttribute(positions, 3).copyVector3sArray(geometry.vertices));

    if (geometry.normals.length > 0) {
      const normals = new Float32Array(geometry.normals.length * 3);
      this.addAttribute('normal', new BufferAttribute(normals, 3).copyVector3sArray(geometry.normals));
    }

    if (geometry.colors.length > 0) {
      const colors = new Float32Array(geometry.colors.length * 3);
      this.addAttribute('color', new BufferAttribute(colors, 3).copyColorsArray(geometry.colors));
    }

    if (geometry.uvs.length > 0) {
      const uvs = new Float32Array(geometry.uvs.length * 2);
      this.addAttribute('uv', new BufferAttribute(uvs, 2).copyVector2sArray(geometry.uvs));
    }

    if (geometry.uvs2.length > 0) {
      const uvs2 = new Float32Array(geometry.uvs2.length * 2);
      this.addAttribute('uv2', new BufferAttribute(uvs2, 2).copyVector2sArray(geometry.uvs2));
    }

    // groups

    this.groups = geometry.groups;

    // morphs

    for (let name in geometry.morphTargets) {
      const array = [];
      const morphTargets = geometry.morphTargets[name];

      for (let i = 0, l = morphTargets.length; i < l; i++) {
        const morphTarget = morphTargets[i];

        const attribute = new Float32BufferAttribute(morphTarget.data.length * 3, 3);
        attribute.name = morphTarget.name;

        array.push(attribute.copyVector3sArray(morphTarget.data));
      }

      this.morphAttributes[name] = array;
    }

    // skinning

    if (geometry.skinIndices.length > 0) {
      const skinIndices = new Float32BufferAttribute(geometry.skinIndices.length * 4, 4);
      this.addAttribute('skinIndex', skinIndices.copyVector4sArray(geometry.skinIndices));
    }

    if (geometry.skinWeights.length > 0) {
      const skinWeights = new Float32BufferAttribute(geometry.skinWeights.length * 4, 4);
      this.addAttribute('skinWeight', skinWeights.copyVector4sArray(geometry.skinWeights));
    }

    //

    if (geometry.boundingSphere !== null) {
      this.boundingSphere = geometry.boundingSphere.clone();
    }

    if (geometry.boundingBox !== null) {
      this.boundingBox = geometry.boundingBox.clone();
    }

    return this;
  }

  computeBoundingBox() {
    if (this.boundingBox === null) {
      this.boundingBox = new Box3();
    }

    const position = this.attributes.position;

    if (position !== undefined) {
      this.boundingBox.setFromBufferAttribute(position);
    } else {
      this.boundingBox.makeEmpty();
    }

    if (isNaN(this.boundingBox.min.x) || isNaN(this.boundingBox.min.y) || isNaN(this.boundingBox.min.z)) {
      console.error(
        'THREE.BufferGeometry.computeBoundingBox: Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',
        this
      );
    }
  }

  computeBoundingSphere() {
    const box = BufferGeometry.buffer1;
    const vector = BufferGeometry.buffer2;

    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere();
    }

    const position = this.attributes.position;

    if (position) {
      const center = this.boundingSphere.center;

      box.setFromBufferAttribute(position);
      box.getCenter(center);

      // hoping to find a boundingSphere with a radius smaller than the
      // boundingSphere of the boundingBox: sqrt(3) smaller in the best case

      const maxRadiusSq = 0;

      for (let i = 0, il = position.count; i < il; i++) {
        vector.x = position.getX(i);
        vector.y = position.getY(i);
        vector.z = position.getZ(i);
        maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(vector));
      }

      this.boundingSphere.radius = Math.sqrt(maxRadiusSq);

      if (isNaN(this.boundingSphere.radius)) {
        console.error(
          'THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',
          this
        );
      }
    }
  }

  computeFaceNormals() {
    // backwards compatibility
  }

  computeVertexNormals() {
    const index = this.index;
    const attributes = this.attributes;

    if (attributes.position) {
      const positions = attributes.position.array;

      if (attributes.normal === undefined) {
        this.addAttribute('normal', new BufferAttribute(new Float32Array(positions.length), 3));
      } else {
        // reset existing normals to zero

        const array = attributes.normal.array;

        for (let i = 0, il = array.length; i < il; i++) {
          array[i] = 0;
        }
      }

      const normals = attributes.normal!.array;

      let vA: number, vB: number, vC: number;
      const pA = new Vector3(),
        pB = new Vector3(),
        pC = new Vector3();
      const cb = new Vector3(),
        ab = new Vector3();

      // indexed elements

      if (index) {
        const indices = index.array;

        for (let i = 0, il = index.count; i < il; i += 3) {
          vA = indices[i + 0] * 3;
          vB = indices[i + 1] * 3;
          vC = indices[i + 2] * 3;

          pA.fromArray(positions, vA);
          pB.fromArray(positions, vB);
          pC.fromArray(positions, vC);

          cb.subVectors(pC, pB);
          ab.subVectors(pA, pB);
          cb.cross(ab);

          normals[vA] += cb.x;
          normals[vA + 1] += cb.y;
          normals[vA + 2] += cb.z;

          normals[vB] += cb.x;
          normals[vB + 1] += cb.y;
          normals[vB + 2] += cb.z;

          normals[vC] += cb.x;
          normals[vC + 1] += cb.y;
          normals[vC + 2] += cb.z;
        }
      } else {
        // non-indexed elements (unconnected triangle soup)

        for (let i = 0, il = positions.length; i < il; i += 9) {
          pA.fromArray(positions, i);
          pB.fromArray(positions, i + 3);
          pC.fromArray(positions, i + 6);

          cb.subVectors(pC, pB);
          ab.subVectors(pA, pB);
          cb.cross(ab);

          normals[i] = cb.x;
          normals[i + 1] = cb.y;
          normals[i + 2] = cb.z;

          normals[i + 3] = cb.x;
          normals[i + 4] = cb.y;
          normals[i + 5] = cb.z;

          normals[i + 6] = cb.x;
          normals[i + 7] = cb.y;
          normals[i + 8] = cb.z;
        }
      }

      this.normalizeNormals();

      attributes.normal!.needsUpdate = true;
    }
  }

  merge(geometry: BufferGeometry, offset: number = 0) {
    const attributes = this.attributes;

    for (let key in attributes) {
      if (geometry.attributes[key] === undefined) continue;

      const attribute1 = attributes[key];
      const attributeArray1 = attribute1.array;

      const attribute2 = geometry.attributes[key];
      const attributeArray2 = attribute2.array;

      const attributeSize = attribute2.itemSize;

      for (let i = 0, j = attributeSize * offset; i < attributeArray2.length; i++, j++) {
        attributeArray1[j] = attributeArray2[i];
      }
    }

    return this;
  }

  normalizeNormals() {
    const vector = BufferGeometry.buffer2;

    const normals = this.attributes.normal!;

    for (let i = 0, il = normals.count; i < il; i++) {
      vector.x = normals.getX(i);
      vector.y = normals.getY(i);
      vector.z = normals.getZ(i);

      vector.normalize();

      normals.setXYZ(i, vector.x, vector.y, vector.z);
    }
  }

  toNonIndexed() {
    function convertBufferAttribute(attribute, indices: ArrayLike<number>) {
      const array = attribute.array;
      const itemSize = attribute.itemSize;

      const array2 = new array.constructor(indices.length * itemSize);

      const index = 0,
        index2 = 0;

      for (let i = 0, l = indices.length; i < l; i++) {
        index = indices[i] * itemSize;

        for (let j = 0; j < itemSize; j++) {
          array2[index2++] = array[index++];
        }
      }

      return new BufferAttribute(array2, itemSize);
    }

    if (this.index === null) {
      console.warn('THREE.BufferGeometry.toNonIndexed(): Geometry is already non-indexed.');
      return this;
    }

    const geometry2 = new BufferGeometry();

    const indices = this.index.array;
    const attributes = this.attributes;

    // attributes

    for (let name in attributes) {
      const attribute = attributes[name];

      const newAttribute = convertBufferAttribute(attribute, indices);

      geometry2.addAttribute(name, newAttribute);
    }

    // morph attributes

    const morphAttributes = this.morphAttributes;

    for (name in morphAttributes) {
      const morphArray = [];
      const morphAttribute = morphAttributes[name]; // morphAttribute: array of Float32BufferAttributes

      for (let i = 0, il = morphAttribute.length; i < il; i++) {
        const attribute = morphAttribute[i];

        const newAttribute = convertBufferAttribute(attribute, indices);

        morphArray.push(newAttribute);
      }

      geometry2.morphAttributes[name] = morphArray;
    }

    // groups

    const groups = this.groups;

    for (let i = 0, l = groups.length; i < l; i++) {
      const group = groups[i];
      geometry2.addGroup(group.start, group.count, group.materialIndex);
    }

    return geometry2;
  }

  clone() {
    return new BufferGeometry().copy(this);
  }

  copy(source: BufferGeometry) {
    let name: string, i: number, l: number;

    // reset
    this.index = null;
    this.attributes = {};
    this.morphAttributes = {};
    this.groups = [];
    this.boundingBox = null;
    this.boundingSphere = null;

    // name
    this.name = source.name;

    // index
    const index = source.index;

    if (index !== null) {
      this.setIndex(index.clone());
    }

    // attributes
    const attributes = source.attributes;

    for (name in attributes) {
      const attribute = attributes[name];
      this.addAttribute(name, attribute.clone());
    }

    // morph attributes
    const morphAttributes = source.morphAttributes;

    for (name in morphAttributes) {
      const array = [];
      const morphAttribute = morphAttributes[name]; // morphAttribute: array of Float32BufferAttributes

      for (i = 0, l = morphAttribute.length; i < l; i++) {
        array.push(morphAttribute[i].clone());
      }

      this.morphAttributes[name] = array;
    }

    // groups
    const groups = source.groups;

    for (i = 0, l = groups.length; i < l; i++) {
      const group = groups[i];
      this.addGroup(group.start, group.count, group.materialIndex);
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

    // draw range
    this.drawRange.start = source.drawRange.start;
    this.drawRange.count = source.drawRange.count;

    // user data
    this.userData = source.userData;

    return this;
  }

  dispose() {
    this.dispatchEvent({ type: 'dispose' });
  }
}
