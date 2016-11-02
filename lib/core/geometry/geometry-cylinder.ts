namespace Trike {
	/**
	* Use this class to create cylinder geometry
	*/
    export class GeometryCylinder extends Geometry {
        private _radiusTop: number;
        private _radiusBottom: number;
        private _height: number;
        private _radialSegments: number;
        private _heightSegments: number;
        private _thetaStart: number;
        private _thetaLength: number;
        private _openEnded: boolean;


        constructor( radiusTop: number = 1, radiusBottom: number = 1, height: number = 10, radialSegments: number = 8, heightSegments: number = 1, thetaStart: number = 0, thetaLength: number = Math.PI * 2, openEnded: boolean = false ) {
            super();

            this._radiusTop = radiusTop;
            this._radiusBottom = radiusBottom;
            this._height = height;
            this._radialSegments = radialSegments;
            this._heightSegments = heightSegments;
            this._openEnded = openEnded;
            this._thetaStart = thetaStart;
            this._thetaLength = thetaLength;

            this.build();
        }

		/**
		* Gets or sets the theta length value of this cylinder. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        thetaLength( val?: number ): number {
            if ( val === undefined ) return this._thetaLength;
            this._thetaLength = val;
            this.build();
        }

		/**
		* Gets or sets the start theta value of this cylinder. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        thetaStart( val?: number ): number {
            if ( val === undefined ) return this._thetaStart;
            this._thetaStart = val;
            this.build();
        }

		/**
		* Gets or sets if this cylinder is open ended or not. The causes the geometry to be re-built so
		* use it sparingly
		* @param {boolean} val [Optional]
		* @returns {boolean}
		*/
        openEnded( val?: boolean ): boolean {
            if ( val === undefined ) return this._openEnded;
            this._openEnded = val;
            this.build();
        }

		/**
		* Gets or sets the number of height segments of this cylinder. The causes the geometry to be re-built so
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
		* Gets or sets the number of radial segments of this cylinder. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        radialSegments( val?: number ): number {
            if ( val === undefined ) return this._radialSegments;
            if ( val < 1 ) val = 1;
            this._radialSegments = val;
            this.build();
        }

		/**
		* Gets or sets the height of this cylinder. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        height( val?: number ): number {
            if ( val === undefined ) return this._height;
            if ( val === 0 ) val = 0.0001;
            this._height = val;
            this.build();
        }

		/**
		* Gets or sets the bottom radius of this cylinder. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        radiusBottom( val?: number ): number {
            if ( val === undefined ) return this._radiusBottom;
            if ( val === 0 ) val = 0.0001;
            this._radiusBottom = val;
            this.build();
        }

		/**
		* Gets or sets the top radius of this cylinder. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        radiusTop( val?: number ): number {
            if ( val === undefined ) return this._radiusTop;
            if ( val === 0 ) val = 0.0001;
            this._radiusTop = val;
            this.build();
        }

		/**
		* Builds the geometry of the cube. This will cause the geometry to be rebuilt, so use it sparingly.
		*/
        build() {
            const radiusTop = this._radiusTop;
            const radiusBottom = this._radiusBottom;
            const height = this._height;
            const radialSegments = this._radialSegments;
            const heightSegments = this._heightSegments;
            const openEnded = this._openEnded;
            const thetaStart = this._thetaStart;
            const thetaLength = this._thetaLength;
            const buffers = this.buffers;

            // Add the buffers
            this.addAttributes( new GeometryBuffer( [], 3, AttributeType.POSITION ) );
            this.addAttributes( new GeometryBuffer( [], 2, AttributeType.UV ) );
            this.addAttributes( new GeometryBuffer( [], 3, AttributeType.NORMAL ) );
            this.faces.splice( 0, this.faces.length );

            const heightHalf = height / 2;
            let x, y;
            const vertices: Array<Array<number>> = [], uvs: Array<Array<Vec2>> = [];

            for ( y = 0; y <= heightSegments; y++ ) {
                const verticesRow: Array<number> = [];
                const uvsRow: Array<Vec2> = [];

                const v = y / heightSegments;
                const radius = v * ( radiusBottom - radiusTop ) + radiusTop;

                for ( x = 0; x <= radialSegments; x++ ) {
                    const u = x / radialSegments;

                    const vertex = new Vec3();
                    vertex.x = radius * Math.sin( u * thetaLength + thetaStart );
                    vertex.y = - v * height + heightHalf;
                    vertex.z = radius * Math.cos( u * thetaLength + thetaStart );

                    buffers[ AttributeType.POSITION ].data.push( vertex );

                    verticesRow.push( buffers[ AttributeType.POSITION ].data.length - 1 );
                    uvsRow.push( new Vec2( u, 1 - v ) );
                }

                vertices.push( verticesRow );
                uvs.push( uvsRow );
            }

            const tanTheta: number = ( radiusBottom - radiusTop ) / height;
            let na: Vec3, nb: Vec3;

            for ( x = 0; x < radialSegments; x++ ) {
                if ( radiusTop !== 0 ) {
                    na = buffers[ AttributeType.POSITION ].data[ vertices[ 0 ][ x ] ].clone();
                    nb = buffers[ AttributeType.POSITION ].data[ vertices[ 0 ][ x + 1 ] ].clone();
                }
                else {
                    na = buffers[ AttributeType.POSITION ].data[ vertices[ 1 ][ x ] ].clone();
                    nb = buffers[ AttributeType.POSITION ].data[ vertices[ 1 ][ x + 1 ] ].clone();
                }

                na.setY( Math.sqrt( na.x * na.x + na.z * na.z ) * tanTheta ).normalize();
                nb.setY( Math.sqrt( nb.x * nb.x + nb.z * nb.z ) * tanTheta ).normalize();

                for ( y = 0; y < heightSegments; y++ ) {
                    // Get the current UV index
                    const uvIndex = buffers[ AttributeType.UV ].data.length;
                    const normalIndex = buffers[ AttributeType.NORMAL ].data.length;

                    const v1 = vertices[ y ][ x ];
                    const v2 = vertices[ y + 1 ][ x ];
                    const v3 = vertices[ y + 1 ][ x + 1 ];
                    const v4 = vertices[ y ][ x + 1 ];

                    const n1 = na.clone();
                    const n2 = na.clone();
                    const n3 = nb.clone();
                    const n4 = nb.clone();

                    const uv1 = uvs[ y ][ x ].clone();
                    const uv2 = uvs[ y + 1 ][ x ].clone();
                    const uv3 = uvs[ y + 1 ][ x + 1 ].clone();
                    const uv4 = uvs[ y ][ x + 1 ].clone();

                    // Add the faces
                    let face: Face3 = new Face3( v1, v2, v4 );
                    buffers[ AttributeType.NORMAL ].data.push( n1, n2, n4 );
                    face.vertexNormals[ 0 ] = n1;
                    face.vertexNormals[ 1 ] = n2;
                    face.vertexNormals[ 2 ] = n4;
                    this.faces.push( face );

                    // Add some UV data to the geometry's UV buffer
                    buffers[ AttributeType.UV ].data.push( uv1, uv2, uv4 );

                    // Set the face indices
                    face.setAttributeIndices( AttributeType.NORMAL, normalIndex, normalIndex + 1, normalIndex + 2 );
                    face.setAttributeIndices( AttributeType.UV, uvIndex, uvIndex + 1, uvIndex + 2 );


                    face = new Face3( v2, v3, v4 );
                    buffers[ AttributeType.NORMAL ].data.push( n2.clone(), n3, n4.clone() );
                    face.vertexNormals[ 0 ] = n2.clone();
                    face.vertexNormals[ 1 ] = n3;
                    face.vertexNormals[ 2 ] = n4.clone();
                    this.faces.push( face );

                    // Add some UV data to the geometry's UV buffer
                    buffers[ AttributeType.UV ].data.push( uv2.clone(), uv3, uv4.clone() );

                    // Set the face indices
                    face.setAttributeIndices( AttributeType.NORMAL, normalIndex + 3, normalIndex + 4, normalIndex + 5 );
                    face.setAttributeIndices( AttributeType.UV, uvIndex + 3, uvIndex + 4, uvIndex + 5 );
                }
            }

            // top cap
            if ( openEnded === false && radiusTop > 0 ) {
                buffers[ AttributeType.POSITION ].data.push( new Vec3( 0, heightHalf, 0 ) );
                for ( x = 0; x < radialSegments; x++ ) {
                    // Get the current UV index
                    const uvIndex = buffers[ AttributeType.UV ].data.length;
                    const normalIndex = buffers[ AttributeType.NORMAL ].data.length;

                    const v1 = vertices[ 0 ][ x ];
                    const v2 = vertices[ 0 ][ x + 1 ];
                    const v3 = buffers[ AttributeType.POSITION ].data.length - 1;

                    const n1 = new Vec3( 0, 1, 0 );
                    const n2 = new Vec3( 0, 1, 0 );
                    const n3 = new Vec3( 0, 1, 0 );

                    const uv1 = uvs[ 0 ][ x ].clone();
                    const uv2 = uvs[ 0 ][ x + 1 ].clone();
                    const uv3 = new Vec2( uv2.x, 0 );

                    // Add the face
                    const face: Face3 = new Face3( v1, v2, v3 );
                    buffers[ AttributeType.NORMAL ].data.push( n1, n2, n3 );
                    face.vertexNormals[ 0 ] = n1;
                    face.vertexNormals[ 1 ] = n2;
                    face.vertexNormals[ 2 ] = n3;
                    this.faces.push( face );

                    // Add some UV data to the geometry's UV buffer
                    buffers[ AttributeType.UV ].data.push( uv1, uv2, uv3 );

                    // Set the face indices
                    // face.setAttributeIndices( AttributeType.POSITION, v1, v2, v3 );
                    face.setAttributeIndices( AttributeType.NORMAL, normalIndex, normalIndex + 1, normalIndex + 2 );
                    face.setAttributeIndices( AttributeType.UV, uvIndex, uvIndex + 1, uvIndex + 2 );
                }
            }

            // bottom cap
            if ( openEnded === false && radiusBottom > 0 ) {
                buffers[ AttributeType.POSITION ].data.push( new Vec3( 0, - heightHalf, 0 ) );

                for ( x = 0; x < radialSegments; x++ ) {
                    // Get the current UV index
                    const uvIndex = buffers[ AttributeType.UV ].data.length;
                    const normalIndex = buffers[ AttributeType.NORMAL ].data.length;


                    const v1 = vertices[ y ][ x + 1 ];
                    const v2 = vertices[ y ][ x ];
                    const v3 = buffers[ AttributeType.POSITION ].data.length - 1;

                    const n1 = new Vec3( 0, - 1, 0 );
                    const n2 = new Vec3( 0, - 1, 0 );
                    const n3 = new Vec3( 0, - 1, 0 );

                    const uv1 = uvs[ y ][ x + 1 ].clone();
                    const uv2 = uvs[ y ][ x ].clone();
                    const uv3 = new Vec2( uv2.x, 1 );

                    // Add the face
                    const face: Face3 = new Face3( v1, v2, v3 );
                    buffers[ AttributeType.NORMAL ].data.push( n1, n2, n3 );
                    face.vertexNormals[ 0 ] = n1;
                    face.vertexNormals[ 1 ] = n2;
                    face.vertexNormals[ 2 ] = n3;
                    this.faces.push( face );

                    // Add some UV data to the geometry's UV buffer
                    buffers[ AttributeType.UV ].data.push( uv1, uv2, uv3 );

                    // Set the face indices
                    // face.setAttributeIndices( AttributeType.POSITION, v1, v2, v3 );
                    face.setAttributeIndices( AttributeType.NORMAL, normalIndex, normalIndex + 1, normalIndex + 2 );
                    face.setAttributeIndices( AttributeType.UV, uvIndex, uvIndex + 1, uvIndex + 2 );
                }
            }

            this.computeCentroids();
            this.computeFaceNormals();
            this.computeBoundingBox();
            this.computeBoundingSphere();
        }
    }
}