import { ShaderMaterial } from './shader-material';

type K = keyof RawShaderMaterial;

export class RawShaderMaterial extends ShaderMaterial {
  public isRawShaderMaterial = true;
  public type = 'RawShaderMaterial';

  constructor(parameters?: Partial<{ [key in K]: RawShaderMaterial[K] }>) {
    super(parameters);
  }
}
