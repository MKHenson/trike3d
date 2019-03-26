import { Material } from './material';
import { Color } from '../maths/color';
import { Texture } from '../textures/texture';

type K = keyof SpriteMaterial;

export class SpriteMaterial extends Material {
  public type = 'SpriteMaterial';
  public isSpriteMaterial = true;
  public color: Color;
  public map: Texture | null;
  public rotation: number;
  public sizeAttenuation: boolean;
  public lights: boolean;
  public transparent: boolean;

  constructor(parameters?: Partial<{ [key in K]: SpriteMaterial[K] }>) {
    super();

    this.color = new Color(0xffffff);
    this.map = null;
    this.rotation = 0;
    this.sizeAttenuation = true;
    this.lights = false;
    this.transparent = true;
    this.setValues(parameters);
  }

  clone(source?: SpriteMaterial) {
    return (source || new SpriteMaterial()).copy(this);
  }

  copy(source: SpriteMaterial) {
    super.copy(source);
    this.color.copy(source.color);
    this.map = source.map;
    this.rotation = source.rotation;
    this.sizeAttenuation = source.sizeAttenuation;

    return this;
  }
}
