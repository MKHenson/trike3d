namespace Trike {
	/**
	* Geometry representing a plane
	*/
    export class GeometryPlane extends Geometry {
        private _width: number;
        private _height: number;
        private _widthSegments: number;
        private _heightSegments: number;

		/**
		* Creates an instance
		* @param {number} width The width of this geometry
		* @param {number} height The height of this geometry
		* @param {number} widthSegments The widthSegments of this geometry
		* @param {number} heightSegments The heightSegments of this geometry
		*/
        constructor( width: number = 1, height: number = 1, widthSegments: number = 1, heightSegments: number = 1 ) {
            super();

            this._width = width;
            this._height = height;
            this._widthSegments = widthSegments;
            this._heightSegments = heightSegments;

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
		* Builds the geometry of the plane. This will cause the geometry to be rebuilt, so use it sparingly.
		*/
        build() {
            const width = this._width;
            const height = this._height;
            const widthSegments = this._widthSegments;
            const heightSegments = this._heightSegments;

            this.addAttributes( new GeometryBuffer( [], 3, AttributeType.POSITION ) );
            this.addAttributes( new GeometryBuffer( [], 3, AttributeType.NORMAL ) );
            this.addAttributes( new GeometryBuffer( [], 2, AttributeType.UV ) );
            this.faces.splice( 0, this.faces.length );

            const vertexData = this.buffers[ AttributeType.POSITION ].data;
            const normData = this.buffers[ AttributeType.NORMAL ].data;
            const uvData = this.buffers[ AttributeType.UV ].data;

            let ix, iz;
            const width_half = width / 2;
            const height_half = height / 2;

            const gridX = widthSegments;
            const gridZ = heightSegments;

            const gridX1 = gridX + 1;
            const gridZ1 = gridZ + 1;

            const segment_width = width / gridX;
            const segment_height = height / gridZ;

            const normal = new Vec3( 0, 0, 1 );

            for ( iz = 0; iz < gridZ1; iz++ ) {
                for ( ix = 0; ix < gridX1; ix++ ) {
                    const x = ix * segment_width - width_half;
                    const y = iz * segment_height - height_half;

                    vertexData.push( new Vec3( x, - y, 0 ) );
                }
            }

            for ( iz = 0; iz < gridZ; iz++ ) {
                for ( ix = 0; ix < gridX; ix++ ) {
                    const a = ix + gridX1 * iz;
                    const b = ix + gridX1 * ( iz + 1 );
                    const c = ( ix + 1 ) + gridX1 * ( iz + 1 );
                    const d = ( ix + 1 ) + gridX1 * iz;

                    const uva = new Vec2( ix / gridX, 1 - iz / gridZ );
                    const uvb = new Vec2( ix / gridX, 1 - ( iz + 1 ) / gridZ );
                    const uvc = new Vec2(( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ );
                    const uvd = new Vec2(( ix + 1 ) / gridX, 1 - iz / gridZ );

                    let face = new Face3( a, b, d );
                    face.normal.copy( normal );
                    this.faces.push( face );
                    normData.push( normal.clone(), normal.clone(), normal.clone() );
                    uvData.push( uva, uvb, uvd );

                    face.attributeIndices[ AttributeType.POSITION ] = [ a, b, d ];
                    face.attributeIndices[ AttributeType.NORMAL ] = [ normData.length - 3, normData.length - 2, normData.length - 1 ];
                    face.attributeIndices[ AttributeType.UV ] = [ uvData.length - 3, uvData.length - 2, uvData.length - 1 ];

                    face = new Face3( b, c, d );
                    face.normal.copy( normal );
                    this.faces.push( face );
                    normData.push( normal.clone(), normal.clone(), normal.clone() );
                    uvData.push( uvb.clone(), uvc, uvd.clone() );

                    face.attributeIndices[ AttributeType.POSITION ] = [ b, c, d ];
                    face.attributeIndices[ AttributeType.NORMAL ] = [ normData.length - 3, normData.length - 2, normData.length - 1 ];
                    face.attributeIndices[ AttributeType.UV ] = [ uvData.length - 3, uvData.length - 2, uvData.length - 1 ];

                }
            }

            this.computeCentroids();
            this.computeBoundingBox();
            this.computeBoundingSphere();
        }
    }
}