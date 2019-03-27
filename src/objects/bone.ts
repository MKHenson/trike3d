import { Object3D } from '../core/object-3d';

export class Bone extends Object3D {
  public type = 'Bone';
  public isBone = true;
  constructor() {
    super();
  }
}
