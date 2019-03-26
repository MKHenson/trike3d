import { NormalSpaceType } from '../constants';
import { Material } from './material';
import { Vector2 } from '../maths/vector2';
import { Color } from '../maths/color';

type K = keyof MeshMatcapMaterial;

export class MeshMatcapMaterial extends Material {
  public isMeshMatcapMaterial = true;
  public type = 'MeshMatcapMaterial';

  public defines: any;
  public color: Color;
  public matcap: null;
  public map: null;
  public bumpMap: null;
  public bumpScale: number;
  public normalMap: null;
  public normalMapType: NormalSpaceType;
  public normalScale: Vector2;
  public displacementMap: null;
  public displacementScale: number;
  public displacementBias: number;
  public alphaMap: null;
  public skinning: boolean;
  public morphTargets: boolean;
  public morphNormals: boolean;

  constructor(parameters?: Partial<{ [key in K]: MeshMatcapMaterial[K] }>) {
    super();

    this.defines = { MATCAP: '' };
    this.color = new Color(0xffffff);
    this.matcap = null;
    this.map = null;
    this.bumpMap = null;
    this.bumpScale = 1;
    this.normalMap = null;
    this.normalMapType = NormalSpaceType.TangentSpaceNormalMap;
    this.normalScale = new Vector2(1, 1);
    this.displacementMap = null;
    this.displacementScale = 1;
    this.displacementBias = 0;
    this.alphaMap = null;
    this.skinning = false;
    this.morphTargets = false;
    this.morphNormals = false;
    this.lights = false;

    this.setValues(parameters);
  }

  clone(source?: MeshMatcapMaterial) {
    return (source || new MeshMatcapMaterial()).copy(this);
  }

  copy(source: MeshMatcapMaterial) {
    super.copy(source);
    this.defines = { MATCAP: '' };
    this.color.copy(source.color);
    this.matcap = source.matcap;
    this.map = source.map;
    this.bumpMap = source.bumpMap;
    this.bumpScale = source.bumpScale;
    this.normalMap = source.normalMap;
    this.normalMapType = source.normalMapType;
    this.normalScale.copy(source.normalScale);
    this.displacementMap = source.displacementMap;
    this.displacementScale = source.displacementScale;
    this.displacementBias = source.displacementBias;
    this.alphaMap = source.alphaMap;
    this.skinning = source.skinning;
    this.morphTargets = source.morphTargets;
    this.morphNormals = source.morphNormals;

    return this;
  }
}
