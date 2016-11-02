namespace Trike {
    export class Plane {
        public normal: Vec3;
        public constant: number;

        private static _v1: Vec3;
        private static _v2: Vec3;

        constructor( normal?: Vec3, constant?: number ) {
            this.normal = ( normal !== undefined ) ? normal : new Vec3( 1, 0, 0 );
            this.constant = ( constant !== undefined ) ? constant : 0;

            if ( !Plane._v1 ) {
                Plane._v1 = new Vec3();
                Plane._v2 = new Vec3();
            }
        }

        set( normal: Vec3, constant: number ): Plane {
            this.normal.copy( normal );
            this.constant = constant;
            return this;
        }

        setComponents( x: number, y: number, z: number, w: number ): Plane {
            this.normal.set( x, y, z );
            this.constant = w;
            return this;
        }

        setFromNormalAndCoplanarPoint( normal: Vec3, point: Vec3 ): Plane {
            this.normal.copy( normal );
            this.constant = - point.dot( this.normal );	// must be this.normal, not normal, as this.normal is normalized
            return this;
        }

        setFromCoplanarPoints( a: Vec3, b: Vec3, c: Vec3 ) {
            const v1 = Plane._v1;
            const v2 = Plane._v2;

            const normal = v1.subVectors( c, b ).cross( v2.subVectors( a, b ) ).normalize();

            // Q: should an error be thrown if normal is zero (e.g. degenerate plane)?
            this.setFromNormalAndCoplanarPoint( normal, a );
            return this;
        }


        copy( plane: Plane ): Plane {
            this.normal.copy( plane.normal );
            this.constant = plane.constant;
            return this;
        }

        normalize(): Plane {
            // Note: will lead to a divide by zero if the plane is invalid.
            const inverseNormalLength = 1.0 / this.normal.length();
            this.normal.multiplyScalar( inverseNormalLength );
            this.constant *= inverseNormalLength;
            return this;
        }

        negate(): Plane {
            this.constant *= -1;
            this.normal.negate();
            return this;
        }

        distanceToPoint( point: Vec3 ): number {
            return this.normal.dot( point ) + this.constant;
        }

        distanceToSphere( sphere: Sphere ): number {
            return this.distanceToPoint( sphere.center ) - sphere.radius;
        }

        projectPoint( point: Vec3, optionalTarget: Vec3 ): Vec3 {
            return this.orthoPoint( point, optionalTarget ).sub( point ).negate();
        }

        orthoPoint( point: Vec3, optionalTarget: Vec3 = new Vec3() ): Vec3 {
            const perpendicularMagnitude = this.distanceToPoint( point );
            const result = optionalTarget;
            return result.copy( this.normal ).multiplyScalar( perpendicularMagnitude );
        }

        isIntersectionLine( line: Line3 ) {
            // Note: this tests if a line intersects the plane, not whether it (or its end-points) are coplanar with it.
            const startSign = this.distanceToPoint( line.start );
            const endSign = this.distanceToPoint( line.end );
            return ( startSign < 0 && endSign > 0 ) || ( endSign < 0 && startSign > 0 );
        }

        intersectLine( line: Line3, optionalTarget: Vec3 = new Vec3() ): Vec3 {
            const v1 = Plane._v1;
            const result = optionalTarget;
            const direction = line.delta( v1 );
            const denominator = this.normal.dot( direction );
            if ( denominator === 0 ) {
                // line is coplanar, return origin
                if ( this.distanceToPoint( line.start ) === 0 )
                    return result.copy( line.start );

                // Unsure if this is the correct method to handle this case.
                return undefined;
            }

            const t = - ( line.start.dot( this.normal ) + this.constant ) / denominator;
            if ( t < 0 || t > 1 ) {
                return undefined;
            }

            return result.copy( direction ).multiplyScalar( t ).add( line.start );
        }


        coplanarPoint( optionalTarget: Vec3 = new Vec3() ): Vec3 {
            const result = optionalTarget;
            return result.copy( this.normal ).multiplyScalar( - this.constant );
        }

        applyMatrix4( matrix: Matrix4, optionalNormalMatrix?: Matrix3 ): Plane {
            const v1 = Plane._v1;
            const v2 = Plane._v2;

            // compute new normal based on theory here:
            // http://www.songho.ca/opengl/gl_normaltransform.html
            optionalNormalMatrix = optionalNormalMatrix || new Matrix3().getNormalMatrix( matrix );
            const newNormal = v1.copy( this.normal ).applyMatrix3( optionalNormalMatrix );

            const newCoplanarPoint = this.coplanarPoint( v2 );
            newCoplanarPoint.applyMatrix4( matrix );
            this.setFromNormalAndCoplanarPoint( newNormal, newCoplanarPoint );
            return this;
        }

        translate( offset: Vec3 ): Plane {
            this.constant = this.constant - offset.dot( this.normal );
            return this;
        }

        equals( plane: Plane ): boolean {
            return plane.normal.equals( this.normal ) && ( plane.constant === this.constant );
        }

        clone(): Plane {
            return new Plane().copy( this );
        }
    }
}
