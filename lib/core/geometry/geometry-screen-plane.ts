namespace Trike {
	/**
	* Use this class to create planar geometry used in screen quads.
	* This adds the indices of the far corners of the camera frustum (The actual verts are
	* passed as 4 component vec3 array as a uniform)
	*/
    export class GeometryScreenPlane extends GeometryPlane {
        constructor() {
            super( 2, 2, 1, 1 );
        }

		/**
		* Builds the geometry of the plane. This will cause the geometry to be rebuilt, so use it sparingly.
		*/
        build() {
            super.build();

            // Add screen indices
            this.addAttributes( new GeometryBuffer( [ 0, 1, 2, 3 ], 1, AttributeType.SCREEN_CORNER_INDEX ) );
            this.faces[ 0 ].attributeIndices[ AttributeType.SCREEN_CORNER_INDEX ] = [ 0, 2, 1 ];
            this.faces[ 1 ].attributeIndices[ AttributeType.SCREEN_CORNER_INDEX ] = [ 2, 3, 1 ];

            // Add surface data (which basically represent screen ratios)
            this.addAttributes( new GeometryBuffer( [
                new Vec2( -0.5, 0.5 ),
                new Vec2( 0.5, 0.5 ),
                new Vec2( -0.5, -0.5 ),
                new Vec2( 0.5, -0.5 ) ], 2, AttributeType.SURFACE ) );
            this.faces[ 0 ].attributeIndices[ AttributeType.SURFACE ] = [ 0, 2, 1 ];
            this.faces[ 1 ].attributeIndices[ AttributeType.SURFACE ] = [ 2, 3, 1 ];

            this.computeBoundingBox();
            this.computeBoundingSphere();
        }
    }
}