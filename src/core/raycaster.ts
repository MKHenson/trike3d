import { Ray } from '../maths/ray';
import { Vector3 } from '../maths/vector3';
import { Vector2 } from '../maths/vector2';
import { Object3D } from './object-3d';
import { PerspectiveCamera } from '../cameras/perspective-camera';
import { Face3 } from './face3';

function ascSort(a: Intersects, b: Intersects) {
  return a.distance - b.distance;
}

export type Intersects = {
  distance: number;
  point: Vector3;
  index: number;
  face: null | Face3;
  faceIndex: null | number;
  object: Object3D;
};

function intersectObject(object: Object3D, raycaster: Raycaster, intersects: Intersects[], recursive: boolean) {
  if (object.visible === false) return;

  object.raycast(raycaster, intersects);

  if (recursive === true) {
    var children = object.children;

    for (var i = 0, l = children.length; i < l; i++) {
      intersectObject(children[i], raycaster, intersects, true);
    }
  }
}

export class Raycaster {
  public ray: Ray;
  public near: number;
  public far: number;
  public params: {
    Mesh: {};
    Line: {};
    LOD: {};
    Points: { threshold: number };
    Sprite: {};
  };
  public linePrecision: number;

  constructor(origin: Vector3, direction: Vector3, near?: number, far?: number) {
    this.ray = new Ray(origin, direction);
    // direction is assumed to be normalized (for accurate distance calculations)

    this.near = near || 0;
    this.far = far || Infinity;
    this.linePrecision = 1;

    this.params = {
      Mesh: {},
      Line: {},
      LOD: {},
      Points: { threshold: 1 },
      Sprite: {}
    };
  }

  set(origin: Vector3, direction: Vector3) {
    // direction is assumed to be normalized (for accurate distance calculations)

    this.ray.set(origin, direction);
  }

  setFromCamera(coords: Vector2, camera: PerspectiveCamera) {
    if ((camera as PerspectiveCamera).isPerspectiveCamera) {
      this.ray.origin.setFromMatrixPosition(camera.matrixWorld);
      this.ray.direction
        .set(coords.x, coords.y, 0.5)
        .unproject(camera)
        .sub(this.ray.origin)
        .normalize();
    } else if (camera && camera.isOrthographicCamera) {
      this.ray.origin
        .set(coords.x, coords.y, (camera.near + camera.far) / (camera.near - camera.far))
        .unproject(camera); // set origin in plane of camera
      this.ray.direction.set(0, 0, -1).transformDirection(camera.matrixWorld);
    } else {
      throw new Error('Unsupported camera type.');
    }
  }

  intersectObject(object: Object3D, recursive: boolean, optionalTarget: Intersects[]) {
    var intersects = optionalTarget || [];

    intersectObject(object, this, intersects, recursive);

    intersects.sort(ascSort);

    return intersects;
  }

  intersectObjects(objects: Object3D[], recursive: boolean, optionalTarget: Intersects[]) {
    var intersects = optionalTarget || [];

    for (var i = 0, l = objects.length; i < l; i++) {
      intersectObject(objects[i], this, intersects, recursive);
    }

    intersects.sort(ascSort);

    return intersects;
  }
}
