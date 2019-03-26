import { Texture, ImageType } from './texture';
import { FilterType, WrappingType } from '../constants';

export class DataTexture2DArray extends Texture {
  public isDataTexture2DArray = true;
  public wrapR: WrappingType;

  constructor(data: ArrayLike<number>, width: number, height: number, depth: number) {
    super(null);
    this.image = { data: data, width: width, height: height, depth: depth };
    this.magFilter = FilterType.NearestFilter;
    this.minFilter = FilterType.NearestFilter;
    this.wrapR = WrappingType.ClampToEdgeWrapping;
    this.generateMipmaps = false;
    this.flipY = false;
  }

  copy(source: DataTexture2DArray): Texture {
    source.wrapR = this.wrapR;
    return super.copy(source);
  }

  clone(source?: DataTexture2DArray): Texture {
    return (
      source ||
      new DataTexture2DArray(
        (this.image as ImageType).data!,
        (this.image as ImageType).width,
        (this.image as ImageType).height,
        (this.image as ImageType).depth!
      )
    ).copy(this);
  }
}
