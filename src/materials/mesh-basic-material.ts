import { Material } from './material';
import { OperationType } from '../constants';
import { Color } from '../maths/color';
import { LineEdge } from './line-basic-material';

type K = keyof MeshBasicMaterial;

export class MeshBasicMaterial extends Material {
  public isMeshBasicMaterial = true;
  public type = 'MeshBasicMaterial';

  public color: Color;
  public map: null;
  public lightMap: null;
  public lightMapIntensity: number;
  public aoMap = null;
  public aoMapIntensity: number;
  public specularMap = null;
  public alphaMap = null;
  public envMap = null;
  public combine: OperationType;
  public reflectivity: number;
  public refractionRatio: number;
  public wireframe: boolean;
  public wireframeLinewidth: number;
  public wireframeLinecap: LineEdge;
  public wireframeLinejoin: LineEdge;
  public skinning: boolean;
  public morphTargets: boolean;
  public lights: boolean;

  constructor(parameters?: Partial<{ [key in K]: MeshBasicMaterial[K] }>) {
    super();

    this.color = new Color(0xffffff); // emissive
    this.map = null;
    this.lightMap = null;
    this.lightMapIntensity = 1.0;
    this.aoMap = null;
    this.aoMapIntensity = 1.0;
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
    this.lights = false;

    this.setValues(parameters);
  }

  clone(source?: MeshBasicMaterial) {
    return (source || new MeshBasicMaterial()).copy(this);
  }

  copy(source: MeshBasicMaterial) {
    super.copy(source);

    this.color.copy(source.color);
    this.map = source.map;
    this.lightMap = source.lightMap;
    this.lightMapIntensity = source.lightMapIntensity;
    this.aoMap = source.aoMap;
    this.aoMapIntensity = source.aoMapIntensity;
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

    return this;
  }
}
