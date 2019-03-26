import { Matrix3 } from '../../maths/matrix3';
import { Color } from '../../maths/color';
import { Matrix4 } from '../../maths/matrix4';
import { Vector2 } from '../../maths/vector2';
import { Vector3 } from '../../maths/vector3';
import { Vector4 } from '../../maths/vector4';
import { Texture } from '../../textures/texture';

export function cloneUniforms(src: any) {
  var dst: any = {};

  for (var u in src) {
    dst[u] = {};

    for (var p in src[u]) {
      var property = src[u][p];

      if (
        property &&
        ((property as Color).isColor ||
          (property as Matrix3).isMatrix3 ||
          (property as Matrix4).isMatrix4 ||
          (property as Vector2).isVector2 ||
          (property as Vector3).isVector3 ||
          (property as Vector4).isVector4 ||
          (property as Texture).isTexture)
      ) {
        dst[u][p] = property.clone();
      } else if (Array.isArray(property)) {
        dst[u][p] = property.slice();
      } else {
        dst[u][p] = property;
      }
    }
  }

  return dst;
}

export function mergeUniforms(uniforms: any) {
  var merged: any = {};

  for (var u = 0; u < uniforms.length; u++) {
    var tmp = cloneUniforms(uniforms[u]);

    for (var p in tmp) {
      merged[p] = tmp[p];
    }
  }

  return merged;
}
