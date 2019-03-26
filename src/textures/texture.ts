import { EventDispatcher } from '../core/event-dispatcher';
import { WrappingType, EncodingType, FormatType, FilterType, MappingType, TexelType } from '../constants';
import { _Math } from '../maths/math';
import { Vector2 } from '../maths/vector2';
import { Matrix3 } from '../maths/matrix3';

let textureId = 0;

export type ImageType = {
  width: number;
  height: number;
  data?: ArrayLike<number>;
  depth?: number;
};

export class Texture extends EventDispatcher {
  static DEFAULT_IMAGE = undefined;
  static DEFAULT_MAPPING = MappingType.UVMapping;

  public isTexture = true;
  public id: number;
  public version: number;
  public uuid: string;
  public name: string;
  public image?: HTMLImageElement | HTMLCanvasElement | null | ImageType | HTMLVideoElement;
  public mipmaps: Texture[];
  public mapping: MappingType;
  public wrapS: WrappingType;
  public wrapT: WrappingType;
  public magFilter: FilterType;
  public minFilter: FilterType;
  public anisotropy: number;
  public format: FormatType;
  public type: TexelType;
  public offset: Vector2;
  public repeat: Vector2;
  public center: Vector2;
  public rotation: number;
  public matrixAutoUpdate: boolean;
  public matrix: Matrix3;
  public generateMipmaps: boolean;
  public premultiplyAlpha: boolean;
  public flipY: boolean;
  public unpackAlignment = 4; // valid values: 1, 2, 4, 8 (see http://www.khronos.org/opengles/sdk/docs/man/xhtml/glPixelStorei.xml)

  // Values of encoding !== THREE.LinearEncoding only supported on map, envMap and emissiveMap.
  //
  // Also changing the encoding after already used by a Material will not automatically make the Material
  // update.  You need to explicitly call Material.needsUpdate to trigger it to recompile.
  public encoding: EncodingType;

  public onUpdate: null;

  constructor(
    image?: HTMLImageElement | HTMLCanvasElement | null | HTMLVideoElement,
    mapping?: MappingType,
    wrapS?: WrappingType,
    wrapT?: WrappingType,
    magFilter?: FilterType,
    minFilter?: FilterType,
    format?: FormatType,
    type?: TexelType,
    anisotropy?: number,
    encoding?: EncodingType
  ) {
    super();
    this.id = textureId++;

    this.uuid = _Math.generateUUID();

    this.name = '';

    this.image = image !== undefined ? image : Texture.DEFAULT_IMAGE;
    this.mipmaps = [];

    this.mapping = mapping !== undefined ? mapping : Texture.DEFAULT_MAPPING;

    this.wrapS = wrapS !== undefined ? wrapS : WrappingType.ClampToEdgeWrapping;
    this.wrapT = wrapT !== undefined ? wrapT : WrappingType.ClampToEdgeWrapping;

    this.magFilter = magFilter !== undefined ? magFilter : FilterType.LinearFilter;
    this.minFilter = minFilter !== undefined ? minFilter : FilterType.LinearMipMapLinearFilter;

    this.anisotropy = anisotropy !== undefined ? anisotropy : 1;

    this.format = format !== undefined ? format : FormatType.RGBAFormat;
    this.type = type !== undefined ? type : TexelType.UnsignedByteType;

    this.offset = new Vector2(0, 0);
    this.repeat = new Vector2(1, 1);
    this.center = new Vector2(0, 0);
    this.rotation = 0;

    this.matrixAutoUpdate = true;
    this.matrix = new Matrix3();

    this.generateMipmaps = true;
    this.premultiplyAlpha = false;
    this.flipY = true;
    this.unpackAlignment = 4; // valid values: 1, 2, 4, 8 (see http://www.khronos.org/opengles/sdk/docs/man/xhtml/glPixelStorei.xml)

    // Values of encoding !== THREE.LinearEncoding only supported on map, envMap and emissiveMap.
    //
    // Also changing the encoding after already used by a Material will not automatically make the Material
    // update.  You need to explicitly call Material.needsUpdate to trigger it to recompile.
    this.encoding = encoding !== undefined ? encoding : EncodingType.LinearEncoding;

    this.version = 0;
    this.onUpdate = null;
  }

  updateMatrix() {
    this.matrix.setUvTransform(
      this.offset.x,
      this.offset.y,
      this.repeat.x,
      this.repeat.y,
      this.rotation,
      this.center.x,
      this.center.y
    );
  }

  clone(soure?: Texture) {
    return (soure || new Texture()).copy(this);
  }

  copy(source: Texture): Texture {
    this.name = source.name;

    this.image = source.image;
    this.mipmaps = source.mipmaps.slice(0);

    this.mapping = source.mapping;

    this.wrapS = source.wrapS;
    this.wrapT = source.wrapT;

    this.magFilter = source.magFilter;
    this.minFilter = source.minFilter;

    this.anisotropy = source.anisotropy;

    this.format = source.format;
    this.type = source.type;

    this.offset.copy(source.offset);
    this.repeat.copy(source.repeat);
    this.center.copy(source.center);
    this.rotation = source.rotation;

    this.matrixAutoUpdate = source.matrixAutoUpdate;
    this.matrix.copy(source.matrix);

    this.generateMipmaps = source.generateMipmaps;
    this.premultiplyAlpha = source.premultiplyAlpha;
    this.flipY = source.flipY;
    this.unpackAlignment = source.unpackAlignment;
    this.encoding = source.encoding;

    return this;
  }

  dispose() {
    this.dispatchEvent({ type: 'dispose' });
  }

  transformUv(uv: Vector2) {
    if (this.mapping !== MappingType.UVMapping) return uv;

    uv.applyMatrix3(this.matrix);

    if (uv.x < 0 || uv.x > 1) {
      switch (this.wrapS) {
        case WrappingType.RepeatWrapping:
          uv.x = uv.x - Math.floor(uv.x);
          break;

        case WrappingType.ClampToEdgeWrapping:
          uv.x = uv.x < 0 ? 0 : 1;
          break;

        case WrappingType.MirroredRepeatWrapping:
          if (Math.abs(Math.floor(uv.x) % 2) === 1) {
            uv.x = Math.ceil(uv.x) - uv.x;
          } else {
            uv.x = uv.x - Math.floor(uv.x);
          }
          break;
      }
    }

    if (uv.y < 0 || uv.y > 1) {
      switch (this.wrapT) {
        case WrappingType.RepeatWrapping:
          uv.y = uv.y - Math.floor(uv.y);
          break;

        case WrappingType.ClampToEdgeWrapping:
          uv.y = uv.y < 0 ? 0 : 1;
          break;

        case WrappingType.MirroredRepeatWrapping:
          if (Math.abs(Math.floor(uv.y) % 2) === 1) {
            uv.y = Math.ceil(uv.y) - uv.y;
          } else {
            uv.y = uv.y - Math.floor(uv.y);
          }
          break;
      }
    }

    if (this.flipY) {
      uv.y = 1 - uv.y;
    }

    return uv;
  }

  set needsUpdate(value: boolean) {
    if (value === true) this.version++;
  }
}
