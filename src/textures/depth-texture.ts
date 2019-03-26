import { Texture, ImageType } from './texture';
import { MappingType, WrappingType, FilterType, FormatType, TexelType } from '../constants';

export class DepthTexture extends Texture {
  public isDepthTexture = true;

  constructor(
    width: number,
    height: number,
    type?: TexelType,
    mapping?: MappingType,
    wrapS?: WrappingType,
    wrapT?: WrappingType,
    magFilter?: FilterType,
    minFilter?: FilterType,
    anisotropy?: number,
    format: FormatType = FormatType.DepthFormat
  ) {
    super(null, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);

    if (type === undefined && format === FormatType.DepthFormat) this.type = TexelType.UnsignedShortType;
    if (type === undefined && format === FormatType.DepthStencilFormat) this.type = TexelType.UnsignedInt248Type;

    if (format !== FormatType.DepthFormat && format !== FormatType.DepthStencilFormat) {
      throw new Error('DepthTexture format must be either FormatType.DepthFormat or FormatType.DepthStencilFormat');
    }

    this.image = { width: width, height: height };

    this.magFilter = magFilter !== undefined ? magFilter : FilterType.NearestFilter;
    this.minFilter = minFilter !== undefined ? minFilter : FilterType.NearestFilter;

    this.flipY = false;
    this.generateMipmaps = false;
  }

  clone(source?: DepthTexture): Texture {
    return (source || new DepthTexture((this.image! as ImageType).width, (this.image! as ImageType).height)).copy(this);
  }
}
