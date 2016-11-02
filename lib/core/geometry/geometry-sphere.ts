namespace Trike {
	/**
	* Use this class to create cube geometry
	*/
    export class GeometrySphere extends Geometry {
        private _phiStart: number;
        private _phiLength: number;
        private _thetaStart: number;
        private _thetaLength: number;
        private _radius: number;
        private _widthSegments: number;
        private _heightSegments: number;

        constructor( radius: number = 1, widthSegments: number = 8, heightSegments: number = 6, phiStart: number = 0, phiLength: number = Math.PI * 2, thetaStart: number = 0, thetaLength: number = Math.PI ) {
            super();

            this._phiStart = phiStart;
            this._phiLength = phiLength;
            this._thetaStart = thetaStart;
            this._thetaLength = thetaLength;
            this._radius = radius;
            this._widthSegments = widthSegments;
            this._heightSegments = heightSegments;

            this.build();
        }

		/**
		* Gets or sets the theta start of this sphere. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        thetaStart( val?: number ): number {
            if ( val === undefined ) return this._thetaStart;
            if ( val === 0 ) val = 0.0001;
            this._thetaStart = val;
            this.build();
        }

		/**
		* Gets or sets the theta length of this sphere. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        thetaLength( val?: number ): number {
            if ( val === undefined ) return this._thetaLength;
            if ( val === 0 ) val = 0.0001;
            this._thetaLength = val;
            this.build();
        }

		/**
		* Gets or sets the phi start of this sphere. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        phiStart( val?: number ): number {
            if ( val === undefined ) return this._phiStart;
            if ( val === 0 ) val = 0.0001;
            this._phiStart = val;
            this.build();
        }

		/**
		* Gets or sets the phi length of this sphere. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        phiLength( val?: number ): number {
            if ( val === undefined ) return this._phiLength;
            if ( val === 0 ) val = 0.0001;
            this._phiLength = val;
            this.build();
        }

		/**
		* Gets or sets the radius of this sphere. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        radius( val?: number ): number {
            if ( val === undefined ) return this._radius;
            if ( val === 0 ) val = 0.0001;
            this._radius = val;
            this.build();
        }

		/**
		* Gets or sets the number of width segments of this sphere. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        widthSegments( val?: number ): number {
            if ( val === undefined ) return this._widthSegments;
            if ( val < 1 ) val = 1;
            this._widthSegments = val;
            this.build();
        }

		/**
		* Gets or sets the number of height segments of this sphere. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        heightSegments( val?: number ): number {
            if ( val === undefined ) return this._heightSegments;
            if ( val < 1 ) val = 1;
            this._heightSegments = val;
            this.build();
        }

		/**
		* Builds the geometry of the sphere. This will cause the geometry to be rebuilt, so use it sparingly.
		*/
        build() {
            const phiStart = this._phiStart;
            const phiLength = this._phiLength;
            const thetaStart = this._thetaStart;
            const thetaLength = this._thetaLength;
            const radius = this._radius;
            const widthSegments = this._widthSegments;
            const heightSegments = this._heightSegments;

            let x, y;
            const vertices = [], uvs = [], buffers = this.buffers;

            // Cleanup any existing faces
            this.faces.splice( 0, this.faces.length );


            this.addAttributes( new GeometryBuffer( [], 3, AttributeType.POSITION ) );
            this.addAttributes( new GeometryBuffer( [], 3, AttributeType.NORMAL ) );
            this.addAttributes( new GeometryBuffer( [], 2, AttributeType.UV ) );

            const vertexData = buffers[ AttributeType.POSITION ].data;
            const normData = buffers[ AttributeType.NORMAL ].data;
            const uvData = buffers[ AttributeType.UV ].data;

            for ( y = 0; y <= heightSegments; y++ ) {
                const verticesRow = [];
                const uvsRow: Array<Vec2> = [];

                for ( x = 0; x <= widthSegments; x++ ) {
                    const u = x / widthSegments;
                    const v = y / heightSegments;

                    const vertex = new Vec3( 0, 0, 0 );
                    vertex.x = - radius * Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
                    vertex.y = radius * Math.cos( thetaStart + v * thetaLength );
                    vertex.z = radius * Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

                    vertexData.push( vertex );

                    verticesRow.push( vertexData.length - 1 );
                    uvsRow.push( new Vec2( u, 1 - v ) );
                }

                vertices.push( verticesRow );
                uvs.push( uvsRow );
            }

            for ( y = 0; y < heightSegments; y++ ) {
                for ( x = 0; x < widthSegments; x++ ) {
                    const v1: number = vertices[ y ][ x + 1 ];
                    const v2: number = vertices[ y ][ x ];
                    const v3: number = vertices[ y + 1 ][ x ];
                    const v4: number = vertices[ y + 1 ][ x + 1 ];

                    const n1 = vertexData[ v1 ].clone();
                    const n2 = vertexData[ v2 ].clone();
                    const n3 = vertexData[ v3 ].clone();
                    const n4 = vertexData[ v4 ].clone();
                    n1.normalize();
                    n2.normalize();
                    n3.normalize();
                    n4.normalize();

                    const uv1 = uvs[ y ][ x + 1 ].clone();
                    const uv2 = uvs[ y ][ x ].clone();
                    const uv3 = uvs[ y + 1 ][ x ].clone();
                    const uv4 = uvs[ y + 1 ][ x + 1 ].clone();

                    if ( Math.abs( vertexData[ v1 ][ 1 ] ) === radius ) {
                        const face = new Face3( v1, v3, v4 );
                        this.faces.push( face );
                        normData.push( n1, n3, n4 );
                        uvData.push( uv1, uv3, uv4 );

                        face.attributeIndices[ AttributeType.POSITION ] = [ v1, v3, v4 ];
                        face.attributeIndices[ AttributeType.NORMAL ] = [ normData.length - 3, normData.length - 2, normData.length - 1 ];
                        face.attributeIndices[ AttributeType.UV ] = [ uvData.length - 3, uvData.length - 2, uvData.length - 1 ];

                    }
                    else if ( Math.abs( vertexData[ v3 ][ 1 ] ) === radius ) {
                        const face = new Face3( v1, v2, v3 );
                        this.faces.push( face );
                        normData.push( n1, n2, n3 );
                        uvData.push( uv1, uv2, uv3 );

                        face.attributeIndices[ AttributeType.POSITION ] = [ v1, v2, v3 ];
                        face.attributeIndices[ AttributeType.NORMAL ] = [ normData.length - 3, normData.length - 2, normData.length - 1 ];
                        face.attributeIndices[ AttributeType.UV ] = [ uvData.length - 3, uvData.length - 2, uvData.length - 1 ];
                    }
                    else {
                        let face = new Face3( v1, v2, v4 );
                        this.faces.push( face );
                        normData.push( n1, n2, n4 );
                        uvData.push( uv1, uv2, uv4 );

                        face.attributeIndices[ AttributeType.POSITION ] = [ v1, v2, v4 ];
                        face.attributeIndices[ AttributeType.NORMAL ] = [ normData.length - 3, normData.length - 2, normData.length - 1 ];
                        face.attributeIndices[ AttributeType.UV ] = [ uvData.length - 3, uvData.length - 2, uvData.length - 1 ];

                        face = new Face3( v2, v3, v4 );
                        this.faces.push( face );
                        normData.push( n2, n3, n4 );
                        uvData.push( uv2.clone(), uv3, uv4.clone() );

                        face.attributeIndices[ AttributeType.POSITION ] = [ v2, v3, v4 ];
                        face.attributeIndices[ AttributeType.NORMAL ] = [ normData.length - 3, normData.length - 2, normData.length - 1 ];
                        face.attributeIndices[ AttributeType.UV ] = [ uvData.length - 3, uvData.length - 2, uvData.length - 1 ];
                    }
                }
            }

            this.computeCentroids();
            this.computeFaceNormals();
            this.computeBoundingBox();
            this.computeBoundingSphere();
        }
    }
}