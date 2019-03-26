import { Vector2 } from '../maths/vector2.js';
import { Vector3 } from '../maths/vector3.js';
import { Color } from '../maths/color.js';
import { Geometry, MorphTargetPosition } from './geometry.js';
import { Box3 } from '../maths/box3.js';
import { Sphere } from '../maths/sphere.js';
import { Group } from './buffer-geometry.js';

export class DirectGeometry {
  public vertices: Vector3[];
  public normals: Vector3[];
  public colors: Color[];
  public uvs: Vector2[];
  public uvs2: Vector2[];
  public groups: Group[];
  public morphTargets: {
    position?: MorphTargetPosition[];
    normal?: MorphTargetPosition[];
  };
  public skinWeights: Vector3[];
  public skinIndices: Vector3[];
  public boundingBox: null | Box3;
  public boundingSphere: null | Sphere;

  // update flags
  public verticesNeedUpdate: boolean;
  public normalsNeedUpdate: boolean;
  public colorsNeedUpdate: boolean;
  public uvsNeedUpdate: boolean;
  public groupsNeedUpdate: boolean;

  constructor() {
    this.vertices = [];
    this.normals = [];
    this.colors = [];
    this.uvs = [];
    this.uvs2 = [];
    this.groups = [];
    this.morphTargets = {};
    this.skinWeights = [];
    this.skinIndices = [];
    this.boundingBox = null;
    this.boundingSphere = null;

    // update flags

    this.verticesNeedUpdate = false;
    this.normalsNeedUpdate = false;
    this.colorsNeedUpdate = false;
    this.uvsNeedUpdate = false;
    this.groupsNeedUpdate = false;
  }

  computeGroups(geometry: Geometry) {
    let group: Partial<Group> | undefined;
    const groups = [];
    let materialIndex: number | undefined = undefined;

    const faces = geometry.faces;
    let i = 0;
    for (i = 0; i < faces.length; i++) {
      const face = faces[i];

      // materials

      if (face.materialIndex !== materialIndex) {
        materialIndex = face.materialIndex;

        if (group !== undefined) {
          group.count = i * 3 - group.start!;
          groups.push(group);
        }

        group = {
          start: i * 3,
          materialIndex: materialIndex
        };
      }
    }

    if (group !== undefined) {
      group.count = i * 3 - group.start!;
      groups.push(group);
    }

    this.groups = groups as Group[];
  }

  fromGeometry(geometry: Geometry) {
    const faces = geometry.faces;
    const vertices = geometry.vertices;
    const faceVertexUvs = geometry.faceVertexUvs;

    const hasFaceVertexUv = faceVertexUvs[0] && faceVertexUvs[0].length > 0;
    const hasFaceVertexUv2 = faceVertexUvs[1] && faceVertexUvs[1].length > 0;

    // morphs
    const morphTargets = geometry.morphTargets;
    const morphTargetsLength = morphTargets.length;

    let morphTargetsPosition: MorphTargetPosition[] | undefined;

    if (morphTargetsLength > 0) {
      morphTargetsPosition = [];

      for (let i = 0; i < morphTargetsLength; i++) {
        morphTargetsPosition[i] = {
          name: morphTargets[i].name,
          data: []
        };
      }

      this.morphTargets.position = morphTargetsPosition;
    }

    const morphNormals = geometry.morphNormals;
    const morphNormalsLength = morphNormals.length;

    let morphTargetsNormal: MorphTargetPosition[] | undefined;

    if (morphNormalsLength > 0) {
      morphTargetsNormal = [];

      for (let i = 0; i < morphNormalsLength; i++) {
        morphTargetsNormal[i] = {
          name: morphNormals[i].name,
          data: []
        };
      }

      this.morphTargets.normal = morphTargetsNormal;
    }

    // skins
    const skinIndices = geometry.skinIndices;
    const skinWeights = geometry.skinWeights;

    const hasSkinIndices = skinIndices.length === vertices.length;
    const hasSkinWeights = skinWeights.length === vertices.length;

    if (vertices.length > 0 && faces.length === 0) {
      console.error('THREE.DirectGeometry: Faceless geometries are not supported.');
    }

    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];

      this.vertices.push(vertices[face.a], vertices[face.b], vertices[face.c]);

      const vertexNormals = face.vertexNormals;

      if (vertexNormals.length === 3) {
        this.normals.push(vertexNormals[0], vertexNormals[1], vertexNormals[2]);
      } else {
        const normal = face.normal;

        this.normals.push(normal, normal, normal);
      }

      const vertexColors = face.vertexColors;

      if (vertexColors.length === 3) {
        this.colors.push(vertexColors[0], vertexColors[1], vertexColors[2]);
      } else {
        const color = face.color;

        this.colors.push(color, color, color);
      }

      if (hasFaceVertexUv === true) {
        const vertexUvs = faceVertexUvs[0][i];

        if (vertexUvs !== undefined) {
          this.uvs.push(vertexUvs[0], vertexUvs[1], vertexUvs[2]);
        } else {
          console.warn('THREE.DirectGeometry.fromGeometry(): Undefined vertexUv ', i);

          this.uvs.push(new Vector2(), new Vector2(), new Vector2());
        }
      }

      if (hasFaceVertexUv2 === true) {
        const vertexUvs = faceVertexUvs[1][i];

        if (vertexUvs !== undefined) {
          this.uvs2.push(vertexUvs[0], vertexUvs[1], vertexUvs[2]);
        } else {
          console.warn('THREE.DirectGeometry.fromGeometry(): Undefined vertexUv2 ', i);

          this.uvs2.push(new Vector2(), new Vector2(), new Vector2());
        }
      }

      // morphs
      for (let j = 0; j < morphTargetsLength; j++) {
        const morphTarget = morphTargets[j].vertices;

        morphTargetsPosition![j].data!.push(morphTarget[face.a], morphTarget[face.b], morphTarget[face.c]);
      }

      for (let j = 0; j < morphNormalsLength; j++) {
        const morphNormal = morphNormals![j].vertexNormals![i];

        morphTargetsNormal![j].data!.push(morphNormal.a, morphNormal.b, morphNormal.c);
      }

      // skins
      if (hasSkinIndices) {
        this.skinIndices.push(skinIndices[face.a], skinIndices[face.b], skinIndices[face.c]);
      }

      if (hasSkinWeights) {
        this.skinWeights.push(skinWeights[face.a], skinWeights[face.b], skinWeights[face.c]);
      }
    }

    this.computeGroups(geometry);

    this.verticesNeedUpdate = geometry.verticesNeedUpdate;
    this.normalsNeedUpdate = geometry.normalsNeedUpdate;
    this.colorsNeedUpdate = geometry.colorsNeedUpdate;
    this.uvsNeedUpdate = geometry.uvsNeedUpdate;
    this.groupsNeedUpdate = geometry.groupsNeedUpdate;

    return this;
  }
}
