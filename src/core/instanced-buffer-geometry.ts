import { BufferGeometry } from './buffer-geometry';

export class InstancedBufferGeometry extends BufferGeometry {
  public type = 'InstancedBufferGeometry';
  public isInstancedBufferGeometry = true;
  public maxInstancedCount: undefined | number;

  constructor() {
    super();

    this.maxInstancedCount = undefined;
  }

  copy(source: InstancedBufferGeometry) {
    BufferGeometry.prototype.copy.call(this, source);

    this.maxInstancedCount = source.maxInstancedCount;

    return this;
  }

  clone() {
    return new InstancedBufferGeometry().copy(this);
  }
}
