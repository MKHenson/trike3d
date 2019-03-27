import { Line } from './Line';
import { LineBasicMaterial } from '../materials/line-basic-material';
import { Geometry } from '../core/geometry';
import { BufferGeometry } from '../core/buffer-geometry';

export class LineLoop extends Line {
  public isLineLoop = true;
  public type = 'LineLoop';

  constructor(geometry: Geometry | BufferGeometry, material: LineBasicMaterial) {
    super(geometry, material);
  }
}
