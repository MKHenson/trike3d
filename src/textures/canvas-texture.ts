import { Texture } from './texture';
import { MappingType, WrappingType, FilterType, FormatType, TexelType } from '../constants';

export class CanvasTexture extends Texture {
  public isCanvasTexture = true;

  constructor(
    canvas?: HTMLCanvasElement,
    mapping?: MappingType,
    wrapS?: WrappingType,
    wrapT?: WrappingType,
    magFilter?: FilterType,
    minFilter?: FilterType,
    format?: FormatType,
    type?: TexelType,
    anisotropy?: number
  ) {
    super(canvas, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);
    this.needsUpdate = true;
  }

  clone(source?: CanvasTexture): Texture {
    return (source || new CanvasTexture()).copy(this);
  }
}
