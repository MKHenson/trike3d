import { Material } from './material';
import { cloneUniforms } from '../renderers/shaders/uniforms-utils';
import default_vertex from '../renderers/shaders/ShaderChunk/default_vertex.glsl.ts';
import default_fragment from '../renderers/shaders/ShaderChunk/default_fragment.glsl.ts';

type K = keyof ShaderMaterial;

export class ShaderMaterial extends Material {
  public isShaderMaterial = true;
  public type = 'ShaderMaterial';

  public defines: any;
  public uniforms: any;

  public vertexShader: string;
  public fragmentShader: string;

  public linewidth: number;

  public wireframe: boolean;
  public wireframeLinewidth: number;

  public fog: boolean;
  public lights: boolean;
  public clipping: boolean;

  public skinning: boolean;
  public morphTargets: boolean;
  public morphNormals: boolean;

  public extensions: {
    derivatives: boolean;
    fragDepth: boolean;
    drawBuffers: boolean;
    shaderTextureLOD: boolean;
  };

  // When rendered geometry doesn't include these attributes but the material does,
  // use these default values in WebGL. This avoids errors when buffer data is missing.
  public defaultAttributeValues: {
    color: number[];
    uv: number[];
    uv2: number[];
  };

  public index0AttributeName = undefined;
  public uniformsNeedUpdate = false;

  constructor(parameters?: Partial<{ [key in K]: ShaderMaterial[K] }>) {
    super();

    this.defines = {};
    this.uniforms = {};

    this.vertexShader = default_vertex;
    this.fragmentShader = default_fragment;

    this.linewidth = 1;

    this.wireframe = false;
    this.wireframeLinewidth = 1;

    this.fog = false; // set to use scene fog
    this.lights = false; // set to use scene lights
    this.clipping = false; // set to use user-defined clipping planes

    this.skinning = false; // set to use skinning attribute streams
    this.morphTargets = false; // set to use morph targets
    this.morphNormals = false; // set to use morph normals

    this.extensions = {
      derivatives: false, // set to use derivatives
      fragDepth: false, // set to use fragment depth values
      drawBuffers: false, // set to use draw buffers
      shaderTextureLOD: false // set to use shader texture LOD
    };

    // When rendered geometry doesn't include these attributes but the material does,
    // use these default values in WebGL. This avoids errors when buffer data is missing.
    this.defaultAttributeValues = {
      color: [1, 1, 1],
      uv: [0, 0],
      uv2: [0, 0]
    };

    this.index0AttributeName = undefined;
    this.uniformsNeedUpdate = false;

    if (parameters !== undefined) {
      this.setValues(parameters);
    }
  }

  clone(source?: ShaderMaterial) {
    return (source || new ShaderMaterial()).copy(this);
  }

  copy(source: ShaderMaterial) {
    super.copy(source);
    this.fragmentShader = source.fragmentShader;
    this.vertexShader = source.vertexShader;
    this.uniforms = cloneUniforms(source.uniforms);
    this.defines = Object.assign({}, source.defines);
    this.wireframe = source.wireframe;
    this.wireframeLinewidth = source.wireframeLinewidth;
    this.lights = source.lights;
    this.clipping = source.clipping;
    this.skinning = source.skinning;
    this.morphTargets = source.morphTargets;
    this.morphNormals = source.morphNormals;
    this.extensions = source.extensions;

    return this;
  }
}
