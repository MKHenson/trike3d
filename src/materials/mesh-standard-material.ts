import { NormalSpaceType } from '../constants';
import { Material } from './material';
import { Vector2 } from '../maths/vector2';
import { Color } from '../maths/color';

type K = keyof MeshStandardMaterial;

export class MeshStandardMaterial extends Material {
  public isMeshStandardMaterial = true;
  public type = 'MeshStandardMaterial';

  public defines: any;
  public color: Color;
  public roughness: number;
  public metalness: number;
  public map: null;
  public lightMap: null;
  public lightMapIntensity: number;
  public aoMap: null;
  public aoMapIntensity: number;
  public emissive: Color;
  public emissiveIntensity: number;
  public emissiveMap: null;
  public bumpMap: null;
  public bumpScale: number;
  public normalMap: null;
  public normalMapType: NormalSpaceType;
  public normalScale: Vector2;
  public displacementMap: null;
  public displacementScale: number;
  public displacementBias: number;
  public roughnessMap: null;
  public metalnessMap: null;
  public alphaMap = null;
  public envMap = null;
  public envMapIntensity: number;
  public refractionRatio: number;
  public wireframe: boolean;
  public wireframeLinewidth: number;
  public wireframeLinecap: 'round';
  public wireframeLinejoin: 'round';
  public skinning: boolean;
  public morphTargets: boolean;
  public morphNormals: boolean;

  constructor(parameters?: Partial<{ [key in K]: MeshStandardMaterial[K] }>) {
    super();

    this.defines = { STANDARD: '' };
    this.color = new Color(0xffffff);
    this.roughness = 0.5;
    this.metalness = 0.5;
    this.map = null;
    this.lightMap = null;
    this.lightMapIntensity = 1.0;
    this.aoMap = null;
    this.aoMapIntensity = 1.0;
    this.emissive = new Color(0x000000);
    this.emissiveIntensity = 1.0;
    this.emissiveMap = null;
    this.bumpMap = null;
    this.bumpScale = 1;
    this.normalMap = null;
    this.normalMapType = NormalSpaceType.TangentSpaceNormalMap;
    this.normalScale = new Vector2(1, 1);
    this.displacementMap = null;
    this.displacementScale = 1;
    this.displacementBias = 0;
    this.roughnessMap = null;
    this.metalnessMap = null;
    this.alphaMap = null;
    this.envMap = null;
    this.envMapIntensity = 1.0;
    this.refractionRatio = 0.98;
    this.wireframe = false;
    this.wireframeLinewidth = 1;
    this.wireframeLinecap = 'round';
    this.wireframeLinejoin = 'round';
    this.skinning = false;
    this.morphTargets = false;
    this.morphNormals = false;
    this.setValues(parameters);
  }

  clone(source?: MeshStandardMaterial) {
    return (source || new MeshStandardMaterial()).copy(this);
  }

  copy(source: MeshStandardMaterial) {
    super.copy(source);
    this.defines = { STANDARD: '' };
    this.color.copy(source.color);
    this.roughness = source.roughness;
    this.metalness = source.metalness;
    this.map = source.map;
    this.lightMap = source.lightMap;
    this.lightMapIntensity = source.lightMapIntensity;
    this.aoMap = source.aoMap;
    this.aoMapIntensity = source.aoMapIntensity;
    this.emissive.copy(source.emissive);
    this.emissiveMap = source.emissiveMap;
    this.emissiveIntensity = source.emissiveIntensity;
    this.bumpMap = source.bumpMap;
    this.bumpScale = source.bumpScale;
    this.normalMap = source.normalMap;
    this.normalMapType = source.normalMapType;
    this.normalScale.copy(source.normalScale);
    this.displacementMap = source.displacementMap;
    this.displacementScale = source.displacementScale;
    this.displacementBias = source.displacementBias;
    this.roughnessMap = source.roughnessMap;
    this.metalnessMap = source.metalnessMap;
    this.alphaMap = source.alphaMap;
    this.envMap = source.envMap;
    this.envMapIntensity = source.envMapIntensity;
    this.refractionRatio = source.refractionRatio;
    this.wireframe = source.wireframe;
    this.wireframeLinewidth = source.wireframeLinewidth;
    this.wireframeLinecap = source.wireframeLinecap;
    this.wireframeLinejoin = source.wireframeLinejoin;
    this.skinning = source.skinning;
    this.morphTargets = source.morphTargets;
    this.morphNormals = source.morphNormals;

    return this;
  }
}
