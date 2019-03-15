import { ZeroCurvatureEnding } from '../../constants.js';
import { Interpolant } from '../interpolant';

/**
 * Fast and simple cubic spline interpolant.
 *
 * It was derived from a Hermitian construction setting the first derivative
 * at each sample position to the linear slope between neighboring positions
 * over their parameter interval.
 *
 * @author tschw
 */

export class CubicInterpolant<T extends Array<number> | Float32Array | Float64Array> extends Interpolant<T> {
  DefaultSettings_ = {
    endingStart: ZeroCurvatureEnding,
    endingEnd: ZeroCurvatureEnding
  };

  public _weightPrev: number;
  public _offsetPrev: number;
  public _weightNext: number;
  public _offsetNext: number;

  constructor(parameterPositions: number[], sampleValues: T, sampleSize: number, resultBuffer: T) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);

    this._weightPrev = -0;
    this._offsetPrev = -0;
    this._weightNext = -0;
    this._offsetNext = -0;
  }

  protected interpolate(i1: number, t0: number, t: number, t1: number) {
    const result = this.resultBuffer,
      values = this.sampleValues,
      stride = this.valueSize,
      o1 = i1 * stride,
      o0 = o1 - stride,
      oP = this._offsetPrev,
      oN = this._offsetNext,
      wP = this._weightPrev,
      wN = this._weightNext,
      p = (t - t0) / (t1 - t0),
      pp = p * p,
      ppp = pp * p;

    // evaluate polynomials

    const sP = -wP * ppp + 2 * wP * pp - wP * p;
    const s0 = (1 + wP) * ppp + (-1.5 - 2 * wP) * pp + (-0.5 + wP) * p + 1;
    const s1 = (-1 - wN) * ppp + (1.5 + wN) * pp + 0.5 * p;
    const sN = wN * ppp - wN * pp;

    // combine data linearly

    for (let i = 0; i !== stride; ++i) {
      result[i] = sP * values[oP + i] + s0 * values[o0 + i] + s1 * values[o1 + i] + sN * values[oN + i];
    }

    return result;
  }
}
