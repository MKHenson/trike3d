import { Color } from '../maths/color';

export class FogExp {
  public isFogExp2 = true;
  public name: string;
  public color: Color;
  public density: number;

  constructor(color: Color, density: number) {
    this.name = '';
    this.color = new Color().set(color);
    this.density = density !== undefined ? density : 0.00025;
  }

  clone() {
    return new FogExp(this.color, this.density);
  }
}
