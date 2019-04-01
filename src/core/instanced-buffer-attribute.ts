import { BufferAttribute, TypeArray } from './buffer-attribute';

export class InstancedBufferAttribute<T extends TypeArray> extends BufferAttribute<T> {
  public meshPerAttribute: number;
  public isInstancedBufferAttribute = true;

  constructor(array: T, itemSize: number, normalized?: boolean, meshPerAttribute = 1) {
    super(array, itemSize, normalized);

    this.meshPerAttribute = meshPerAttribute;
  }

  copy(source: InstancedBufferAttribute<T>) {
    super.copy(source);
    this.meshPerAttribute = source.meshPerAttribute;
    return this;
  }
}
