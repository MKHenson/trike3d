namespace Trike {
	/**
	* A class to mathematically represent 3D boxes
	*/
    export class Box3 {
        public min: Vec3;
        public max: Vec3;

        private static _v1: Vec3;
        private static _points: Array<Vec3>;

		/**
		* Creates a new box instance
		* @param {Vec3} min [Optional] The minimum point of the box
		* @param {Vec3} max [Optional] The maximum point of the box
		*/
        constructor( min?: Vec3, max?: Vec3 ) {
            this.min = ( min !== undefined ) ? min : new Vec3( Infinity, Infinity, Infinity );
            this.max = ( max !== undefined ) ? max : new Vec3( -Infinity, -Infinity, -Infinity );

            if ( !Box3._v1 ) {
                Box3._v1 = new Vec3();
                Box3._points = [ new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3() ];
            }
        }

		/**
		* Sets the dimensions of the box
		* @param {Vec3} min The minimum point of the box
		* @param {Vec3} max The maximum point of the box
		* @returns {Box3}
		*/
        set( min: Vec3, max: Vec3 ): Box3 {
            this.min.copy( min );
            this.max.copy( max );
            return this;
        }

		/**
		* Adjusts the dimensions of the box by intersecting it with an additional point. This will
		* cause the box to grow.
		* @param {Vec3} point The point to add
		* @returns {Box3}
		*/
        addPoint( point: Vec3 ): Box3 {
            const min = this.min;
            const max = this.max;

            if ( point.x < min.x ) {
                min.x = point.x;
            }
            else if ( point.x > max.x ) {
                max.x = point.x;
            }

            if ( point.y < min.y ) {
                min.y = point.y;
            }
            else if ( point.y > max.y ) {
                max.y = point.y;
            }
            if ( point.z < min.z ) {
                min.z = point.z;
            }
            else if ( point.z > max.z ) {
                max.z = point.z;
            }

            return this;
        }

		/**
		* Adjusts the dimensions of the box by intersecting it with an additional point's xyz. This will
		* cause the box to grow.
		* @param {number} x The x position of the point
		* @param {number} y The y position of the point
		* @param {number} z The z position of the point
		* @returns {Box3}
		*/
        addPointXYZ( x: number, y: number, z: number ): Box3 {
            const min = this.min;
            const max = this.max;

            if ( x < min.x ) {
                min.x = x;
            }
            else if ( x > max.x ) {
                max.x = x;
            }

            if ( y < min.y ) {
                min.y = y;
            }
            else if ( y > max.y ) {
                max.y = y;
            }
            if ( z < min.z ) {
                min.z = z;
            }
            else if ( z > max.z ) {
                max.z = z;
            }

            return this;
        }

		/**
		* Sets the dimensions of this box based on an array of Vec3 points
		* @param {Array<Vec3>} points The points to set dimensions from
		* @returns {Box3}
		*/
        setFromPoints( points: Array<Vec3> ): Box3 {
            if ( points.length > 0 ) {
                const point = points[ 0 ];
                this.min.copy( point );
                this.max.copy( point );

                for ( let i = 1, il = points.length; i < il; i++ ) {
                    this.addPoint( points[ i ] );
                }
            }
            else {
                this.makeEmpty();
            }

            return this;
        }

		/**
		* Sets the dimensions of this box based on a center point and a size vector
		* @param {Vec3} center The center of the box
		* @param {Vec3} size The scalar dimensions width, height, depth
		* @returns {Box3}
		*/
        setFromCenterAndSize( center: Vec3, size: Vec3 ): Box3 {
            const v1 = Box3._v1;
            const halfSize = v1.copy( size ).multiplyScalar( 0.5 );

            this.min.copy( center ).sub( halfSize );
            this.max.copy( center ).add( halfSize );
            return this;
        }

		/**
		* Sets the dimensions of this box based on the vertices of an object and all its mesh children
		* @param {Object3D} object The object to extract dimensions from
		* @returns {Box3}
		*/
        setFromObject( object: Object3D ): Box3 {
            // Computes the world-axis-aligned bounding box of an object (including its children),
            // accounting for both the object's, and childrens', world transforms
            const v1 = Box3._v1;
            const scope = this;

            object.updateWorldMatrix( true );
            this.makeEmpty();

            const nodes = object.getAllChildren();
            for ( let i = 0, len = nodes.length; i < len; i++ ) {
                const node = <Mesh>nodes[ i ];
                if ( node.geometry !== undefined && node.geometry.buffers[ AttributeType.POSITION ].data !== undefined ) {
                    const vertices = node.geometry.buffers[ AttributeType.POSITION ].data;

                    for ( let i = 0, il = vertices.length; i < il; i++ ) {
                        v1.copy( vertices[ i ] );
                        v1.applyMatrix4( node.worldMatrix );
                        scope.expandByPoint( v1 );
                    }
                }
            }

            return this;
        }


		/**
		* Copies the dimensions of box b
		* @param {Box3} b The box to copy from
		* @returns {Box3}
		*/
        copy( b: Box3 ): Box3 {
            this.min.copy( b.min );
            this.max.copy( b.max );
            return this;
        }

		/**
		* Sets the min and max dimensions to Infinity values
		* @returns {Box3}
		*/
        makeEmpty(): Box3 {
            this.min.x = this.min.y = this.min.z = Infinity;
            this.max.x = this.max.y = this.max.z = -Infinity;
            return this;
        }

		/**
		* Checks if the volume of this box is empty
		* @returns {boolean}
		*/
        empty(): boolean {
            // this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes
            return ( this.max.x < this.min.x ) || ( this.max.y < this.min.y ) || ( this.max.z < this.min.z );
        }

		/**
		* Gets the center of this box
		* @param {Vec3} ref [Optional] The optional vector to fill
		* @returns {Vec3}
		*/
        center( ref?: Vec3 ): Vec3 {
            const result = ref || new Vec3();
            return result.addVectors( this.min, this.max ).multiplyScalar( 0.5 );
        }

		/**
		* Gets the scalar sizes of this box as a Vec3. Width in x, height in y, depth in z
		* @param {Vec3} ref [Optional] The optional vector to fill
		* @returns {Vec3}
		*/
        size( ref?: Vec3 ): Vec3 {
            const result = ref || new Vec3();
            return result.subVectors( this.max, this.min );
        }

		/**
		* Expands the box dimensions by a point reference
		* @param {Vec3} point The point to expand to
		* @returns {Box3}
		*/
        expandByPoint( point: Vec3 ): Box3 {
            this.min.min( point );
            this.max.max( point );
            return this;
        }

		/**
		* Expands the box dimensions by a vector reference
		* @param {Vec3} vector The vector to expand to
		* @returns {Box3}
		*/
        expandByVector( vector: Vec3 ): Box3 {
            this.min.sub( vector );
            this.max.add( vector );
            return this;
        }

		/**
		* Expands the box dimensions by a scalar value
		* @param {number} scalar
		* @returns {Box3}
		*/
        expandByScalar( scalar: number ): Box3 {
            this.min.addScalar( -scalar );
            this.max.addScalar( scalar );
            return this;
        }

		/**
		* Checks if this box contains a point p
		* @param {number} scalar
		* @returns {boolean}
		*/
        containsPoint( p: Vec3 ): boolean {
            if ( p.x < this.min.x || p.x > this.max.x ||
                p.y < this.min.y || p.y > this.max.y ||
                p.z < this.min.z || p.z > this.max.z ) {
                return false;
            }
            return true;
        }

		/**
		* Checks if this box contains another box
		* @param {Box3} box
		* @returns {boolean}
		*/
        containsBox( box: Box3 ): boolean {
            if ( ( this.min.x <= box.min.x ) && ( box.max.x <= this.max.x ) &&
                ( this.min.y <= box.min.y ) && ( box.max.y <= this.max.y ) &&
                ( this.min.z <= box.min.z ) && ( box.max.z <= this.max.z ) ) {
                return true;
            }

            return false;
        }


		/**
		* Checks if this box intersects another box
		* @param {Box3} box
		* @returns {boolean}
		*/
        isIntersectionBox( box: Box3 ): boolean {
            // using 6 splitting planes to rule out intersections.
            if ( box.max.x < this.min.x || box.min.x > this.max.x ||
                box.max.y < this.min.y || box.min.y > this.max.y ||
                box.max.z < this.min.z || box.min.z > this.max.z ) {
                return false;
            }

            return true;
        }

		/**
		* Makes sure a point p is within the boundaries of this box
		* @param {Vec3} point
		* @param {Vec3} ref [Optional]
		* @returns {Vec3}
		*/
        clampPoint( p: Vec3, ref?: Vec3 ): Vec3 {
            const result = ref || new Vec3();
            return result.copy( p ).clamp( this.min, this.max );
        }

		/**
		* Gets the distance of this box to a given point p
		* @param {Vec3} p The point to check against
		* @returns {number}
		*/
        distanceToPoint( p: Vec3 ): number {
            const v1 = Box3._v1;
            const clampedPoint = v1.copy( p ).clamp( this.min, this.max );
            return clampedPoint.sub( p ).length();
        }

		/**
		* Gets a bounding sphere of this box
		* @param {Sphere} ref [Optional] A sphere to fill
		* @returns {Sphere}
		*/
        getBoundingSphere( ref?: Sphere ): Sphere {
            const v1 = Box3._v1;
            const result = ref || new Sphere();
            result.center.copy( this.center( v1 ) );
            result.radius = this.size( v1 ).length() * 0.5;

            return result;
        }

		/**
		* Intersects this box with another box b
		* @param {Box3} b
		* @returns {Box3}
		*/
        intersect( b: Box3 ): Box3 {
            this.min.max( b.min );
            this.max.min( b.max );
            return this;
        }

		/**
		* Unions this box with another box b
		* @param {Box3} b
		* @returns {Box3}
		*/
        union( b: Box3 ): Box3 {
            this.min.min( b.min );
            this.max.max( b.max );
            return this;
        }

		/**
		* Applies a matrix to this box's coordinates
		* @param {Matrix4} matrix
		* @returns {Box3}
		*/
        applyMatrix4( matrix: Matrix4 ): Box3 {
            const points = Box3._points;

            // NOTE: I am using a binary pattern to specify all 2^3 combinations below
            points[ 0 ].set( this.min.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 000
            points[ 1 ].set( this.min.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 001
            points[ 2 ].set( this.min.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 010
            points[ 3 ].set( this.min.x, this.max.y, this.max.z ).applyMatrix4( matrix ); // 011
            points[ 4 ].set( this.max.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 100
            points[ 5 ].set( this.max.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 101
            points[ 6 ].set( this.max.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 110
            points[ 7 ].set( this.max.x, this.max.y, this.max.z ).applyMatrix4( matrix );  // 111

            this.makeEmpty();
            this.setFromPoints( points );

            return this;
        }

		/**
		* Moves this box by a given offset
		* @param {Vec3} offset The offset to move the box
		* @returns {Box3}
		*/
        translate( offset: Vec3 ): Box3 {
            this.min.add( offset );
            this.max.add( offset );
            return this;
        }

		/**
		* Checks if this box's dimensions match a reference box b
		* @param {Box3} b The box to check against
		* @returns {boolean}
		*/
        equals( b: Box3 ): boolean {
            return b.min.equals( this.min ) && b.max.equals( this.max );
        }

		/**
		* Copies this box into a new object
		* @returns {boolean}
		*/
        clone(): Box3 {
            return new Box3().copy( this );
        }


    }
}
