import { LineBasicMaterial } from './line-basic-material';
import { Material } from './material';

type K = keyof LineBasicMaterial;

export class LineDashedMaterial extends LineBasicMaterial {
  public type = 'LineDashedMaterial';
  public isLineDashedMaterial = true;

  public scale: number;
  public dashSize: number;
  public gapSize: number;

  constructor(parameters?: Partial<{ [key in K]: LineBasicMaterial[K] }>) {
    super();

    this.scale = 1;
    this.dashSize = 3;
    this.gapSize = 1;

    this.setValues(parameters);
  }

  clone(source?: LineDashedMaterial): Material {
    return super.clone(source || new LineDashedMaterial());
  }

  copy(source: LineDashedMaterial) {
    super.copy(source);

    this.scale = source.scale;
    this.dashSize = source.dashSize;
    this.gapSize = source.gapSize;

    return this;
  }
}
