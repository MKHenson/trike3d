namespace Trike {
	/**
	* A class to mathematically represent 3D spheres
	*/
    export class Sphere {
        public center: Vec3;
        public radius: number;

        private static _box: Box3;

		/**
		* Creates a new Sphere instance
		* @param {Vec3} center [Optional] The center of the sphere
		* @param {number} radius [Optional] The radius of the sphere
		*/
        constructor( center?: Vec3, radius?: number ) {
            this.center = ( center !== undefined ) ? center : new Vec3();
            this.radius = ( radius !== undefined ) ? radius : 0;
            if ( !Sphere._box )
                Sphere._box = new Box3();

        }

		/**
		* Sets the dimensions of this sphere
		* @param {Vec3} center The center of the sphere
		* @param {number} radius The radius of the sphere
		* @returns {Sphere}
		*/
        set( center: Vec3, radius: number ): Sphere {
            this.center.copy( center );
            this.radius = radius;
            return this;
        }



		/**
		* Sets the dimensions of this sphere based on an array of Vec3 points
		* @param {Array<Vec3>} points The points to set dimensions from
		* @param {Vec3} optionalCenter [Optional] The center of the sphere
		* @returns {Sphere}
		*/
        setFromPoints( points: Array<Vec3>, optionalCenter?: Vec3 ): Sphere {
            const box = Sphere._box;

            const center = this.center;
            if ( optionalCenter !== undefined ) {
                center.copy( optionalCenter );
            }
            else {
                box.setFromPoints( points ).center( center );
            }

            let maxRadiusSq = 0;
            for ( let i = 0, il = points.length; i < il; i++ ) {
                maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( points[ i ] ) );
            }

            this.radius = Math.sqrt( maxRadiusSq );
            return this;
        }

		/**
		* Copies the dimensions of the given sphere
		* @param {Sphere} sphere The sphere to copy from
		* @returns {Sphere}
		*/
        copy( sphere: Sphere ): Sphere {
            this.center.copy( sphere.center );
            this.radius = sphere.radius;
            return this;
        }

		/**
		* Checks if the sphere radius is less than zero
		* @returns {boolean}
		*/
        empty(): boolean {
            return ( this.radius <= 0 );
        }

		/**
		* Checks if the sphere contains a point in space
		* @param {Vec3} point The point to check
		* @returns {boolean}
		*/
        containsPoint( point: Vec3 ): boolean {
            return ( point.distanceToSquared( this.center ) <= ( this.radius * this.radius ) );
        }

		/**
		* Gets the distance of this sphere to a given point p
		* @param {Vec3} p The point to check against
		* @returns {number}
		*/
        distanceToPoint( p: Vec3 ): number {
            return ( p.distanceTo( this.center ) - this.radius );
        }

		/**
		* Checks if a sphere intersects this sphere's dimensions
		* @param {Sphere} sphere The sphere to check against
		* @returns {boolean}
		*/
        intersectsSphere( sphere: Sphere ): boolean {
            const radiusSum = this.radius + sphere.radius;
            return sphere.center.distanceToSquared( this.center ) <= ( radiusSum * radiusSum );
        }

		/**
		* Makes sure a point p is within the boundaries of this sphere
		* @param {Vec3} p
		* @param {Vec3} ref [Optional]
		* @returns {Vec3}
		*/
        clampPoint( p: Vec3, ref?: Vec3 ): Vec3 {
            const deltaLengthSq = this.center.distanceToSquared( p );

            const result = ref || new Vec3();
            result.copy( p );

            if ( deltaLengthSq > ( this.radius * this.radius ) ) {
                result.sub( this.center ).normalize();
                result.multiplyScalar( this.radius ).add( this.center );
            }

            return result;
        }

		/**
		* Gets a bounding box that encompasses the dimensions of this sphere
		* @param {Box3} ref [Optional] Fills this box instead of creating a new one
		* @returns {Box3}
		*/
        getBoundingBox( ref?: Box3 ): Box3 {
            const box: Box3 = ref || new Box3();
            box.set( this.center, this.center );
            box.expandByScalar( this.radius );
            return box;
        }

		/**
		* Applies a matrix to this sphere's coordinates
		* @param {Matrix4} matrix
		* @returns {Sphere}
		*/
        applyMatrix4( matrix: Matrix4 ): Sphere {
            this.center.applyMatrix4( matrix );
            this.radius = this.radius * matrix.getMaxScaleOnAxis();
            return this;
        }

		/**
		* Moves this sphere by a given offset
		* @param {Vec3} offset The offset to move the sphere
		* @returns {Sphere}
		*/
        translate( offset: Vec3 ): Sphere {
            this.center.add( offset );
            return this;
        }

		/**
		* Checks if this sphere's dimensions match a reference sphere s
		* @param {Sphere} sphere The sphere to check against
		* @returns {boolean}
		*/
        equals( s: Sphere ): boolean {
            return s.center.equals( this.center ) && ( s.radius === this.radius );
        }

		/**
		* Copies this sphere into a new object
		* @returns {Sphere}
		*/
        clone(): Sphere {
            return new Sphere().copy( this );
        }
    }
}