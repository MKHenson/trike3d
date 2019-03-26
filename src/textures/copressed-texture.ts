import { Texture } from './texture';
import { EncodingType, FilterType, WrappingType, MappingType, TexelType, FormatType } from '../constants';

export class CompressedTexture extends Texture {
  public isCompressedTexture = true;

  constructor(
    mipmaps: Texture[],
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

    this.image = { width: width, height: height };
    this.mipmaps = mipmaps;

    // no flipping for cube textures
    // (also flipping doesn't work for compressed textures )

    this.flipY = false;

    // can't generate mipmaps for compressed textures
    // mips must be embedded in DDS files

    this.generateMipmaps = false;
  }

  clone(source?: CompressedTexture): Texture {
    return (source || new CompressedTexture([], this.image!.width, this.image!.height)).copy(this);
  }
}
