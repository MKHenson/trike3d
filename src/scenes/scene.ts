import { Object3D } from '../core/object-3d';
import { Material } from '../materials/material';
import { Fog } from './fog';
import { Color } from '../maths/color';

export class Scene extends Object3D {
  public type = 'Scene';
  public isScene = true;
  public background: Color | null;
  public fog: Fog | null;
  public overrideMaterial: Material | null;
  public autoUpdate: boolean;

  constructor() {
    super();
    this.background = null;
    this.fog = null;
    this.overrideMaterial = null;
    this.autoUpdate = true;
  }

  copy(source: Scene, recursive: boolean) {
    super.copy(source, recursive);

    if (source.background !== null) this.background = source.background.clone();
    if (source.fog !== null) this.fog = source.fog.clone();
    if (source.overrideMaterial !== null) this.overrideMaterial = source.overrideMaterial.clone();

    this.autoUpdate = source.autoUpdate;
    this.matrixAutoUpdate = source.matrixAutoUpdate;

    return this;
  }

  dispose() {
    this.dispatchEvent({ type: 'dispose' });
  }
}
