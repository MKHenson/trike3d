import { Line } from './line';
import { Vector3 } from '../maths/vector3';
import { Float32BufferAttribute } from '../core/buffer-attribute';
import { BufferGeometry } from '../core/buffer-geometry';
import { Geometry } from '../core/geometry';
import { LineBasicMaterial } from '../materials/line-basic-material';

const buffer1 = new Vector3();
const buffer2 = new Vector3();

export class LineSegments extends Line {
  public type = 'LineSegments';
  public isLineSegments = true;

  constructor(geometry: Geometry | BufferGeometry, material: LineBasicMaterial) {
    super(geometry, material);
  }

  computeLineDistances() {
    var start = buffer1;
    var end = buffer2;
    var geometry = this.geometry;

    if ((geometry as BufferGeometry).isBufferGeometry) {
      // we assume non-indexed geometry

      if ((geometry as BufferGeometry).index === null) {
        var positionAttribute = (geometry as BufferGeometry).attributes.position!;
        var lineDistances: number[] = [];

        for (var i = 0, l = positionAttribute.count; i < l; i += 2) {
          start.fromBufferAttribute(positionAttribute, i);
          end.fromBufferAttribute(positionAttribute, i + 1);

          lineDistances[i] = i === 0 ? 0 : lineDistances[i - 1];
          lineDistances[i + 1] = lineDistances[i] + start.distanceTo(end);
        }

        (geometry as BufferGeometry).addAttribute('lineDistance', new Float32BufferAttribute(lineDistances, 1));
      } else {
        console.warn(
          'THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.'
        );
      }
    } else if ((geometry as Geometry).isGeometry) {
      var vertices = (geometry as Geometry).vertices;
      var lineDistances = (geometry as Geometry).lineDistances;

      for (var i = 0, l = vertices.length; i < l; i += 2) {
        start.copy(vertices[i]);
        end.copy(vertices[i + 1]);

        lineDistances[i] = i === 0 ? 0 : lineDistances[i - 1];
        lineDistances[i + 1] = lineDistances[i] + start.distanceTo(end);
      }
    }

    return this;
  }
}
