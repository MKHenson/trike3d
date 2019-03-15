import { Color } from '../maths/color';
import { Vector3 } from '../maths/vector3';

export class Face3 {
  public a: Vector3;
  public b: Vector3;
  public c: Vector3;
  public normal: Vector3;
  public color: Color;
  public materialIndex: number;
  public vertexNormals: Vector3[];
  public vertexColors: Color[];

  constructor(a?: Vector3, b?: Vector3, c?: Vector3, normal?: Vector3, color?: Color, materialIndex?: number) {
    this.a = a || new Vector3();
    this.b = b || new Vector3();
    this.c = c || new Vector3();

    this.normal = normal || new Vector3();
    this.vertexNormals = Array.isArray(normal) ? normal : [];

    this.color = color && color.isColor ? color : new Color();
    this.vertexColors = Array.isArray(color) ? color : [];

    this.materialIndex = materialIndex !== undefined ? materialIndex : 0;
  }

  clone() {
    return new Face3().copy(this);
  }

  copy(source: Face3) {
    this.a = source.a;
    this.b = source.b;
    this.c = source.c;

    this.normal.copy(source.normal);
    this.color.copy(source.color);

    this.materialIndex = source.materialIndex;

    for (var i = 0, il = source.vertexNormals.length; i < il; i++) {
      this.vertexNormals[i] = source.vertexNormals[i].clone();
    }

    for (var i = 0, il = source.vertexColors.length; i < il; i++) {
      this.vertexColors[i] = source.vertexColors[i].clone();
    }

    return this;
  }
}
