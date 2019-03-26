import { Material } from './material';
import { DepthPackingType } from '../constants';

type K = keyof MeshDepthMaterial;

export class MeshDepthMaterial extends Material {
  public isMeshDepthMaterial = true;
  public type = 'MeshDepthMaterial';
  public depthPacking: DepthPackingType;
  public skinning: boolean;
  public morphTargets: boolean;
  public map: null;
  public alphaMap: null;
  public displacementMap: null;
  public displacementScale: number;
  public displacementBias: number;
  public wireframe: boolean;
  public wireframeLinewidth: number;
  public fog: boolean;
  public lights: boolean;

  constructor(parameters?: Partial<{ [key in K]: MeshDepthMaterial[K] }>) {
    super();

    this.depthPacking = DepthPackingType.BasicDepthPacking;
    this.skinning = false;
    this.morphTargets = false;
    this.map = null;
    this.alphaMap = null;
    this.displacementMap = null;
    this.displacementScale = 1;
    this.displacementBias = 0;
    this.wireframe = false;
    this.wireframeLinewidth = 1;
    this.fog = false;
    this.lights = false;

    this.setValues(parameters);
  }

  clone(source?: MeshDepthMaterial) {
    return (source || new MeshDepthMaterial()).copy(this);
  }

  copy(source: MeshDepthMaterial) {
    super.copy(source);

    this.depthPacking = source.depthPacking;
    this.skinning = source.skinning;
    this.morphTargets = source.morphTargets;
    this.map = source.map;
    this.alphaMap = source.alphaMap;
    this.displacementMap = source.displacementMap;
    this.displacementScale = source.displacementScale;
    this.displacementBias = source.displacementBias;
    this.wireframe = source.wireframe;
    this.wireframeLinewidth = source.wireframeLinewidth;

    return this;
  }
}
