import { TypeArray } from './buffer-attribute';

export interface Data {
  count: number;
  stride: number;
  array: TypeArray;
}

export class InterleavedBufferAttribute {
  public isInterleavedBufferAttribute = true;

  public data: Data;
  public itemSize: number;
  public offset: number;
  public normalized: boolean;

  constructor(interleavedBuffer: Data, itemSize: number, offset: number, normalized: boolean) {
    this.data = interleavedBuffer;
    this.itemSize = itemSize;
    this.offset = offset;
    this.normalized = normalized === true;
  }

  get count() {
    return this.data.count;
  }

  get array() {
    return this.data.array;
  }

  setX(index: number, x: number) {
    this.data.array[index * this.data.stride + this.offset] = x;

    return this;
  }

  setY(index: number, y: number) {
    this.data.array[index * this.data.stride + this.offset + 1] = y;

    return this;
  }

  setZ(index: number, z: number) {
    this.data.array[index * this.data.stride + this.offset + 2] = z;

    return this;
  }

  setW(index: number, w: number) {
    this.data.array[index * this.data.stride + this.offset + 3] = w;

    return this;
  }

  getX(index: number) {
    return this.data.array[index * this.data.stride + this.offset];
  }

  getY(index: number) {
    return this.data.array[index * this.data.stride + this.offset + 1];
  }

  getZ(index: number) {
    return this.data.array[index * this.data.stride + this.offset + 2];
  }

  getW(index: number) {
    return this.data.array[index * this.data.stride + this.offset + 3];
  }

  setXY(index: number, x: number, y: number) {
    index = index * this.data.stride + this.offset;

    this.data.array[index + 0] = x;
    this.data.array[index + 1] = y;

    return this;
  }

  setXYZ(index: number, x: number, y: number, z: number) {
    index = index * this.data.stride + this.offset;

    this.data.array[index + 0] = x;
    this.data.array[index + 1] = y;
    this.data.array[index + 2] = z;

    return this;
  }

  setXYZW(index: number, x: number, y: number, z: number, w: number) {
    index = index * this.data.stride + this.offset;

    this.data.array[index + 0] = x;
    this.data.array[index + 1] = y;
    this.data.array[index + 2] = z;
    this.data.array[index + 3] = w;

    return this;
  }
}
