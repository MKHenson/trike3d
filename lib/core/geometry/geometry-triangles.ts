namespace Trike {
	/**
	* Use this class to create cube geometry
	*/
    export class GeometryTriangles extends Geometry {
        constructor( triangleData: Array<Vec3>, normalData: Array<Vec3> = null, uvData: Array<Vec2> = null ) {
            super();
            this.build( triangleData, normalData, uvData );
        }

		/**
		* Builds the geometry as a series of triangles
		*/
        build( triangleData: Array<Vec3>, normalData: Array<Vec3> = null, uvData: Array<Vec2> = null ) {
            // Add the buffers
            this.addAttributes( new GeometryBuffer( [], 3, AttributeType.POSITION ) );
            const verteArray = this.buffers[ AttributeType.POSITION ].data;

            // Fill the vertex / position buffer
            for ( let i = 0, len = triangleData.length; i < len; i++ )
                verteArray.push( triangleData[ i ] );


            // Fill normal data if provided
            if ( normalData ) {
                this.addAttributes( new GeometryBuffer( [], 3, AttributeType.NORMAL ) );
                const normalArray = this.buffers[ AttributeType.POSITION ].data;

                for ( let i = 0, len = normalData.length; i < len; i++ )
                    normalArray.push( normalData[ i ] );
            }


            // Fill uv data if provided
            if ( uvData ) {
                this.addAttributes( new GeometryBuffer( [], 2, AttributeType.UV ) );
                const uvArray = this.buffers[ AttributeType.UV ].data;

                for ( let i = 0, len = normalData.length; i < len; i++ )
                    uvArray.push( uvData[ i ] );
            }

            this.computeBoundingBox();
            this.computeBoundingSphere();
        }
    }
}