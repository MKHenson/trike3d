import { PerspectiveCamera } from './perspective-camera';

export class ArrayCamera extends PerspectiveCamera {
  public isArrayCamera = true;
  public cameras: PerspectiveCamera[];

  constructor(array: PerspectiveCamera[] = []) {
    super();
    this.cameras = array;
  }
}
