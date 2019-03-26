import { NormalSpaceType } from '../constants';
import { Material } from './material';
import { Vector2 } from '../maths/vector2';
import { Texture } from '../textures/texture';

type K = keyof MeshNormalMaterial;

export class MeshNormalMaterial extends Material {
  public isMeshNormalMaterial = true;
  public type = 'MeshNormalMaterial';

  public bumpMap: Texture | null;
  public bumpScale: number;
  public normalMap: Texture | null;
  public normalMapType: NormalSpaceType;
  public normalScale: Vector2;
  public displacementMap: Texture | null;
  public displacementScale: number;
  public displacementBias: number;
  public wireframe: boolean;
  public wireframeLinewidth: number;
  public fog: boolean;
  public lights: boolean;
  public skinning: boolean;
  public morphTargets: boolean;
  public morphNormals: boolean;

  constructor(parameters?: Partial<{ [key in K]: MeshNormalMaterial[K] }>) {
    super();

    this.bumpMap = null;
    this.bumpScale = 1;
    this.normalMap = null;
    this.normalMapType = NormalSpaceType.TangentSpaceNormalMap;
    this.normalScale = new Vector2(1, 1);
    this.displacementMap = null;
    this.displacementScale = 1;
    this.displacementBias = 0;
    this.wireframe = false;
    this.wireframeLinewidth = 1;
    this.fog = false;
    this.lights = false;
    this.skinning = false;
    this.morphTargets = false;
    this.morphNormals = false;

    this.setValues(parameters);
  }

  clone(source?: MeshNormalMaterial) {
    return (source || new MeshNormalMaterial()).copy(this);
  }

  copy(source: MeshNormalMaterial) {
    super.copy(source);
    this.bumpMap = source.bumpMap;
    this.bumpScale = source.bumpScale;
    this.normalMap = source.normalMap;
    this.normalMapType = source.normalMapType;
    this.normalScale.copy(source.normalScale);
    this.displacementMap = source.displacementMap;
    this.displacementScale = source.displacementScale;
    this.displacementBias = source.displacementBias;
    this.wireframe = source.wireframe;
    this.wireframeLinewidth = source.wireframeLinewidth;
    this.skinning = source.skinning;
    this.morphTargets = source.morphTargets;
    this.morphNormals = source.morphNormals;

    return this;
  }
}
