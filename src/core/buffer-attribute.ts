import { Vector4 } from '../maths/vector4.js';
import { Vector3 } from '../maths/vector3.js';
import { Vector2 } from '../maths/vector2.js';
import { Color } from '../maths/color.js';

export type TypeArray =
  | Float32Array
  | Float64Array
  | Int16Array
  | Int32Array
  | Int8Array
  | Uint16Array
  | Uint32Array
  | Uint8Array
  | Uint8ClampedArray
  | Uint32Array;

export class BufferAttribute<T extends TypeArray> {
  public isBufferAttribute = true;
  public name: string;
  public array: T;
  public itemSize: number;
  public count: number;
  public normalized: boolean;
  public dynamic: boolean;
  public updateRange: { offset: number; count: number };
  public version: number;

  constructor(array: T, itemSize: number, normalized?: boolean) {
    this.name = '';

    this.array = array;
    this.itemSize = itemSize;
    this.count = array !== undefined ? array.length / itemSize : 0;
    this.normalized = normalized === true;

    this.dynamic = false;
    this.updateRange = { offset: 0, count: -1 };

    this.version = 0;
  }

  set needsUpdate(value: boolean) {
    if (value === true) this.version++;
  }

  onUploadCallback() {}

  setArray(array: T) {
    this.count = array !== undefined ? array.length / this.itemSize : 0;
    this.array = array;

    return this;
  }

  setDynamic(value: boolean) {
    this.dynamic = value;

    return this;
  }

  copy(source: BufferAttribute<T>) {
    this.name = source.name;
    this.array = new (source.array.constructor as any)(source.array);
    this.itemSize = source.itemSize;
    this.count = source.count;
    this.normalized = source.normalized;

    this.dynamic = source.dynamic;

    return this;
  }

  copyAt(index1: number, attribute: { itemSize: number; array: ArrayLike<number> }, index2: number) {
    index1 *= this.itemSize;
    index2 *= attribute.itemSize;

    for (var i = 0, l = this.itemSize; i < l; i++) {
      this.array[index1 + i] = attribute.array[index2 + i];
    }

    return this;
  }

  copyArray(array: T) {
    this.array.set(array);

    return this;
  }

  copyColorsArray(colors: Color[]) {
    var array = this.array,
      offset = 0;

    for (var i = 0, l = colors.length; i < l; i++) {
      var color = colors[i];

      if (color === undefined) {
        console.warn('THREE.BufferAttribute.copyColorsArray(): color is undefined', i);
        color = new Color();
      }

      array[offset++] = color.r;
      array[offset++] = color.g;
      array[offset++] = color.b;
    }

    return this;
  }

  copyVector2sArray(vectors: Vector2[]) {
    var array = this.array,
      offset = 0;

    for (var i = 0, l = vectors.length; i < l; i++) {
      var vector = vectors[i];
      array[offset++] = vector.x;
      array[offset++] = vector.y;
    }

    return this;
  }

  copyVector3sArray(vectors: Vector3[]) {
    var array = this.array,
      offset = 0;

    for (var i = 0, l = vectors.length; i < l; i++) {
      var vector = vectors[i];

      array[offset++] = vector.x;
      array[offset++] = vector.y;
      array[offset++] = vector.z;
    }

    return this;
  }

  copyVector4sArray(vectors: Vector4[]) {
    var array = this.array,
      offset = 0;

    for (var i = 0, l = vectors.length; i < l; i++) {
      var vector = vectors[i];

      array[offset++] = vector.x;
      array[offset++] = vector.y;
      array[offset++] = vector.z;
      array[offset++] = vector.w;
    }

    return this;
  }

  set(value: ArrayLike<number>, offset: number) {
    if (offset === undefined) offset = 0;

    this.array.set(value, offset);

    return this;
  }

  getX(index: number) {
    return this.array[index * this.itemSize];
  }

  setX(index: number, x: number) {
    this.array[index * this.itemSize] = x;

    return this;
  }

  getY(index: number) {
    return this.array[index * this.itemSize + 1];
  }

