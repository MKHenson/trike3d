namespace Trike {
	/**
	* Geometry representing a cube
	*/
    export class GeometryCube extends Geometry {
        private _width: number;
        private _height: number;
        private _depth: number;
        private _widthSegments: number;
        private _heightSegments: number;
        private _depthSegments: number;

		/**
		* Creates an instance
		* @param {number} width The width of this geometry
		* @param {number} height The height of this geometry
		* @param {number} depth The depth of this geometry
		* @param {number} widthSegments The widthSegments of this geometry
		* @param {number} heightSegments The heightSegments of this geometry
		* @param {number} depthSegments The depthSegments of this geometry
		*/
        constructor( width: number = 1, height: number = 1, depth: number = 1, widthSegments: number = 1, heightSegments: number = 1, depthSegments: number = 1 ) {
            super();

            this._width = width;
            this._height = height;
            this._depth = depth;

            this._widthSegments = widthSegments;
            this._heightSegments = heightSegments;
            this._depthSegments = depthSegments;

            this.build();
        }

		/**
		* Gets or sets the width of this cube. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        width( val?: number ): number {
            if ( val === undefined ) return this._width;
            if ( val === 0 ) val = 0.0001;
            this._width = val;
            this.build();
        }

		/**
		* Gets or sets the height of this cube. The causes the geometry to be re-built so
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
		* Gets or sets the depth of this cube. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        depth( val?: number ): number {
            if ( val === undefined ) return this._depth;
            if ( val === 0 ) val = 0.0001;
            this._depth = val;
            this.build();
        }

		/**
		* Gets or sets the number of width segments of this cube. The causes the geometry to be re-built so
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
		* Gets or sets the number of height segments of this cube. The causes the geometry to be re-built so
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
		* Gets or sets the number of depth segments of this cube. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        depthSegments( val?: number ): number {
            if ( val === undefined ) return this._depthSegments;
            if ( val < 1 ) val = 1;
            this._depthSegments = val;
            this.build();
        }

		/**
		* Builds the geometry of the cube. This will cause the geometry to be rebuilt, so use it sparingly.
		*/
        build() {
            const width = this._width;
            const height = this._height;
            const depth = this._depth;
            const widthSegments = this._widthSegments;
            const heightSegments = this._heightSegments;
            const depthSegments = this._depthSegments;

            const width_half = width / 2;
            const height_half = height / 2;
            const depth_half = depth / 2;

            const tempVerts = [];

            // Add the buffers
            this.addAttributes( new GeometryBuffer( [], 3, AttributeType.POSITION ) );
            this.addAttributes( new GeometryBuffer( [], 2, AttributeType.UV ) );
            this.faces.splice( 0, this.faces.length );

            // First we build the vertices and indices
            this.buildPlane( 'z', 'y', - 1, - 1, depth, height, width_half, 0, widthSegments, heightSegments, depthSegments ); // px
            this.buildPlane( 'z', 'y', 1, - 1, depth, height, - width_half, 1, widthSegments, heightSegments, depthSegments ); // nx
            this.buildPlane( 'x', 'z', 1, 1, width, depth, height_half, 2, widthSegments, heightSegments, depthSegments ); // py
            this.buildPlane( 'x', 'z', 1, - 1, width, depth, - height_half, 3, widthSegments, heightSegments, depthSegments ); // ny
            this.buildPlane( 'x', 'y', 1, - 1, width, height, depth_half, 4, widthSegments, heightSegments, depthSegments ); // pz
            this.buildPlane( 'x', 'y', - 1, - 1, width, height, - depth_half, 5, widthSegments, heightSegments, depthSegments ); // nz

            this.generateNormals();
            this.computeCentroids();
            this.mergeVertices();
            this.computeBoundingBox();
            this.computeBoundingSphere();
        }


		/**
		* Builds one of the cube planes
		*/
        private buildPlane( u: string, v: string, udir: number, vdir: number, width: number, height: number, depth: number, materialIndex: number, widthSegments: number, heightSegments: number, depthSegments: number ) {
            let w, ix, iy,
                gridX = widthSegments,
                gridY = heightSegments;

            const buffers = this.buffers,
                width_half = width / 2,
                height_half = height / 2,

                offset = buffers[ AttributeType.POSITION ].data.length;

            if ( ( u === 'x' && v === 'y' ) || ( u === 'y' && v === 'x' ) ) {
                w = 'z';
            }
            else if ( ( u === 'x' && v === 'z' ) || ( u === 'z' && v === 'x' ) ) {
                w = 'y';
                gridY = depthSegments;

            }
            else if ( ( u === 'z' && v === 'y' ) || ( u === 'y' && v === 'z' ) ) {
                w = 'x';
                gridX = depthSegments;
            }

            let gridX1 = gridX + 1,
                gridY1 = gridY + 1,
                segment_width = width / gridX,
                segment_height = height / gridY,
                normal = new Vec3( 0, 0, 0 );

            normal[ w ] = depth > 0 ? 1 : - 1;

            for ( iy = 0; iy < gridY1; iy++ ) {
                for ( ix = 0; ix < gridX1; ix++ ) {
                    const vector = new Vec3( 0, 0, 0 );
                    vector[ u ] = ( ix * segment_width - width_half ) * udir;
                    vector[ v ] = ( iy * segment_height - height_half ) * vdir;
                    vector[ w ] = depth;

                    // Add the vertex data to the geometry
                    buffers[ AttributeType.POSITION ].data.push( vector );
                }
            }

            for ( iy = 0; iy < gridY; iy++ ) {
                for ( ix = 0; ix < gridX; ix++ ) {
                    // Get the current UV index
                    const uvIndex = buffers[ AttributeType.UV ].data.length;

                    const a = ix + gridX1 * iy;
                    const b = ix + gridX1 * ( iy + 1 );
                    const c = ( ix + 1 ) + gridX1 * ( iy + 1 );
                    const d = ( ix + 1 ) + gridX1 * iy;

                    const uva = new Vec2( ix / gridX, 1 - iy / gridY );
                    const uvb = new Vec2( ix / gridX, 1 - ( iy + 1 ) / gridY );
                    const uvc = new Vec2(( ix + 1 ) / gridX, 1 - ( iy + 1 ) / gridY );
                    const uvd = new Vec2(( ix + 1 ) / gridX, 1 - iy / gridY );

                    // Add some UV data to the geometry's UV buffer
                    buffers[ AttributeType.UV ].data.push( uva, uvb, uvd, uvb, uvc, uvd );

                    // Add the first face3
                    let face = new Face3( a + offset, b + offset, d + offset );
                    face.normal.copy( normal );
                    face.vertexNormals[ 0 ] = normal.clone();
                    face.vertexNormals[ 1 ] = normal.clone();
                    face.vertexNormals[ 2 ] = normal.clone();
                    face.materialIndex = materialIndex;
                    this.faces.push( face );

                    // Set the face indices
                    face.setAttributeIndices( AttributeType.UV, uvIndex, uvIndex + 1, uvIndex + 2 );

                    // Add the second face3
                    face = new Face3( b + offset, c + offset, d + offset );
                    face.normal.copy( normal );
                    face.vertexNormals[ 0 ] = normal.clone();
                    face.vertexNormals[ 1 ] = normal.clone();
                    face.vertexNormals[ 2 ] = normal.clone();
                    face.materialIndex = materialIndex;
                    this.faces.push( face );

                    // Set the face indices
                    face.setAttributeIndices( AttributeType.UV, uvIndex + 3, uvIndex + 4, uvIndex + 5 );
                }
            }
        }
    }
}