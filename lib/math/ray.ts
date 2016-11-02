namespace Trike {
	/**
	* A Ray has an origin and direction, and can be thought of as geometric line. We use for things such as collision detection or
	* picking.
	*/
    export class Ray {
        public origin: Vec3;
        public direction: Vec3;

        // Optimization variables
        private _v: Vec3;
        private _diff: Vec3;
        private _edge1: Vec3;
        private _edge2: Vec3;
        private _norm: Vec3;

        constructor( origin: Vec3 = new Vec3(), direction: Vec3 = new Vec3( 0, -1, 0 ) ) {
            this.origin = origin;
            this.direction = direction;

            // Optimization variables
            this._v = new Vec3();
            this._diff = new Vec3();
            this._edge1 = new Vec3();
            this._edge2 = new Vec3();
            this._norm = new Vec3();
        }

        /** Sets the origin and direction internals */
        set( origin: Vec3, direction: Vec3 ): Ray {
            this.origin.copy( origin );
            this.direction.copy( direction );
            return this;
        }

        /** Copies the properties of a Ray */
        copy( ray ): Ray {
            this.origin.copy( ray.origin );
            this.direction.copy( ray.direction );
            return this;
        }

		/**
		* Returns a point on the ray at a distance of t.
		* @param {number} t The distance along the Ray
		* @param {Vec3} optionalTarget If specified this variable is filled instead of the function creating a new one.
		*/
        at( t: number, optionalTarget?: Vec3 ): Vec3 {
            const result: Vec3 = optionalTarget || new Vec3();
            return result.copy( this.direction ).multiplyScalar( t ).add( this.origin );
        }

		/**
		* Moves the origin along the Ray at a point t distance from its original orgin
		*/
        recast( t: number ): Ray {
            const v1 = this._v;
            this.origin.copy( this.at( t, v1 ) );
            return this;
        }

		/**
		* Returns the closest point on the Ray to a point specified by point.
		* @param {Vec3} point The point we testing against
		* @param {Vec3} optionalTarget If specified this variable is filled instead of the function creating a new one.
		*/
        closestPointToPoint( point: Vec3, optionalTarget?: Vec3 ): Vec3 {
            const result = optionalTarget || new Vec3();
            result.subVectors( point, this.origin );
            const directionDistance = result.dot( this.direction );

            // point behind the ray
            if ( directionDistance < 0 )
                return result.copy( this.origin );

            return result.copy( this.direction ).multiplyScalar( directionDistance ).add( this.origin );
        }

		/**
		* Returns the closest distance from the ray to a point
		*/
        distanceToPoint( point: Vec3 ): number {
            const v1: Vec3 = this._v;
            const directionDistance = v1.subVectors( point, this.origin ).dot( this.direction );

            // point behind the ray
            if ( directionDistance < 0 )
                return this.origin.distanceTo( point );

            v1.copy( this.direction ).multiplyScalar( directionDistance ).add( this.origin );
            return v1.distanceTo( point );
        }


		/**
		* from http://www.geometrictools.com/LibMathematics/Distance/Wm5DistRay3Segment3.cpp
		* It returns the min distance between the ray and the line segment defined by v0 and v1
		* It can also set two optional targets :
		* - The closest point on the ray
		* - The closest point on the segment
		*/
        distanceSqToSegment( v0: Vec3, v1: Vec3, optionalPointOnRay?: Vec3, optionalPointOnSegment?: Vec3 ): number {
            const segCenter: Vec3 = v0.clone().add( v1 ).multiplyScalar( 0.5 );
            const segDir: Vec3 = v1.clone().sub( v0 ).normalize();
            const segExtent: number = v0.distanceTo( v1 ) * 0.5;
            const diff: Vec3 = this.origin.clone().sub( segCenter );
            const a01: number = - this.direction.dot( segDir );
            const b0: number = diff.dot( this.direction );
            const b1: number = - diff.dot( segDir );
            const c: number = diff.lengthSq();
            const det: number = Math.abs( 1 - a01 * a01 );
            let s0, s1, sqrDist, extDet;

            if ( det > 0 ) {
                // The ray and segment are not parallel.
                s0 = a01 * b1 - b0;
                s1 = a01 * b0 - b1;
                extDet = segExtent * det;

                if ( s0 >= 0 ) {
                    if ( s1 >= - extDet ) {
                        if ( s1 <= extDet ) {
                            // region 0
                            // Minimum at interior points of ray and segment.
                            const invDet = 1 / det;
                            s0 *= invDet;
                            s1 *= invDet;
                            sqrDist = s0 * ( s0 + a01 * s1 + 2 * b0 ) + s1 * ( a01 * s0 + s1 + 2 * b1 ) + c;
                        }
                        else {
                            // region 1
                            s1 = segExtent;
                            s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
                            sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

                        }
                    }
                    else {
                        // region 5
                        s1 = - segExtent;
                        s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
                        sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;
                    }
                }
                else {
                    if ( s1 <= - extDet ) {
                        // region 4
                        s0 = Math.max( 0, - ( - a01 * segExtent + b0 ) );
                        s1 = ( s0 > 0 ) ? - segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
                        sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;
                    }
                    else if ( s1 <= extDet ) {
                        // region 3
                        s0 = 0;
                        s1 = Math.min( Math.max( - segExtent, - b1 ), segExtent );
                        sqrDist = s1 * ( s1 + 2 * b1 ) + c;
                    }
                    else {
                        // region 2
                        s0 = Math.max( 0, - ( a01 * segExtent + b0 ) );
                        s1 = ( s0 > 0 ) ? segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
                        sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

                    }
                }
            }
            else {
                // Ray and segment are parallel.
                s1 = ( a01 > 0 ) ? - segExtent : segExtent;
                s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
                sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;
            }

            if ( optionalPointOnRay )
                optionalPointOnRay.copy( this.direction.clone().multiplyScalar( s0 ).add( this.origin ) );

            if ( optionalPointOnSegment )
                optionalPointOnSegment.copy( segDir.clone().multiplyScalar( s1 ).add( segCenter ) );


            return sqrDist;
        }

		/**
		* Checks if this ray intersects a sphere
		*/
        isIntersectionSphere( sphere: Sphere ): boolean {
            return this.distanceToPoint( sphere.center ) <= sphere.radius;
        }

		/**
		* Checks if this ray intersects a plane
		*/
        isIntersectionPlane( plane: Plane ): boolean {
            // check if the ray lies on the plane first
            const distToPoint: number = plane.distanceToPoint( this.origin );

            if ( distToPoint === 0 )
                return true;

            const denominator = plane.normal.dot( this.direction );

            if ( denominator * distToPoint < 0 )
                return true

            // ray origin is behind the plane (and is pointing behind it)
            return false;
        }

		/**
		* Returns the closest distance of plane to the origin of this Ray. If the ray is coplanar it will return 0 or null if never intersects the plane.
		*/
        distanceToPlane( plane: Plane ): number {
            const denominator = plane.normal.dot( this.direction );
            if ( denominator === 0 ) {
                // line is coplanar, return origin
                if ( plane.distanceToPoint( this.origin ) === 0 )
                    return 0;

                // Null is preferable to undefined since undefined means.... it is undefined
                return null;
            }

            const t = - ( this.origin.dot( plane.normal ) + plane.constant ) / denominator;

            // Return if the ray never intersects the plane
            return t >= 0 ? t : null;
        }

		/**
		* Gets the point on the plane where the ray intersects it. Returns null if the ray and plane are coplanar
		*/
        intersectPlane( plane: Plane, optionalTarget: Vec3 ): Vec3 {
            const t = this.distanceToPlane( plane );

            if ( !t )
                return null;

            return this.at( t, optionalTarget );
        }

		/**
		* Returns a boolean if the ray is intersecting a box
		*/
        isIntersectionBox( box: Box3 ): boolean {
            const v: Vec3 = this._v;
            return ( this.intersectBox( box, v ) ? true : false );
        }

		/**
		* Gets the point on the box where the ray intersects it. Returns null if the ray does not intersect the box.
		* @param {Box3} box The box we are testing against
		* @param {Vec3} optionalTarget If specified this variable is filled instead of the function creating a new one.
		*/
        intersectBox( box: Box3, optionalTarget?: Vec3 ): Vec3 {
            let tmin: number, tmax: number, tymin: number, tymax: number, tzmin: number, tzmax: number;

            const invdirx: number = 1 / this.direction.x,
                invdiry: number = 1 / this.direction.y,
                invdirz: number = 1 / this.direction.z;

            const origin: Vec3 = this.origin;

            if ( invdirx >= 0 ) {
                tmin = ( box.min.x - origin.x ) * invdirx;
                tmax = ( box.max.x - origin.x ) * invdirx;
            }
            else {
                tmin = ( box.max.x - origin.x ) * invdirx;
                tmax = ( box.min.x - origin.x ) * invdirx;
            }

            if ( invdiry >= 0 ) {
                tymin = ( box.min.y - origin.y ) * invdiry;
                tymax = ( box.max.y - origin.y ) * invdiry;
            }
            else {
                tymin = ( box.max.y - origin.y ) * invdiry;
                tymax = ( box.min.y - origin.y ) * invdiry;
            }

            if ( ( tmin > tymax ) || ( tymin > tmax ) )
                return null;

            // These lines also handle the case where tmin or tmax is NaN
            // (result of 0 * Infinity). x !== x returns true if x is NaN

            if ( tymin > tmin || tmin !== tmin )
                tmin = tymin;

            if ( tymax < tmax || tmax !== tmax )
                tmax = tymax;

            if ( invdirz >= 0 ) {
                tzmin = ( box.min.z - origin.z ) * invdirz;
                tzmax = ( box.max.z - origin.z ) * invdirz;
            }
            else {
                tzmin = ( box.max.z - origin.z ) * invdirz;
                tzmax = ( box.min.z - origin.z ) * invdirz;
            }

            if ( ( tmin > tzmax ) || ( tzmin > tmax ) )
                return null;

            if ( tzmin > tmin || tmin !== tmin )
                tmin = tzmin;

            if ( tzmax < tmax || tmax !== tmax )
                tmax = tzmax;

            // Return point closest to the ray (positive side)
            if ( tmax < 0 )
                return null;

            return this.at( tmin >= 0 ? tmin : tmax, optionalTarget );
        }

		/**
		* Gets a point on a triangle where the ray intersects it. Returns null if the ray does not intersect the triangle.
		* @param {Vec3} a First point on the triangle
		* @param {Vec3} b Second point on the triangle
		* @param {Vec3} c Third point on the triangle
		* @param {boolean} backfaceCulling Defines which way the normal is facing on the triangle
		* @param {Vec3} optionalTarget If specified this variable is filled instead of the function creating a new one.
		*/
        intersectTriangle( a: Vec3, b: Vec3, c: Vec3, backfaceCulling: boolean = true, optionalTarget?: Vec3 ) {
            // Compute the offset origin, edges, and normal.
            const diff: Vec3 = this._diff;
            const edge1: Vec3 = this._edge1;
            const edge2: Vec3 = this._edge2;
            const normal: Vec3 = this._norm;

            // from http://www.geometrictools.com/LibMathematics/Intersection/Wm5IntrRay3Triangle3.cpp
            edge1.subVectors( b, a );
            edge2.subVectors( c, a );
            normal.crossVectors( edge1, edge2 );

            // Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
            // E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
            //   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
            //   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
            //   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
            let DdN = this.direction.dot( normal );
            let sign;

            if ( DdN > 0 ) {
                if ( backfaceCulling )
                    return null;
                sign = 1;
            }
            else if ( DdN < 0 ) {
                sign = - 1;
                DdN = - DdN;
            }
            else
                return null;

            diff.subVectors( this.origin, a );
            const DdQxE2 = sign * this.direction.dot( edge2.crossVectors( diff, edge2 ) );

            // b1 < 0, no intersection
            if ( DdQxE2 < 0 )
                return null;

            const DdE1xQ = sign * this.direction.dot( edge1.cross( diff ) );

            // b2 < 0, no intersection
            if ( DdE1xQ < 0 )
                return null;

            // b1+b2 > 1, no intersection
            if ( DdQxE2 + DdE1xQ > DdN )
                return null;

            // Line intersects triangle, check if ray does.
            const QdN = - sign * diff.dot( normal );

            // t < 0, no intersection
            if ( QdN < 0 )
                return null;

            // Ray intersects triangle.
            return this.at( QdN / DdN, optionalTarget );
        }

		/**
		* Applies a matrix to this ray
		*/
        applyMatrix4( matrix4: Matrix4 ): Ray {
            this.direction.add( this.origin ).applyMatrix4( matrix4 );
            this.origin.applyMatrix4( matrix4 );
            this.direction.sub( this.origin );
            this.direction.normalize();

            return this;
        }

		/**
		* Checks if the ray specified is equal to this one.
		*/
        equals( ray ): boolean {
            return ray.origin.equals( this.origin ) && ray.direction.equals( this.direction );
        }

		/**
		* Clones this ray
		*/
        clone(): Ray {
            return new Ray().copy( this );
        }
    }
}