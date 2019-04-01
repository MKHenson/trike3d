import { TypeArray } from './buffer-attribute';

export class InterleavedBuffer {
  public isInterleavedBuffer = true;

  public array: TypeArray;
  public stride: number;
  public count: number;
  public dynamic: boolean;
  public updateRange: { offset: number; count: number };
  public version: number;

  constructor(array: TypeArray, stride: number) {
    this.array = array;
    this.stride = stride;
    this.count = array !== undefined ? array.length / stride : 0;

    this.dynamic = false;
    this.updateRange = { offset: 0, count: -1 };

    this.version = 0;
  }

  set needsUpdate(value: boolean) {
    if (value === true) this.version++;
  }

  onUploadCallback() {}

  setArray(array: TypeArray) {
    this.count = array !== undefined ? array.length / this.stride : 0;
    this.array = array;
    return this;
  }

  setDynamic(value: boolean) {
    this.dynamic = value;

    return this;
  }

  copy(source: InterleavedBuffer) {
    this.array = source.array.slice(0);
    this.count = source.count;
    this.stride = source.stride;
    this.dynamic = source.dynamic;

    return this;
  }

  copyAt(index1: number, attribute: { array: TypeArray; stride: number }, index2: number) {
    index1 *= this.stride;
    index2 *= attribute.stride;

    for (var i = 0, l = this.stride; i < l; i++) {
      this.array[index1 + i] = attribute.array[index2 + i];
    }

    return this;
  }

  set(value: TypeArray, offset: number = 0) {
    this.array.set(value, offset);
    return this;
  }

  clone() {
    return new InterleavedBuffer(this.array, this.stride).copy(this);
  }

  onUpload(callback: () => void) {
    this.onUploadCallback = callback;

    return this;
  }
}
