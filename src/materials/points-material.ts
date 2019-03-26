import { Material } from './material';
import { Color } from '../maths/color';
import { Texture } from '../textures/texture';

type K = keyof PointsMaterial;

export class PointsMaterial extends Material {
  public isPointsMaterial = true;
  public type = 'PointsMaterial';
  public color: Color;
  public map: Texture | null;
  public size: number;
  public sizeAttenuation: boolean;
  public morphTargets: boolean;

  constructor(parameters?: Partial<{ [key in K]: PointsMaterial[K] }>) {
    super();

    this.color = new Color(0xffffff);
    this.map = null;
    this.size = 1;
    this.sizeAttenuation = true;
    this.morphTargets = false;
    this.lights = false;
    this.setValues(parameters);
  }

  clone(source?: PointsMaterial) {
    return (source || new PointsMaterial()).copy(this);
  }

  copy(source: PointsMaterial) {
    super.copy(source);
    this.color.copy(source.color);
    this.map = source.map;
    this.size = source.size;
    this.sizeAttenuation = source.sizeAttenuation;
    this.morphTargets = source.morphTargets;
    return this;
  }
}
