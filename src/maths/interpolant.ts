/**
 * Abstract base class of interpolants over parametric samples.
 *
 * The parameter domain is one dimensional, typically the time or a path
 * along a curve defined by the data.
 *
 * The sample values can have any dimensionality and derived classes may
 * apply special interpretations to the data.
 *
 * This class provides the interval seek in a Template Method, deferring
 * the actual interpolation to derived classes.
 *
 * Time complexity is O(1) for linear access crossing at most two points
 * and O(log N) for random access, where N is the number of positions.
 *
 * References:
 *
 * 		http://www.oodesign.com/template-method-pattern.html
 *
 * @author tschw
 */

export abstract class Interpolant<T extends Array<number> | Float32Array | Float64Array> {
  private _cachedIndex: number;
  public parameterPositions: number[];
  public resultBuffer: T;
  public sampleValues: T;
  public valueSize: number;

  constructor(parameterPositions: number[], sampleValues: T, sampleSize: number, resultBuffer: T) {
    this.parameterPositions = parameterPositions;
    this._cachedIndex = 0;

    this.resultBuffer = resultBuffer !== undefined ? resultBuffer : new (sampleValues as any).constructor(sampleSize);
    this.sampleValues = sampleValues;
    this.valueSize = sampleSize;
  }

  evaluate(t: number) {
    let pp = this.parameterPositions,
      i1 = this._cachedIndex,
      t1 = pp[i1],
      t0 = pp[i1 - 1];

    return this.interpolate(i1, t0, t, t1);
  }

  protected copySampleValue_(index: number) {
    // copies a sample value to the result buffer

    const result = this.resultBuffer,
      values = this.sampleValues,
      stride = this.valueSize,
      offset = index * stride;

    for (let i = 0; i !== stride; ++i) {
      result[i] = values[offset + i];
    }

    return result;
  }

  protected abstract interpolate(...args: number[]): T;
}
