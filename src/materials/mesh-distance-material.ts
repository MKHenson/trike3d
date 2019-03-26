import { Material } from './material';
import { Vector3 } from '../maths/vector3';
import { Texture } from '../textures/texture';

type K = keyof MeshDistanceMaterial;

export class MeshDistanceMaterial extends Material {
  public type = 'MeshDistanceMaterial';
  public isMeshDistanceMaterial = true;

  public referencePosition: Vector3;
  public nearDistance: number;
  public farDistance: number;
  public skinning: false;
  public morphTargets: false;
  public map: Texture | null;
  public alphaMap: Texture | null;
  public displacementMap: Texture | null;
  public displacementScale: number;
  public displacementBias: number;

  constructor(parameters?: Partial<{ [key in K]: MeshDistanceMaterial[K] }>) {
    super();

    this.referencePosition = new Vector3();
    this.nearDistance = 1;
    this.farDistance = 1000;
    this.skinning = false;
    this.morphTargets = false;
    this.map = null;
    this.alphaMap = null;
    this.displacementMap = null;
    this.displacementScale = 1;
    this.displacementBias = 0;
    this.fog = false;
    this.lights = false;

    this.setValues(parameters);
  }

  clone(source?: MeshDistanceMaterial) {
    return (source || new MeshDistanceMaterial()).copy(this);
  }

  copy(source: MeshDistanceMaterial) {
    super.copy(source);
    this.referencePosition.copy(source.referencePosition);
    this.nearDistance = source.nearDistance;
    this.farDistance = source.farDistance;
    this.skinning = source.skinning;
    this.morphTargets = source.morphTargets;
    this.map = source.map;
    this.alphaMap = source.alphaMap;
    this.displacementMap = source.displacementMap;
    this.displacementScale = source.displacementScale;
    this.displacementBias = source.displacementBias;

    return this;
  }
}
