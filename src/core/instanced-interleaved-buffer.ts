import { InterleavedBuffer } from './interleaved-buffer';
import { TypeArray } from './buffer-attribute';

export class InstancedInterleavedBuffer extends InterleavedBuffer {
  public meshPerAttribute: number;
  public isInstancedInterleavedBuffer = true;

  constructor(array: TypeArray, stride: number, meshPerAttribute = 1) {
    super(array, stride);

    this.meshPerAttribute = meshPerAttribute;
  }

  copy(source: InstancedInterleavedBuffer) {
    super.copy(source);

    this.meshPerAttribute = source.meshPerAttribute;

    return this;
  }
}
