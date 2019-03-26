import { Texture } from './texture';
import { FormatType, TexelType, EncodingType, MappingType, WrappingType, FilterType } from '../constants';

export class CubeTexture extends Texture {
  public isCubeTexture = true;
  public images: HTMLImageElement[] | HTMLCanvasElement[];

  constructor(
    images: HTMLImageElement[],
    mapping = MappingType.CubeReflectionMapping,
    wrapS?: WrappingType,
    wrapT?: WrappingType,
    magFilter?: FilterType,
    minFilter?: FilterType,
    format = FormatType.RGBFormat,
    type?: TexelType,
    anisotropy?: number,
    encoding?: EncodingType
  ) {
    super(null, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, encoding);
    this.flipY = false;
    this.images = images;
  }

  copy(source: CubeTexture): Texture {
    source.images = this.images;
    return super.copy(source);
  }

  clone(source?: CubeTexture): Texture {
    return (source || new CubeTexture(this.images as HTMLImageElement[])).copy(this);
  }
}
