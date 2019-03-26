import { Material } from './material';
import { Color } from '../maths/color';

type K = keyof ShadowMaterial;

export class ShadowMaterial extends Material {
  public isShadowMaterial = true;
  public type = 'ShadowMaterial';

  public color: Color;
  public transparent: boolean;

  constructor(parameters?: Partial<{ [key in K]: ShadowMaterial[K] }>) {
    super();
    this.type = 'ShadowMaterial';
    this.color = new Color(0x000000);
    this.transparent = true;

    this.setValues(parameters);
  }

  clone(source?: ShadowMaterial) {
    return (source || new ShadowMaterial()).copy(this);
  }

  copy(source: ShadowMaterial) {
    super.copy(source);
    this.color.copy(source.color);
    return this;
  }
}
