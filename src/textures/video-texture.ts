import { TexelType, FormatType, FilterType, WrappingType, MappingType } from '../constants';
import { Texture } from './texture';

export class VideoTexture extends Texture {
  public isVideoTexture = true;

  constructor(
    video: HTMLVideoElement,
    mapping?: MappingType,
    wrapS?: WrappingType,
    wrapT?: WrappingType,
    magFilter?: FilterType,
    minFilter?: FilterType,
    format?: FormatType,
    type?: TexelType,
    anisotropy?: number
  ) {
    super(video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);

    this.format = format !== undefined ? format : FormatType.RGBFormat;

    this.minFilter = minFilter !== undefined ? minFilter : FilterType.LinearFilter;
    this.magFilter = magFilter !== undefined ? magFilter : FilterType.LinearFilter;

    this.generateMipmaps = false;
  }

  update() {
    var video = this.image as HTMLVideoElement;

    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      this.needsUpdate = true;
    }
  }
}
