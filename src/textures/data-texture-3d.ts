import { Texture, ImageType } from './texture';
import { WrappingType, FilterType } from '../constants';

export class DataTexture3D extends Texture {
  public isDataTexture3D = true;
  public wrapR: WrappingType;

  constructor(data: ArrayLike<number>, width: number, height: number, depth: number) {
    // We're going to add .setXXX() methods for setting properties later.
    // Users can still set in DataTexture3D directly.
    //
    //	var texture = new THREE.DataTexture3D( data, width, height, depth );
    // 	texture.anisotropy = 16;
    //
    // See #14839

    super(null);

    this.image = { data: data, width: width, height: height, depth: depth };

    this.magFilter = FilterType.NearestFilter;
    this.minFilter = FilterType.NearestFilter;

    this.wrapR = WrappingType.ClampToEdgeWrapping;

    this.generateMipmaps = false;
    this.flipY = false;
  }

  copy(source: DataTexture3D): Texture {
    source.wrapR = this.wrapR;
    return super.copy(source);
  }

  clone(source?: DataTexture3D): Texture {
    return (
      source ||
      new DataTexture3D(
        (this.image as ImageType).data!,
        (this.image as ImageType).width,
        (this.image as ImageType).height,
        (this.image as ImageType).depth!
      )
    ).copy(this);
  }
}
