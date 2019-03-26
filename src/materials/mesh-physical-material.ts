import { MeshStandardMaterial } from './mesh-standard-material';

type K = keyof MeshPhysicalMaterial;

export class MeshPhysicalMaterial extends MeshStandardMaterial {
  public type = 'MeshPhysicalMaterial';
  public isMeshPhysicalMaterial = true;

  public defines: any;
  public reflectivity: number;
  public clearCoat: number;
  public clearCoatRoughness: number;

  constructor(parameters?: Partial<{ [key in K]: MeshPhysicalMaterial[K] }>) {
    super();

    this.defines = { PHYSICAL: '' };
    this.reflectivity = 0.5;
    this.clearCoat = 0.0;
    this.clearCoatRoughness = 0.0;
    this.setValues(parameters);
  }

  clone(source?: MeshPhysicalMaterial) {
    return (source || new MeshPhysicalMaterial()).copy(this);
  }

  copy(source: MeshPhysicalMaterial) {
    super.copy(source);

    this.defines = { PHYSICAL: '' };

    this.reflectivity = source.reflectivity;

    this.clearCoat = source.clearCoat;
    this.clearCoatRoughness = source.clearCoatRoughness;

    return this;
  }
}
