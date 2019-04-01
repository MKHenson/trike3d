import { Matrix4 } from '../maths/matrix4';
import { _Math } from '../maths/math';
import { PerspectiveCamera } from './perspective-camera';
import { Camera } from './camera';

const buffer1 = new Matrix4();
const buffer2 = new Matrix4();

export class StereoCamera extends Camera {
  public type = 'StereoCamera';
  public aspect: number;
  public eyeSep: number;
  public cameraL: PerspectiveCamera;
  public cameraR: PerspectiveCamera;

  constructor() {
    super();

    this.aspect = 1;
    this.eyeSep = 0.064;
    this.cameraL = new PerspectiveCamera();
    this.cameraL.layers.enable(1);
    this.cameraL.matrixAutoUpdate = false;
    this.cameraR = new PerspectiveCamera();
    this.cameraR.layers.enable(2);
    this.cameraR.matrixAutoUpdate = false;
  }

  update(camera: PerspectiveCamera) {
    const instance = this;
    let focus: number | undefined,
      fov: number | undefined,
      aspect: number | undefined,
      near: number | undefined,
      far: number | undefined,
      zoom: number | undefined,
      eyeSep: number | undefined;

    const eyeRight = buffer1;
    const eyeLeft = buffer2;

    let needsUpdate =
      instance !== this ||
      focus !== camera.focus ||
      fov !== camera.fov ||
      aspect !== camera.aspect * this.aspect ||
      near !== camera.near ||
      far !== camera.far ||
      zoom !== camera.zoom ||
      eyeSep !== this.eyeSep;

    if (needsUpdate) {
      focus = camera.focus;
      fov = camera.fov;
      aspect = camera.aspect * this.aspect;
      near = camera.near;
      far = camera.far;
      zoom = camera.zoom;

      // Off-axis stereoscopic effect based on
      // http://paulbourke.net/stereographics/stereorender/
      var projectionMatrix = camera.projectionMatrix.clone();
      eyeSep = this.eyeSep / 2;
      var eyeSepOnProjection = (eyeSep * near) / focus;
      var ymax = (near * Math.tan(_Math.DEG2RAD * fov * 0.5)) / zoom;
      var xmin, xmax;

      // translate xOffset
      eyeLeft.elements[12] = -eyeSep;
      eyeRight.elements[12] = eyeSep;

      // for left eye
      xmin = -ymax * aspect + eyeSepOnProjection;
      xmax = ymax * aspect + eyeSepOnProjection;

      projectionMatrix.elements[0] = (2 * near) / (xmax - xmin);
      projectionMatrix.elements[8] = (xmax + xmin) / (xmax - xmin);

      this.cameraL.projectionMatrix.copy(projectionMatrix);

      // for right eye
      xmin = -ymax * aspect - eyeSepOnProjection;
      xmax = ymax * aspect - eyeSepOnProjection;

      projectionMatrix.elements[0] = (2 * near) / (xmax - xmin);
      projectionMatrix.elements[8] = (xmax + xmin) / (xmax - xmin);

      this.cameraR.projectionMatrix.copy(projectionMatrix);
    }

    this.cameraL.matrixWorld.copy(camera.matrixWorld).multiply(eyeLeft);
    this.cameraR.matrixWorld.copy(camera.matrixWorld).multiply(eyeRight);
  }
}
