import {Interpolant} from '../interpolant';
import {Quaternion} from '../quaternion';

export class QuaternionLinearInterpolant<T extends Array<number> | Float32Array | Float64Array> extends Interpolant<T> {
  constructor(parameterPositions: number[], sampleValues: T, sampleSize: number, resultBuffer: T) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);
  }

  protected interpolate(i1: number, t0: number, t: number, t1: number) {
    const result = this.resultBuffer,
      values = this.sampleValues,
      stride = this.valueSize;

    let offset = i1 * stride,
      alpha = (t - t0) / (t1 - t0);

    for (var end = offset + stride; offset !== end; offset += 4) {
      Quaternion.slerpFlat(result, 0, values, offset - stride, values, offset, alpha);
    }

    return result;
  }
}
