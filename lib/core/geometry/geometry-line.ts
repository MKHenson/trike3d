namespace Trike {
	/**
	* Use this class to create cube geometry
	*/
    export class GeometryLine extends Geometry {
        public lineMode: LineMode;
        public dashes: boolean;


        constructor( points: Array<Vec3>, dashes: boolean = false, mode: LineMode = LineMode.HeadToTail ) {
            super();
            this.build( points, dashes );
            this.dashes = dashes;
            this.lineMode = mode;

        }

		/**
		* Builds the geometry of the cube. This will cause the geometry to be rebuilt, so use it sparingly.
		*/
        build( points: Array<Vec3>, dashes: boolean = false ) {
            // Add the buffers
            this.addAttributes( new GeometryBuffer( [], 3, AttributeType.POSITION ) );
            if ( dashes )
                this.addAttributes( new GeometryBuffer( [], 1, AttributeType.CUSTOM_1 ) );
            else
                this.removeAttribute( AttributeType.CUSTOM_1 );

            // Fill the vertex / position buffer
            const vertexArray: Array<Vec3> = this.buffers[ AttributeType.POSITION ].data;
            for ( let i = 0, len = points.length; i < len; i++ )
                vertexArray.push( points[ i ] );

            // If we are using dashes - we need to store the distance of each vert to its neighbour
            if ( dashes ) {
                const tempVec: Vec3 = new Vec3();
                const distanceArray: Array<number> = this.buffers[ AttributeType.CUSTOM_1 ].data;

                if ( this.lineMode === LineMode.HeadToTail || this.lineMode === LineMode.HeadToTailClosed ) {
                    distanceArray.push( 0 );  // the length so far starts at 0
                    for ( let ii = 1; ii < vertexArray.length; ++ii )
                        distanceArray.push( distanceArray[ ii - 1 ] + tempVec.subVectors( vertexArray[ ii - 1 ], vertexArray[ ii ] ).length() );
                }
                else {
                    for ( let ii = 0; ii < vertexArray.length; ii += 2 ) {
                        distanceArray.push( 0 );
                        if ( ii + 1 < vertexArray.length )
                            distanceArray.push( tempVec.subVectors( vertexArray[ ii ], vertexArray[ ii + 1 ] ).length() );
                    }
                }
            }

            this.computeBoundingBox();
            this.computeBoundingSphere();
        }
    }
}