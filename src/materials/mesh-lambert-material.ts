import { Material } from './material';
import { OperationType } from '../constants';
import { Color } from '../maths/color';
import { LineEdge } from './line-basic-material';
import { Texture } from '../textures/texture';

type K = keyof MeshLambertMaterial;

export class MeshLambertMaterial extends Material {
  public type = 'MeshLambertMaterial';
  public isMeshLambertMaterial = true;
  public color: Color;
  public map: Texture | null;
  public lightMap: Texture | null;
  public lightMapIntensity: number;
  public aoMap: Texture | null;
  public aoMapIntensity: number;
  public emissive: Color;
  public emissiveIntensity: number;
  public emissiveMap: Texture | null;
  public specularMap: Texture | null;
  public alphaMap: Texture | null;
  public envMap: Texture | null;
  public combine: OperationType;
  public reflectivity: number;
  public refractionRatio: number;
  public wireframe: boolean;
  public wireframeLinewidth = 1;
  public wireframeLinecap: LineEdge;
  public wireframeLinejoin: LineEdge;
  public skinning: boolean;
  public morphTargets: boolean;
  public morphNormals: boolean;

  constructor(parameters?: Partial<{ [key in K]: MeshLambertMaterial[K] }>) {
    super();

    this.color = new Color(0xffffff);
    this.map = null;
    this.lightMap = null;
    this.lightMapIntensity = 1.0;
    this.aoMap = null;
    this.aoMapIntensity = 1.0;
    this.emissive = new Color(0x000000);
    this.emissiveIntensity = 1.0;
    this.emissiveMap = null;
    this.specularMap = null;
    this.alphaMap = null;
    this.envMap = null;
    this.combine = OperationType.MultiplyOperation;
    this.reflectivity = 1;
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

  clone(source?: MeshLambertMaterial) {
    return (source || new MeshLambertMaterial()).copy(this);
  }

  copy(source: MeshLambertMaterial) {
    super.copy(source);

    this.color.copy(source.color);
    this.map = source.map;
    this.lightMap = source.lightMap;
    this.lightMapIntensity = source.lightMapIntensity;
    this.aoMap = source.aoMap;
    this.aoMapIntensity = source.aoMapIntensity;
    this.emissive.copy(source.emissive);
    this.emissiveMap = source.emissiveMap;
    this.emissiveIntensity = source.emissiveIntensity;
    this.specularMap = source.specularMap;
    this.alphaMap = source.alphaMap;
    this.envMap = source.envMap;
    this.combine = source.combine;
    this.reflectivity = source.reflectivity;
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
