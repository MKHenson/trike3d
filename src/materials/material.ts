import { EventDispatcher } from '../core/event-dispatcher';
import {
  ColorSource,
  FrontSide,
  BlendMode,
  LessEqualDepth,
  AddEquation,
  OneMinusSrcAlphaFactor,
  SrcAlphaFactor
} from '../constants';
import { _Math } from '../maths/math';
import { Color } from '../maths/color';
import { Vector3 } from '../maths/vector3';
import { Plane } from '../maths/plane';

let materialId = 0;

export class Material extends EventDispatcher {
  public id: number;
  public uuid: string;
  public isMaterial = true;
  public name: string;
  public type = 'Material';

  public fog: boolean;
  public lights: boolean;

  public blending: BlendMode;
  public side = FrontSide;
  public flatShading: boolean;
  public vertexTangents: boolean;
  public vertexColors: ColorSource;
  public opacity: number;
  public transparent: boolean;
  public blendSrc = SrcAlphaFactor;
  public blendDst = OneMinusSrcAlphaFactor;
  public blendEquation = AddEquation;
  public blendSrcAlpha: null;
  public blendDstAlpha: null;
  public blendEquationAlpha: null;
  public depthFunc = LessEqualDepth;
  public depthTest: boolean;
  public depthWrite: boolean;
  public clippingPlanes: Plane[] | null;
  public clipIntersection: boolean;
  public clipShadows: boolean;
  public shadowSide = null;
  public colorWrite: boolean;
  public precision: boolean | null; // override the renderer's default precision for this material
  public polygonOffset: boolean;
  public polygonOffsetFactor: number;
  public polygonOffsetUnits: number;
  public dithering: boolean;
  public alphaTest: number;
  public premultipliedAlpha: boolean;
  public visible: boolean;
  public userData: any;
  public needsUpdate: boolean;

  constructor() {
    super();

    this.id = materialId++;
    this.uuid = _Math.generateUUID();
    this.name = '';
    this.type = 'Material';
    this.fog = true;
    this.lights = true;
    this.blending = BlendMode.NormalBlending;
    this.side = FrontSide;
    this.flatShading = false;
    this.vertexTangents = false;
    this.vertexColors = ColorSource.NoColors;
    this.opacity = 1;
    this.transparent = false;
    this.blendSrc = SrcAlphaFactor;
    this.blendDst = OneMinusSrcAlphaFactor;
    this.blendEquation = AddEquation;
    this.blendSrcAlpha = null;
    this.blendDstAlpha = null;
    this.blendEquationAlpha = null;
    this.depthFunc = LessEqualDepth;
    this.depthTest = true;
    this.depthWrite = true;
    this.clippingPlanes = null;
    this.clipIntersection = false;
    this.clipShadows = false;
    this.shadowSide = null;
    this.colorWrite = true;
    this.precision = null; // override the renderer's default precision for this material
    this.polygonOffset = false;
    this.polygonOffsetFactor = 0;
    this.polygonOffsetUnits = 0;
    this.dithering = false;
    this.alphaTest = 0;
    this.premultipliedAlpha = false;
    this.visible = true;
    this.userData = {};
    this.needsUpdate = true;
  }

  onBeforeCompile() {}

  setValues<K extends keyof Material>(values?: Partial<{ [key in K]: Material[K] }>) {
    if (values === undefined) return;

    for (var key in values) {
      var newValue = values[key];

      if (newValue === undefined) {
        console.warn("THREE.Material: '" + key + "' parameter is undefined.");
        continue;
      }

      var currentValue = this[key];

      if (currentValue === undefined) {
        console.warn('THREE.' + this.type + ": '" + key + "' is not a property of this material.");
        continue;
      }

      if (currentValue && (currentValue as Color).isColor) {
        currentValue.set(newValue);
      } else if (currentValue && (currentValue as Vector3).isVector3 && (newValue && (newValue as Vector3).isVector3)) {
        currentValue.copy(newValue);
      } else {
        (this as any)[key] = newValue;
      }
    }
  }

  clone(source?: Material) {
    return (source || new Material()).copy(this);
  }

  copy(source: Material) {
    this.name = source.name;

    this.fog = source.fog;
    this.lights = source.lights;

    this.blending = source.blending;
    this.side = source.side;
    this.flatShading = source.flatShading;
    this.vertexColors = source.vertexColors;

    this.opacity = source.opacity;
    this.transparent = source.transparent;

    this.blendSrc = source.blendSrc;
    this.blendDst = source.blendDst;
    this.blendEquation = source.blendEquation;
    this.blendSrcAlpha = source.blendSrcAlpha;
    this.blendDstAlpha = source.blendDstAlpha;
    this.blendEquationAlpha = source.blendEquationAlpha;

    this.depthFunc = source.depthFunc;
    this.depthTest = source.depthTest;
    this.depthWrite = source.depthWrite;

    this.colorWrite = source.colorWrite;

    this.precision = source.precision;

    this.polygonOffset = source.polygonOffset;
    this.polygonOffsetFactor = source.polygonOffsetFactor;
    this.polygonOffsetUnits = source.polygonOffsetUnits;

    this.dithering = source.dithering;

    this.alphaTest = source.alphaTest;
    this.premultipliedAlpha = source.premultipliedAlpha;

    this.visible = source.visible;
    this.userData = JSON.parse(JSON.stringify(source.userData));

    this.clipShadows = source.clipShadows;
    this.clipIntersection = source.clipIntersection;

    var srcPlanes = source.clippingPlanes,
      dstPlanes = null;

    if (srcPlanes !== null) {
      var n = srcPlanes.length;
      dstPlanes = new Array(n);

      for (var i = 0; i !== n; ++i) dstPlanes[i] = srcPlanes[i].clone();
    }

    this.clippingPlanes = dstPlanes;
    this.shadowSide = source.shadowSide;
    return this;
  }

  dispose() {
    this.dispatchEvent({ type: 'dispose' });
  }
}
