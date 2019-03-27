import { Color } from '../maths/color';

export class Fog {
  public isFog = true;
  public name: string;

  public color: Color;

  public near: number;
  public far: number;

  constructor(color: Color, near: number, far: number) {
    this.name = '';
    this.color = new Color().set(color);
    this.near = near !== undefined ? near : 1;
    this.far = far !== undefined ? far : 1000;
  }

  clone() {
    return new Fog(this.color, this.near, this.far);
  }
}
