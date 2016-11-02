namespace Trike {
	/**
	* Specialized geometry for Point clouds.
	*/
    export class GeometryPoints extends Geometry {
        public pointsScale: number;

        // Cache
        private static _v: Vec3;

        constructor() {
            super();

            this.pointsScale = 1;
            if ( !GeometryPoints._v )
                GeometryPoints._v = new Vec3();
        }

		/**
		* Rebuilds only specific buffers whose data has been modified outside the class.
		* If the number data of elements has changed, then this will throw errors and you should instead flag
		* the geometry for rebuild. Use this function, when the number of items stays the same, but we just need to flush
		* new values.
		* @param {WebGLRenderingContext} gl The webgl context
		*/
        updateDirtyBuffers( gl: WebGLRenderingContext ): boolean {
            const dirty = this.dirtyBuffers;
            let b: GeometryBuffer;

            for ( let i = 0, l = dirty.length; i < l; i++ )
                if ( dirty[ i ].type === AttributeType.POSITION ) {
                    this.computeBoxSphere( true );
                    break;
                }

            return super.updateDirtyBuffers( gl );
        }

		/**
		* Computes the bounding box of the geometry.
		*/
        computeBoundingBox() {
            const sBuffer: GeometryBuffer = this.buffers[ AttributeType.SCALE ];

            // No individual sizes, so just use the BB calculations as normal
            if ( !sBuffer ) {
                super.computeBoundingBox();
                return;
            }

            const pBuffer: GeometryBuffer = this.buffers[ AttributeType.POSITION ];

            // No positions means no bounds
            if ( !pBuffer ) {
                super.computeBoundingBox();
                return;
            }

            this.computeBoxSphere( false );
        }

		/**
		* Computes the bounding sphere of the geometry.
		*/
        computeBoundingSphere() {
            const sBuffer: GeometryBuffer = this.buffers[ AttributeType.SCALE ];

            // No individual sizes, so just use the BB calculations as normal
            if ( !sBuffer ) {
                super.computeBoundingSphere();
                return;
            }

            const pBuffer: GeometryBuffer = this.buffers[ AttributeType.POSITION ];

            // No positions means no bounds
            if ( !pBuffer ) {
                super.computeBoundingSphere();
                return;
            }

            this.computeBoxSphere( true );
        }

		/**
		* Computes the bounding box and / or sphere of the geometry.
		*/
        private computeBoxSphere( computeSphere: boolean ) {
            const sBuffer: GeometryBuffer = this.buffers[ AttributeType.SCALE ];

            if ( !sBuffer ) {
                super.computeBoundingBox();
                this.boundingBox.getBoundingSphere( this.boundingSphere );
                return;
            }

            const pBuffer: GeometryBuffer = this.buffers[ AttributeType.POSITION ];

            const box = this.boundingBox;
            const sphere = this.boundingSphere;
            const vertices: Array<Vec3> = pBuffer.data;
            const scales: Array<number> = sBuffer.data;
            const maxRadiusSq = 0;
            const tempV = GeometryPoints._v;
            let x, y, z, v: Vec3, scale, center,
                particleScale = this.pointsScale;

            if ( vertices.length > 0 ) {
                v = vertices[ 0 ];
                box.min.copy( v );
                box.max.copy( v );

                // Do the box first

                for ( let i = 0, l = vertices.length; i < l; i++ ) {
                    v = vertices[ i ];
                    scale = ( scales[ i ] / 2 ) * particleScale * 0.4; // The 0.4 is an estimate

                    // Create a box around each point
                    x = v.x;
                    y = v.y;
                    z = v.z;

                    box.addPointXYZ( x - scale, y - scale, z - scale );
                    box.addPointXYZ( x + scale, y - scale, z - scale );
                    box.addPointXYZ( x - scale, y + scale, z - scale );
                    box.addPointXYZ( x + scale, y + scale, z - scale );
                    box.addPointXYZ( x - scale, y - scale, z + scale );
                    box.addPointXYZ( x + scale, y - scale, z + scale );
                    box.addPointXYZ( x - scale, y + scale, z + scale );
                    box.addPointXYZ( x + scale, y + scale, z + scale );
                }

                // Now do the sphere
                if ( computeSphere )
                    box.getBoundingSphere( sphere );
            }
            else {
                box.makeEmpty();
                if ( computeSphere )
                    sphere.empty();

                return;
            }
        }
    }
}