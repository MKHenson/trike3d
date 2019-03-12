import {Interpolant} from '../interpolant';

export class LinearInterpolant<T extends Array<number> | Float32Array | Float64Array> extends Interpolant<T> {
  constructor(parameterPositions: number[], sampleValues: T, sampleSize: number, resultBuffer: T) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);
  }

  protected interpolate(i1: number, t0: number, t: number, t1: number) {
    var result = this.resultBuffer,
      values = this.sampleValues,
      stride = this.valueSize,
      offset1 = i1 * stride,
      offset0 = offset1 - stride,
      weight1 = (t - t0) / (t1 - t0),
      weight0 = 1 - weight1;

    for (var i = 0; i !== stride; ++i) {
      result[i] = values[offset0 + i] * weight0 + values[offset1 + i] * weight1;
    }

    return result;
  }
}