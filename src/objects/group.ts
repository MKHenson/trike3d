import { Object3D } from '../core/object-3d';

export class Group extends Object3D {
  public type = 'Group';
  public isGroup = true;
  constructor() {
    super();
  }
}
