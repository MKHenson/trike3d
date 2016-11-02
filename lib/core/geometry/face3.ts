namespace Trike {
	/**
	* This class represents a face triangle. Each geometry in Trike is made up of these faces and each face keeps a set of references to each
	* of its vertices (a, b and c).
	*/
    export class Face3 {
        public a: number;
        public b: number;
        public c: number;
        public materialIndex: number;
        public normal: Vec3;
        public centroid: Vec3;
        public vertexNormals: Array<Vec3>;
        public vertexTangents: Array<Vec3>;

        public attributeIndices: { [name: number]: Array<number> };

        constructor(a: number, b: number, c: number, normal: Vec3 = new Vec3(), materialIndex?: number) {
            this.a = a;
            this.b = b;
            this.c = c;
            this.normal = normal;
            this.vertexNormals = new Array(3);
            this.vertexTangents = new Array(3);
            this.materialIndex = materialIndex !== undefined ? materialIndex : 0;
            this.centroid = new Vec3(0, 0, 0);

            this.attributeIndices = [];

            // We create the default position buffer based on the a, b and c indices provided
            this.setAttributeIndices(AttributeType.POSITION, a, b, c);
        }

        setAttributeIndices(type: AttributeType, i1: number, i2: number, i3: number) {
            this.attributeIndices[type] = [i1, i2, i3];
        }

		/**
		* Clones a new Face3 object
		*/
        clone(): Face3 {
            const face = new Face3(this.a, this.b, this.c);

            face.normal.copy(this.normal);
            face.centroid.copy(this.centroid);
            face.materialIndex = this.materialIndex;

            let i, il;
            for (i = 0, il = this.vertexNormals.length; i < il; i++) {
                if (this.vertexNormals[i])
                    face.vertexNormals[i] = this.vertexNormals[i].clone();
            }
            for (i = 0, il = this.vertexTangents.length; i < il; i++) {
                if (this.vertexTangents[i])
                    face.vertexTangents[i] = this.vertexTangents[i].clone();
            }

            for (const a in this.attributeIndices) {
                if (!this.attributeIndices[a])
                    continue;

                face.setAttributeIndices(parseInt(a), this.attributeIndices[a][0], this.attributeIndices[a][1], this.attributeIndices[a][2]);
            }

            return face;

        }
    }
}