  setY(index: number, y: number) {
    this.array[index * this.itemSize + 1] = y;

    return this;
  }

  getZ(index: number) {
    return this.array[index * this.itemSize + 2];
  }

  setZ(index: number, z: number) {
    this.array[index * this.itemSize + 2] = z;

    return this;
  }

  getW(index: number) {
    return this.array[index * this.itemSize + 3];
  }

  setW(index: number, w: number) {
    this.array[index * this.itemSize + 3] = w;

    return this;
  }

  setXY(index: number, x: number, y: number) {
    index *= this.itemSize;

    this.array[index + 0] = x;
    this.array[index + 1] = y;

    return this;
  }

  setXYZ(index: number, x: number, y: number, z: number) {
    index *= this.itemSize;

    this.array[index + 0] = x;
    this.array[index + 1] = y;
    this.array[index + 2] = z;

    return this;
  }

  setXYZW(index: number, x: number, y: number, z: number, w: number) {
    index *= this.itemSize;

    this.array[index + 0] = x;
    this.array[index + 1] = y;
    this.array[index + 2] = z;
    this.array[index + 3] = w;

    return this;
  }

  onUpload(callback: () => void) {
    this.onUploadCallback = callback;

    return this;
  }

  clone() {
    return new BufferAttribute(this.array, this.itemSize).copy(this);
  }
}

export class Int8BufferAttribute extends BufferAttribute<Int8Array> {
  constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean) {
    super(new Int8Array(array), itemSize, normalized);
  }

  clone(): Int8BufferAttribute {
    return new Int8BufferAttribute(this.array, this.itemSize).copy(this);
  }
}

export class Uint8BufferAttribute extends BufferAttribute<Uint8Array> {
  constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean) {
    super(new Uint8Array(array), itemSize, normalized);
  }

  clone(): Uint8BufferAttribute {
    return new Uint8BufferAttribute(this.array, this.itemSize).copy(this);
  }
}

export class Uint8ClampedBufferAttribute extends BufferAttribute<Uint8ClampedArray> {
  constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean) {
    super(new Uint8ClampedArray(array), itemSize, normalized);
  }

  clone(): Uint8ClampedBufferAttribute {
    return new Uint8ClampedBufferAttribute(this.array, this.itemSize).copy(this);
  }
}

export class Int16BufferAttribute extends BufferAttribute<Int16Array> {
  constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean) {
    super(new Int16Array(array), itemSize, normalized);
  }

  clone(): Int16BufferAttribute {
    return new Int16BufferAttribute(this.array, this.itemSize).copy(this);
  }
}

export class Uint16BufferAttribute extends BufferAttribute<Uint16Array> {
  constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean) {
    super(new Uint16Array(array), itemSize, normalized);
  }

  clone(): Uint16BufferAttribute {
    return new Uint16BufferAttribute(this.array, this.itemSize).copy(this);
  }
}

export class Int32BufferAttribute extends BufferAttribute<Int32Array> {
  constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean) {
    super(new Int32Array(array), itemSize, normalized);
  }

  clone(): Int32BufferAttribute {
    return new Int32BufferAttribute(this.array, this.itemSize).copy(this);
  }
}

export class Uint32BufferAttribute extends BufferAttribute<Uint32Array> {
  constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean) {
    super(new Uint32Array(array), itemSize, normalized);
  }

  clone(): Uint32BufferAttribute {
    return new Uint32BufferAttribute(this.array, this.itemSize).copy(this);
  }
}

export class Float32BufferAttribute extends BufferAttribute<Float32Array> {
  constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean) {
    super(new Float32Array(array), itemSize, normalized);
  }

  clone(): Float32BufferAttribute {
    return new Float32BufferAttribute(this.array, this.itemSize).copy(this);
  }
}

export class Float64BufferAttribute extends BufferAttribute<Float64Array> {
  constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean) {
    super(new Float64Array(array), itemSize, normalized);
  }

  clone(): Float64BufferAttribute {
    return new Float64BufferAttribute(this.array, this.itemSize).copy(this);
  }
}
