import { Vector3 } from '../maths/vector3';
import { Object3D } from '../core/object-3d';
import { Raycaster, Intersects } from '../core/raycaster';
import { Camera } from '../cameras/camera';

const buffer1 = new Vector3();
const buffer2 = new Vector3();

export class Lod extends Object3D {
  public type = 'LOD';
  public levels: { object: Object3D; distance: number }[];

  constructor() {
    super();

    this.levels = [];
  }

  copy(source: Lod) {
    super.copy(source, false);

    var levels = source.levels;

    for (var i = 0, l = levels.length; i < l; i++) {
      var level = levels[i];

      this.addLevel(level.object.clone(), level.distance);
    }

    return this;
  }

  addLevel(object: Object3D, distance: number) {
    if (distance === undefined) distance = 0;

    distance = Math.abs(distance);

    var levels = this.levels;

    for (var l = 0; l < levels.length; l++) {
      if (distance < levels[l].distance) {
        break;
      }
    }

    levels.splice(l, 0, { distance: distance, object: object });

    this.add(object);
  }

  getObjectForDistance(distance: number) {
    var levels = this.levels;

    for (var i = 1, l = levels.length; i < l; i++) {
      if (distance < levels[i].distance) {
        break;
      }
    }

    return levels[i - 1].object;
  }

  raycast(raycaster: Raycaster, intersects: Intersects[]) {
    var matrixPosition = buffer1;

    matrixPosition.setFromMatrixPosition(this.matrixWorld);

    var distance = raycaster.ray.origin.distanceTo(matrixPosition);

    this.getObjectForDistance(distance).raycast(raycaster, intersects);
  }

  update(camera: Camera) {
    var v1 = buffer1;
    var v2 = buffer2;

    var levels = this.levels;

    if (levels.length > 1) {
      v1.setFromMatrixPosition(camera.matrixWorld);
      v2.setFromMatrixPosition(this.matrixWorld);

      var distance = v1.distanceTo(v2);

      levels[0].object.visible = true;

      for (var i = 1, l = levels.length; i < l; i++) {
        if (distance >= levels[i].distance) {
          levels[i - 1].object.visible = false;
          levels[i].object.visible = true;
        } else {
          break;
        }
      }

      for (; i < l; i++) {
        levels[i].object.visible = false;
      }
    }
  }
}
