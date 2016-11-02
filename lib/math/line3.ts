namespace Trike {
    export class Line3 {
        public start: Vec3;
        public end: Vec3;

        constructor( start?: Vec3, end?: Vec3 ) {
            this.start = ( start !== undefined ) ? start : new Vec3();
            this.end = ( end !== undefined ) ? end : new Vec3();
        }

        set( start: Vec3, end: Vec3 ): Line3 {
            this.start.copy( start );
            this.end.copy( end );
            return this;
        }

        copy( line: Line3 ): Line3 {
            this.start.copy( line.start );
            this.end.copy( line.end );
            return this;
        }

        center( optionalTarget ): Vec3 {
            const result = optionalTarget || new Vec3();
            return result.addVectors( this.start, this.end ).multiplyScalar( 0.5 );
        }

        delta( optionalTarget?: Vec3 ): Vec3 {
            const result = optionalTarget || new Vec3();
            return result.subVectors( this.end, this.start );
        }

        distanceSq(): number {
            return this.start.distanceToSquared( this.end );
        }

        distance(): number {
            return this.start.distanceTo( this.end );
        }

        at( t: number, optionalTarget?: Vec3 ): Vec3 {
            const result = optionalTarget || new Vec3();
            return this.delta( result ).multiplyScalar( t ).add( this.start );
        }

        closestPointToPointParameter( point: Vec3, clampToLine: boolean ): number {
            const startP = new Vec3();
            const startEnd = new Vec3();

            startP.subVectors( point, this.start );
            startEnd.subVectors( this.end, this.start );

            const startEnd2 = startEnd.dot( startEnd );
            const startEnd_startP = startEnd.dot( startP );

            let t = startEnd_startP / startEnd2;

            if ( clampToLine ) {
                t = MathUtils.clamp( t, 0, 1 );
            }

            return t;
        }

        closestPointToPoint( point, clampToLine, optionalTarget ): Vec3 {
            const t = this.closestPointToPointParameter( point, clampToLine );
            const result = optionalTarget || new Vec3();
            return this.delta( result ).multiplyScalar( t ).add( this.start );
        }

        applyMatrix4( matrix: Matrix4 ): Line3 {
            this.start.applyMatrix4( matrix );
            this.end.applyMatrix4( matrix );
            return this;
        }

        equals( line ): boolean {
            return line.start.equals( this.start ) && line.end.equals( this.end );
        }

        clone(): Line3 {
            return new Line3().copy( this );
        }
    }
}