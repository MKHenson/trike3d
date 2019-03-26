import { MeshPhongMaterial } from './mesh-phong-material';

type K = keyof MeshToonMaterial;

export class MeshToonMaterial extends MeshPhongMaterial {
  public isMeshToonMaterial = true;
  public defines: { TOON: string };
  public type = 'MeshToonMaterial';
  public gradientMap: null;

  constructor(parameters?: Partial<{ [key in K]: MeshToonMaterial[K] }>) {
    super();

    this.defines = { TOON: '' };
    this.gradientMap = null;
    this.setValues(parameters);
  }

  clone(source?: MeshToonMaterial) {
    return (source || new MeshToonMaterial()).copy(this);
  }

  copy(source: MeshToonMaterial) {
    super.copy(source);

    this.gradientMap = source.gradientMap;

    return this;
  }
}
