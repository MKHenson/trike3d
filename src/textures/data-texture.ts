import { Texture, ImageType } from './texture';
import { EncodingType, FilterType, WrappingType, MappingType, TexelType, FormatType } from '../constants';

export class DataTexture extends Texture {
  public isDataTexture = true;

  constructor(
    data: ArrayLike<number>,
    width: number,
    height: number,
    format?: FormatType,
    type?: TexelType,
    mapping?: MappingType,
    wrapS?: WrappingType,
    wrapT?: WrappingType,
    magFilter?: FilterType,
    minFilter?: FilterType,
    anisotropy?: number,
    encoding?: EncodingType
  ) {
    super(null, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, encoding);

    this.image = { data: data, width: width, height: height };

    this.magFilter = magFilter !== undefined ? magFilter : FilterType.NearestFilter;
    this.minFilter = minFilter !== undefined ? minFilter : FilterType.NearestFilter;

    this.generateMipmaps = false;
    this.flipY = false;
    this.unpackAlignment = 1;
  }

  clone(source?: DataTexture): Texture {
    return (
      source ||
      new DataTexture(
        (this.image as ImageType)!.data!,
        (this.image as ImageType)!.width,
        (this.image as ImageType)!.height
      )
    ).copy(this);
  }
}
