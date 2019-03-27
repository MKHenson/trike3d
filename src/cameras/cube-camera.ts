import { Object3D } from '../core/object-3d';
import { WebGLRenderTargetCube } from '../renderers/WebGLRenderTargetCube';
import { FilterType, FormatType } from '../constants';
import { Vector3 } from '../maths/vector3';
import { PerspectiveCamera } from './perspective-camera';
import { Color } from '../maths/color';

export class CubeCamera extends Object3D {
  public type = 'CUBE_CAMERA';

  constructor(near: number, far: number, cubeResolution: number, options) {
    super();

    const fov = 90,
      aspect = 1;

    const cameraPX = new PerspectiveCamera(fov, aspect, near, far);
    cameraPX.up.set(0, -1, 0);
    cameraPX.lookAt(new Vector3(1, 0, 0));
    this.add(cameraPX);

    const cameraNX = new PerspectiveCamera(fov, aspect, near, far);
    cameraNX.up.set(0, -1, 0);
    cameraNX.lookAt(new Vector3(-1, 0, 0));
    this.add(cameraNX);

    const cameraPY = new PerspectiveCamera(fov, aspect, near, far);
    cameraPY.up.set(0, 0, 1);
    cameraPY.lookAt(new Vector3(0, 1, 0));
    this.add(cameraPY);

    const cameraNY = new PerspectiveCamera(fov, aspect, near, far);
    cameraNY.up.set(0, 0, -1);
    cameraNY.lookAt(new Vector3(0, -1, 0));
    this.add(cameraNY);

    const cameraPZ = new PerspectiveCamera(fov, aspect, near, far);
    cameraPZ.up.set(0, -1, 0);
    cameraPZ.lookAt(new Vector3(0, 0, 1));
    this.add(cameraPZ);

    const cameraNZ = new PerspectiveCamera(fov, aspect, near, far);
    cameraNZ.up.set(0, -1, 0);
    cameraNZ.lookAt(new Vector3(0, 0, -1));
    this.add(cameraNZ);

    options = options || {
      format: FormatType.RGBFormat,
      magFilter: FilterType.LinearFilter,
      minFilter: FilterType.LinearFilter
    };

    this.renderTarget = new WebGLRenderTargetCube(cubeResolution, cubeResolution, options);
    this.renderTarget.texture.name = 'CubeCamera';
  }

  update(renderer, scene) {
    if (this.parent === null) this.updateMatrixWorld();

    const currentRenderTarget = renderer.getRenderTarget();

    const renderTarget = this.renderTarget;
    const generateMipmaps = renderTarget.texture.generateMipmaps;

    renderTarget.texture.generateMipmaps = false;

    renderer.setRenderTarget(renderTarget, 0);
    renderer.render(scene, cameraPX);

    renderer.setRenderTarget(renderTarget, 1);
    renderer.render(scene, cameraNX);

    renderer.setRenderTarget(renderTarget, 2);
    renderer.render(scene, cameraPY);

    renderer.setRenderTarget(renderTarget, 3);
    renderer.render(scene, cameraNY);

    renderer.setRenderTarget(renderTarget, 4);
    renderer.render(scene, cameraPZ);

    renderTarget.texture.generateMipmaps = generateMipmaps;

    renderer.setRenderTarget(renderTarget, 5);
    renderer.render(scene, cameraNZ);

    renderer.setRenderTarget(currentRenderTarget);
  }

  clear(renderer, color: Color, depth: boolean, stencil: boolean) {
    const currentRenderTarget = renderer.getRenderTarget();

    const renderTarget = this.renderTarget;

    for (let i = 0; i < 6; i++) {
      renderer.setRenderTarget(renderTarget, i);

      renderer.clear(color, depth, stencil);
    }

    renderer.setRenderTarget(currentRenderTarget);
  }
}
