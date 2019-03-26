import { Color } from '../maths/color';
import { Vector3 } from '../maths/vector3';

export class Face3 {
  public _id: number;
  public a: number;
  public b: number;
  public c: number;
  public normal: Vector3;
  public color: Color;
  public materialIndex: number;
  public vertexNormals: Vector3[];
  public vertexColors: Color[];

  constructor(
    a?: number,
    b?: number,
    c?: number,
    normal?: Vector3 | Vector3[],
    color?: Color | Color[],
    materialIndex?: number
  ) {
    this.a = a || 0;
    this.b = b || 0;
    this.c = c || 0;

    this.normal = normal && (normal as Vector3).isVector3 ? (normal as Vector3) : new Vector3();
    this.vertexNormals = Array.isArray(normal) ? normal : [];

    this.color = color && (color as Color).isColor ? (color as Color) : new Color();
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
