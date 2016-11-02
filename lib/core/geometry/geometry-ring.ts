namespace Trike {
	/**
	* Use this class to create a ring geometry
	*/
    export class GeometryRing extends Geometry {
        private _innerRadius: number;
        private _outerRadius: number;
        private _thetaSegments: number;
        private _phiSegments: number;
        private _thetaStart: number;
        private _thetaLength: number;


        constructor( innerRadius: number = 1, outerRadius: number = 2, thetaSegments: number = 8, phiSegments: number = 8, thetaStart: number = 0, thetaLength: number = Math.PI * 2 ) {
            super();

            this._innerRadius = innerRadius;
            this._outerRadius = outerRadius;
            this._thetaSegments = thetaSegments;
            this._phiSegments = phiSegments;
            this._thetaStart = thetaStart;
            this._thetaLength = thetaLength;

            this.build();
        }

		/**
		* Gets or sets the theta length value of this ring. The causes the geometry to be re-built so
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
		* Gets or sets the start theta value of this ring. The causes the geometry to be re-built so
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
		* Gets or sets the number of phi segments of this ring. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        phiSegments( val?: number ): number {
            if ( val === undefined ) return this._phiSegments;
            if ( val < 1 ) val = 1;
            this._phiSegments = val;
            this.build();
        }

		/**
		* Gets or sets the number of theta segments of this ring. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        thetaSegments( val?: number ): number {
            if ( val === undefined ) return this._thetaSegments;
            if ( val < 3 ) val = 3;
            this._thetaSegments = val;
            this.build();
        }

		/**
		* Gets or sets the outer radius of this ring. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        outerRadius( val?: number ): number {
            if ( val === undefined ) return this._outerRadius;
            if ( val === 0 ) val = 0.0001;
            this._outerRadius = val;
            this.build();
        }

		/**
		* Gets or sets the inner radius of this ring. The causes the geometry to be re-built so
		* use it sparingly
		* @param {number} val [Optional]
		* @returns {number}
		*/
        innerRadius( val?: number ): number {
            if ( val === undefined ) return this._innerRadius;
            if ( val === 0 ) val = 0.0001;
            this._innerRadius = val;
            this.build();
        }

		/**
		* Builds the geometry of the cube. This will cause the geometry to be rebuilt, so use it sparingly.
		*/
        build() {
            const innerRadius = this._innerRadius;
            const outerRadius = this._outerRadius;
            const thetaSegments = this._thetaSegments;
            const phiSegments = this._phiSegments;
            const thetaStart = this._thetaStart;
            const thetaLength = this._thetaLength;
            const buffers = this.buffers;

            // Add the buffers
            this.addAttributes( new GeometryBuffer( [], 3, AttributeType.POSITION ) );
            this.addAttributes( new GeometryBuffer( [], 2, AttributeType.UV ) );
            this.addAttributes( new GeometryBuffer( [], 3, AttributeType.NORMAL ) );
            this.faces.splice( 0, this.faces.length );

            let i: number,
                o: number,
                radius: number = innerRadius;
            const uvs: Array<Vec2> = [],
                radiusStep: number = ( ( outerRadius - innerRadius ) / phiSegments );

            for ( i = 0; i < phiSegments + 1; i++ ) { // concentric circles inside ring

                for ( o = 0; o < thetaSegments + 1; o++ ) { // number of segments per circle

                    const vertex = new Vec3();
                    const segment = thetaStart + o / thetaSegments * thetaLength;
                    vertex.x = radius * Math.cos( segment );
                    vertex.y = radius * Math.sin( segment );

                    buffers[ AttributeType.POSITION ].data.push( vertex );
                    uvs.push( new Vec2(( vertex.x / outerRadius + 1 ) / 2, ( vertex.y / outerRadius + 1 ) / 2 ) );
                }

                radius += radiusStep;
            }

            const n = new Vec3( 0, 0, 1 );

            // concentric circles inside ring
            for ( i = 0; i < phiSegments; i++ ) {
                const thetaSegment: number = i * ( thetaSegments + 1 );

                // number of segments per circle
                for ( o = 0; o < thetaSegments; o++ ) {
                    // Get the current UV index
                    const uvIndex = buffers[ AttributeType.UV ].data.length;
                    const normalIndex = buffers[ AttributeType.NORMAL ].data.length;

                    const segment = o + thetaSegment;

                    let v1: number = segment;
                    let v2: number = segment + thetaSegments + 1;
                    let v3: number = segment + thetaSegments + 2;

                    // Add the faces
                    let face: Face3 = new Face3( v1, v2, v3 );
                    buffers[ AttributeType.NORMAL ].data.push( n.clone(), n.clone(), n.clone() );
                    face.vertexNormals[ 0 ] = n.clone();
                    face.vertexNormals[ 1 ] = n.clone();
                    face.vertexNormals[ 2 ] = n.clone();
                    this.faces.push( face );

                    // Add some UV data to the geometry's UV buffer
                    buffers[ AttributeType.UV ].data.push( uvs[ v1 ].clone(), uvs[ v2 ].clone(), uvs[ v3 ].clone() );

                    // Set the face indices
                    face.setAttributeIndices( AttributeType.NORMAL, normalIndex, normalIndex + 1, normalIndex + 2 );
                    face.setAttributeIndices( AttributeType.UV, uvIndex, uvIndex + 1, uvIndex + 2 );


                    v1 = segment;
                    v2 = segment + thetaSegments + 2;
                    v3 = segment + 1;

                    // Add second the face
                    face = new Face3( v1, v2, v3 );
                    buffers[ AttributeType.NORMAL ].data.push( n.clone(), n.clone(), n.clone() );
                    face.vertexNormals[ 0 ] = n.clone();
                    face.vertexNormals[ 1 ] = n.clone();
                    face.vertexNormals[ 2 ] = n.clone();
                    this.faces.push( face );

                    // Add some UV data to the geometry's UV buffer
                    buffers[ AttributeType.UV ].data.push( uvs[ v1 ].clone(), uvs[ v2 ].clone(), uvs[ v3 ].clone() );

                    // Set the face indices
                    face.setAttributeIndices( AttributeType.NORMAL, normalIndex + 3, normalIndex + 4, normalIndex + 5 );
                    face.setAttributeIndices( AttributeType.UV, uvIndex + 3, uvIndex + 4, uvIndex + 5 );
                }
            }

            this.computeCentroids();
            this.computeFaceNormals();
            this.computeBoundingBox();
            this.computeBoundingSphere();
        }
    }
}