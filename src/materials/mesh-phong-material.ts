import { OperationType, NormalSpaceType } from '../constants';
import { Material } from './material';
import { Vector2 } from '../maths/vector2';
import { Color } from '../maths/color';
import { LineEdge } from './line-basic-material';

type K = keyof MeshPhongMaterial;

export class MeshPhongMaterial extends Material {
  public type = 'MeshPhongMaterial';
  public isMeshPhongMaterial = true;
  public color: Color;
  public specular: Color;
  public shininess: number;
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
  public specularMap: null;
  public alphaMap: null;
  public envMap: null;
  public combine: OperationType;
  public reflectivity: number;
  public refractionRatio: number;
  public wireframe: boolean;
  public wireframeLinewidth: number;
  public wireframeLinecap: LineEdge;
  public wireframeLinejoin: LineEdge;
  public skinning: boolean;
  public morphTargets: boolean;
  public morphNormals: boolean;

  constructor(parameters?: Partial<{ [key in K]: MeshPhongMaterial[K] }>) {
    super();

    this.color = new Color(0xffffff); // diffuse
    this.specular = new Color(0x111111);
    this.shininess = 30;
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

  clone(source?: MeshPhongMaterial) {
    return (source || new MeshPhongMaterial()).copy(this);
  }

  copy(source: MeshPhongMaterial) {
    super.copy(source);
    this.color.copy(source.color);
    this.specular.copy(source.specular);
    this.shininess = source.shininess;
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
