export class Uniform {
  public value: number;

  constructor(value: number) {
    this.value = value;
  }

  clone() {
    return new Uniform(this.value.clone === undefined ? this.value : this.value.clone());
  }
}
