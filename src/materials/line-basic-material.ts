import { Material } from './material.js';
import { Color } from '../maths/color.js';

export type LineEdge = 'round';

type K = keyof LineBasicMaterial;

export class LineBasicMaterial extends Material {
  isLineBasicMaterial = true;
  type = 'LineBasicMaterial';

  public color: Color;

  public linewidth = 1;
  public linecap: LineEdge;
  public linejoin: LineEdge;

  constructor(parameters?: Partial<{ [key in K]: LineBasicMaterial[K] }>) {
    super();
    Material.call(this);

    this.color = new Color(0xffffff);

    this.linewidth = 1;
    this.linecap = 'round';
    this.linejoin = 'round';

    this.lights = false;

    this.setValues(parameters);
  }

  clone(source?: LineBasicMaterial): Material {
    return super.clone(source || new LineBasicMaterial());
  }

  copy(source: LineBasicMaterial) {
    super.copy(source);

    this.color.copy(source.color);

    this.linewidth = source.linewidth;
    this.linecap = source.linecap;
    this.linejoin = source.linejoin;

    return this;
  }
}
