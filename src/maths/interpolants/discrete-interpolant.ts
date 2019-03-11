import {Interpolant} from '../interpolant';

export class DiscreetInterpolant<T extends Array<number> | Float32Array | Float64Array> extends Interpolant<T> {
  constructor(parameterPositions: number[], sampleValues: T, sampleSize: number, resultBuffer: T) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);
  }

  protected interpolate(i1: number) {
    return this.copySampleValue_(i1 - 1);
  }
}
