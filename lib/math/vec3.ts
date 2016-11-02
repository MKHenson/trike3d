namespace Trike {
	/**
	* A simple 3D Vector
	*/
    export class Vec3 {
        public x: number;
        public y: number;
        public z: number;
        public elements: Float32Array;

        private static _m: Matrix4;
        private static _quat: Quat;
        private static _v1: Vec3;

		/**
		* @returns {Vec3} Common up vector (0, 1, 0)
		*/
        public static UP: Vec3;
		/**
		* @returns {Vec3} Common X vector (1, 0, 0)
		*/
        public static X: Vec3;
		/**
		* @returns {Vec3} Common Y vector (0, 1, 0)
		*/
        public static Y: Vec3;
		/**
		* @returns {Vec3} Common Z vector (0, 0, 1)
		*/
        public static Z: Vec3;

		/**
		* Creates a new vector instance
		* @param {number} x [Optional] The x value
		* @param {number} y [Optional] The y value
		* @param {number} z [Optional] The z value
		*/
        constructor( x?: number, y?: number, z?: number ) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            this.elements = new Float32Array( 3 );

            if ( !Vec3._quat ) {
                Vec3._quat = new Quat();
                Vec3._m = new Matrix4();
                Vec3._v1 = new Vec3();
                Vec3.UP = new Vec3( 0, 1, 0 );
                Vec3.X = new Vec3( 1, 0, 0 );
                Vec3.Y = new Vec3( 0, 1, 0 );
                Vec3.Z = new Vec3( 0, 0, 1 );
            }
        }

		/**
		* Gets the Float32Array representation of this vector
		* @returns {Float32Array}
		*/
        get getElements(): Float32Array {
            const elm = this.elements;
            elm[ 0 ] = this.x;
            elm[ 1 ] = this.y;
            elm[ 2 ] = this.z;
            return elm;
        }

		/**
		* Sets the components of this vector
		* @param {number} x The x value
		* @param {number} y The y value
		* @param {number} z The z value
		* @returns {Vec3}
		*/
        set( x: number, y: number, z: number ): Vec3 {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }

		/**
		* Sets the x component of this vector
		* @param {number} x The x value
		* @returns {Vec3}
		*/
        setX( x: number ): Vec3 {
            this.x = x;
            return this;
        }

		/**
		* Sets the y component of this vector
		* @param {number} y The y value
		* @returns {Vec3}
		*/
        setY( y: number ): Vec3 {
            this.y = y;
            return this;
        }

		/**
		* Sets the z component of this vector
		* @param {number} z The z value
		* @returns {Vec3}
		*/
        setZ( z: number ): Vec3 {
            this.z = z;
            return this;
        }

		/**
		* Sets one of the vectors values by index.
		* @param {number} index The index to set, 0 = x, 1 = y, 2 = z
		* @param {number} value The new value
		* @returns {Vec3}
		*/
        setComponent( index: number, value: number ): Vec3 {
            switch ( index ) {
                case 0: this.x = value; break;
                case 1: this.y = value; break;
                case 2: this.z = value; break;
                default: throw new Error( 'index is out of range: ' + index );
            }

            return this;
        }

		/**
		* Gets one of the vectors values by index.
		* @param {number} index The index to get, 0 = x, 1 = y, 2 = z
		* @returns {number}
		*/
        getComponent( index: number ): number {
            switch ( index ) {
                case 0: return this.x;
                case 1: return this.y;
                case 2: return this.z;
                default: throw new Error( 'index is out of range: ' + index );
            }
        }

		/**
		* Copies the values of v into this vector
		* @param {Vec3} v The vector to copy from
		* @returns {Vec3}
		*/
        copy( v: Vec3 ): Vec3 {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            return this;
        }

		/**
		* Add the vector v and sets the result on this vector's components
		* @param {Vec3} v The vector to add from
		* @returns {Vec3}
		*/
        add( v: Vec3 ): Vec3 {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        }

		/**
		* Add the scalar s and sets the result on this vector
		* @param {number} s The scalar value to add
		* @returns {Vec3}
		*/
        addScalar( s: number ): Vec3 {
            this.x += s;
            this.y += s;
            this.z += s;
            return this;
        }

		/**
		* Adds the vectors a and b and sets the result on this vector
		* @param {Vec3} a The first vector
		* @param {Vec3} b The second vector
		* @returns {Vec3}
		*/
        addVectors( a: Vec3, b: Vec3 ): Vec3 {
            this.x = a.x + b.x;
            this.y = a.y + b.y;
            this.z = a.z + b.z;
            return this;
        }

		/**
		* Subtracts the vectors v and sets the result on this vector
		* @param {Vec3} v The vector to subtract
		* @returns {Vec3}
		*/
        sub( v: Vec3 ): Vec3 {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            return this;
        }

		/**
		* Subtracts the vectors a and b and sets the result on this vector
		* @param {Vec3} a The first vector
		* @param {Vec3} b The second vector
		* @returns {Vec3}
		*/
        subVectors( a: Vec3, b: Vec3 ): Vec3 {
            this.x = a.x - b.x;
            this.y = a.y - b.y;
            this.z = a.z - b.z;

            return this;
        }

		/**
		* Multiplies the vector v with this vector
		* @param {Vec3} v The vector
		* @returns {Vec3}
		*/
        multiply( v: Vec3 ): Vec3 {
            this.x *= v.x;
            this.y *= v.y;
            this.z *= v.z;
            return this;
        }

		/**
		* Multiplies the scalar s with this vector
		* @param {number} s The scalar to multiply
		* @returns {Vec3}
		*/
        multiplyScalar( s: number ): Vec3 {
            this.x *= s;
            this.y *= s;
            this.z *= s;
            return this;
        }

		/**
		* Multiplies the vectors a and b and sets the result on this vector
		* @param {Vec3} a The first vector
		* @param {Vec3} b The second vector
		* @returns {Vec3}
		*/
        multiplyVectors( a: Vec3, b: Vec3 ): Vec3 {
            this.x = a.x * b.x;
            this.y = a.y * b.y;
            this.z = a.z * b.z;
            return this;
        }

		/**
		* Transforms this point with the matrix m.
		* @param {Matrix3} m The matrix to apply
		* @returns {Vec3}
		*/
        applyMatrix3( m: Matrix3 ): Vec3 {
            const x = this.x;
            const y = this.y;
            const z = this.z;

            const e = m.elements;
            this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
            this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
            this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;
            return this;
        }

		/**
		* Transforms this point with the matrix m
		* @param {Matrix4} m The matrix to apply
		* @returns {Vec3}
		*/
        applyMatrix4( m: Matrix4 ): Vec3 {
            // input: THREE.Matrix4 affine matrix
            const x = this.x, y = this.y, z = this.z;
            const e = m.elements;

            this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ];
            this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ];
            this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ];

            return this;
        }


		/**
		* Projects a 3d vector to homogenized screen space. I.e. the point will be from
		* x: { -1 to 1 ) and y { -1 to 1 }.
		* @param {Camera} camera The camera we are projecting the vector with
		* @param {boolean} rebuildCameraMatrices If true, the matrices will be built and not use the cache variables of the camera
		* @returns {Vec3}
		*/
        project( camera: Camera, rebuildCameraMatrices: boolean = false ): Vec3 {
            const m = Vec3._m;

            // Get the projection matrix of the object
            if ( rebuildCameraMatrices )
                m.multiplyMatrices( camera.projectionMatrix, m.getInverse( camera.worldMatrix ) );
            else
                m.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );

            return this.applyProjection( m );
        }


		/**
		* Unprojects a 2d vector from homogenized screen space back to 3D. I.e. the point will be from
		* x: { -1 to 1 ) and y { -1 to 1 } to Vec3
		* @param {Camera} camera The camera we are projecting the vector with
		* @param {boolean} rebuildCameraMatrices If true, the matrices will be built and not use the cache variables of the camera
		* @returns {Vec3}
		*/
        unproject( camera: Camera ): Vec3 {
            const m = Vec3._m;
            m.multiplyMatrices( camera.worldMatrix, camera.projectionInverseMatrix );
            return this.applyProjection( m );
        }

		/**
		* Projects a 3d vector to homogenized screen space. I.e. the point will be from
		* x: { -1 to 1 ) and y { -1 to 1 }.
		* @param {Matrix4} m A projection matrix to apply
		* @returns {Vec3}
		*/
        applyProjection( m: Matrix4 ): Vec3 {
            const x = this.x, y = this.y, z = this.z;

            const e = m.elements;
            const d = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] ); // perspective divide

            this.x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * d;
            this.y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * d;
            this.z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * d;

            return this;
        }


		/**
		* Multiplies this vector with a quaternian q
		* @param {Quat} q The quaternian to apply
		* @returns {Vec3}
		*/
        applyQuaternion( q: Quat ): Vec3 {
            const x = this.x;
            const y = this.y;
            const z = this.z;

            const qx = q.x;
            const qy = q.y;
            const qz = q.z;
            const qw = q.w;

            // calculate quat * vector
            const ix = qw * x + qy * z - qz * y;
            const iy = qw * y + qz * x - qx * z;
            const iz = qw * z + qx * y - qy * x;
            const iw = -qx * x - qy * y - qz * z;

            // calculate result * inverse quat
            this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

            return this;
        }

		/**
		* Transforms this vector by the rotation values in the Matrix m.
		* This should only be used to translate directions - to transform a position point use applyMatrix4
		* @param {Matrix4} m The matrix we are using to transform this direction
		* @returns {Vec3}
		*/
        transformDirection( m: Matrix4 ): Vec3 {
            // input: THREE.Matrix4 affine matrix
            // vector interpreted as a direction
            const x = this.x, y = this.y, z = this.z;
            const e = m.elements;

            this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z;
            this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z;
            this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;
            this.normalize();
            return this;
        }

		/**
		* Divides this vector by the vector v
		* @param {Vec3} v The vector to divide by
		* @returns {Vec3}
		*/
        divide( v: Vec3 ): Vec3 {
            this.x /= v.x;
            this.y /= v.y;
            this.z /= v.z;
            return this;
        }

		/**
		* Divides this vector by the scalar s
		* @param {number} s The scalar to divide by
		* @returns {Vec3}
		*/
        divideScalar( s: number ): Vec3 {
            if ( s ) {
                this.x /= s;
                this.y /= s;
                this.z /= s;
            }
            else {
                this.x = 0;
                this.y = 0;
                this.z = 0;
            }

            return this;
        }


		/**
		* Sets this vector's values to the lowest between itself and the reference vector v
		* @param {Vec3} v The reference vector
		* @returns {Vec3}
		*/
        min( v: Vec3 ): Vec3 {
            if ( this.x > v.x )
                this.x = v.x;

            if ( this.y > v.y )
                this.y = v.y;

            if ( this.z > v.z )
                this.z = v.z;

            return this;
        }

		/**
		* Sets this vector's values to the highest between itself and the reference vector v
		* @param {Vec3} v The reference vector
		* @returns {Vec3}
		*/
        max( v: Vec3 ): Vec3 {
            if ( this.x < v.x )
                this.x = v.x;

            if ( this.y < v.y )
                this.y = v.y;

            if ( this.z < v.z )
                this.z = v.z;

            return this;
        }

		/**
		* Clamps this vector to a min and max set of values. This function assumes min < max, if this assumption isn't true it will not operate correctly
		* @param {Vec3} min The min reference vector
		* @param {Vec3} max The max reference vector
		* @returns {Vec3}
		*/
        clamp( min: Vec3, max: Vec3 ): Vec3 {
            if ( this.x < min.x )
                this.x = min.x;
            else if ( this.x > max.x )
                this.x = max.x;

            if ( this.y < min.y )
                this.y = min.y;
            else if ( this.y > max.y )
                this.y = max.y;

            if ( this.z < min.z )
                this.z = min.z;
            else if ( this.z > max.z )
                this.z = max.z;

            return this;
        }

		/**
		* Inverts this vector, essentially multiplying it by -1
		* @returns {Vec3}
		*/
        negate(): Vec3 {
            return this.multiplyScalar( - 1 );
        }

		/**
		* Returns the dot product, or scalar value, of this vector and the one passed to it. You can think of the dot as a projection
		* of the one vector onto the other. See here for a visualization: http://www.falstad.com/dotproduct/
		* @param {Vec3} v The vector to dot against
		* @returns {number}
		*/
        dot( v: Vec3 ): number {
            return this.x * v.x + this.y * v.y + this.z * v.z;
        }

		/**
		* Returns the length squared of this vector
		* @returns {number}
		*/
        lengthSq(): number {
            return this.x * this.x + this.y * this.y + this.z * this.z;
        }

		/**
		* Returns the length of this vector
		* @returns {number}
		*/
        length(): number {
            return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
        }

        lengthManhattan(): number {
            return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );
        }

		/**
		* Normalizes this vector. This essentially makes each component of the vector a value between 0 and 1
		* @returns {Vec3}
		*/
        normalize(): Vec3 {
            return this.divideScalar( this.length() );
        }

		/**
		* Enlarges the vector by the scalar value l
		* @param {number} l The scalar value
		* @returns {Vec3}
		*/
        setLength( l: number ) {
            const oldLength = this.length();

            if ( oldLength !== 0 && l !== oldLength )
                this.multiplyScalar( l / oldLength );

            return this;
        }

		/**
		* Interpolates the values of this vector towards its reference v. The interpolation is calculated by
		* the weight value of alpha
		* @param {Vec3} v The vector to interpolate towards
		* @param {number} alpha The weight (typically from 0 to 1)
		* @returns {Vec3}
		*/
        lerp( v: Vec3, alpha: number ): Vec3 {
            this.x += ( v.x - this.x ) * alpha;
            this.y += ( v.y - this.y ) * alpha;
            this.z += ( v.z - this.z ) * alpha;
            return this;
        }

		/**
		* Returns the cross product of this vector with the vector v. Cross product vectors are typically at perpendicular to both components of the
		* vectors you provide.
		* @param {Vec3} v The vector to cross with
		* @returns {Vec3}
		*/
        cross( v: Vec3 ): Vec3 {
            const x = this.x, y = this.y, z = this.z;

            this.x = y * v.z - z * v.y;
            this.y = z * v.x - x * v.z;
            this.z = x * v.y - y * v.x;

            return this;
        }

		/**
		* Sets the cross product of two vectors on this vector and returns the result.
		* Cross product vectors are typically at perpendicular to both components of the
		* vectors you provide.
		* @param {Vec3} a The first vector to cross with
		* @param {Vec3} b The second vector to cross with
		* @returns {Vec3}
		*/
        crossVectors( a: Vec3, b: Vec3 ): Vec3 {
            const ax = a.x, ay = a.y, az = a.z;
            const bx = b.x, by = b.y, bz = b.z;

            this.x = ay * bz - az * by;
            this.y = az * bx - ax * bz;
            this.z = ax * by - ay * bx;

            return this;
        }

		/**
		* Calculates the angle between this vector and the reference v
		* @param {Vec3} v The vector reference
		* @returns {number}
		*/
        angleTo( v: Vec3 ): number {
            const theta = this.dot( v ) / ( this.length() * v.length() );

            // clamp, to handle numerical problems
            return Math.acos( Math.min( Math.max( theta, -1 ), 1 ) );
        }

		/**
		* Returns the distance from this vector to the one reference v
		* @param {Vec3} v The vector reference
		* @returns {number}
		*/
        distanceTo( v: Vec3 ): number {
            return Math.sqrt( this.distanceToSquared( v ) );
        }

		/**
		* Returns the distance squared from this vector to the reference v
		* @param {Vec3} v The vector reference
		* @returns {number}
		*/
        distanceToSquared( v: Vec3 ): number {
            const dx = this.x - v.x;
            const dy = this.y - v.y;
            const dz = this.z - v.z;
            return dx * dx + dy * dy + dz * dz;
        }

		/**
		* Extracts the position data from a matrix 4 and sets those values on this vector
		* @param {Matrix4} m The matrix to extract from
		* @returns {Vec3}
		*/
        getPositionFromMatrix( m: Matrix4 ): Vec3 {
            this.x = m.elements[ 12 ];
            this.y = m.elements[ 13 ];
            this.z = m.elements[ 14 ];

            return this;
        }

		/**
		* Extracts the scale data from a matrix 4 and sets those values on this vector
		* @param {Matrix4} m The matrix to extract from
		* @returns {Vec3}
		*/
        getScaleFromMatrix( m: Matrix4 ): Vec3 {
            const sx = this.set( m.elements[ 0 ], m.elements[ 1 ], m.elements[ 2 ] ).length();
            const sy = this.set( m.elements[ 4 ], m.elements[ 5 ], m.elements[ 6 ] ).length();
            const sz = this.set( m.elements[ 8 ], m.elements[ 9 ], m.elements[ 10 ] ).length();

            this.x = sx;
            this.y = sy;
            this.z = sz;

            return this;
        }

        getColumnFromMatrix( index: number, matrix: Matrix4 ) {
            const offset = index * 4;
            const me = matrix.elements;
            this.x = me[ offset ];
            this.y = me[ offset + 1 ];
            this.z = me[ offset + 2 ];
            return this;
        }

		/**
		* Checks if one vector's values equals anothers
		* @param {Vec3} v The reference to check against
		* @returns {boolean}
		*/
        equals( v: Vec3 ): boolean {
            return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );
        }

		/**
		* Extracts the data from an array and sets those values on this vector
		* @param {Array<number>} array The array to fetch from
		* @returns {Vec3}
		*/
        fromArray( array: Array<number> ): Vec3 {
            this.x = array[ 0 ];
            this.y = array[ 1 ];
            this.z = array[ 2 ];
            return this;
        }

		/**
		* Returns a new array with the values of this vector
		* @returns {Array<number>}
		*/
        toArray(): Array<number> {
            return [ this.x, this.y, this.z ];
        }

		/**
		* Clones this Vector
		* @returns {Vec3}
		*/
        clone(): Vec3 {
            return new Vec3( this.x, this.y, this.z );
        }

		/**
		* Applies an Euler to this vector
		* @param {Euler} euler The euler to apply
		* @returns {Vec3}
		*/
        applyEuler( euler: Euler ): Vec3 {
            const quaternion = Vec3._quat;
            this.applyQuaternion( quaternion.setFromEuler( euler ) );
            return this;
        }


		/**
		* Transforms this vector by an angle on a specified axis
		* @param {Vec3} axis A reference vector of which set of axes to transform
		* @param {number} angle The angle in radians
		* @returns {Vec3}
		*/
        applyAxisAngle( axis: Vec3, angle: number ): Vec3 {
            const quaternion = Vec3._quat;
            this.applyQuaternion( quaternion.setFromAxisAngle( axis, angle ) );
            return this;
        }


		/**
		* Sets the direction and length of this vector by projecting it onto a reference vector r
		* @param {Vec3} r A the reference vector
		* @returns {Vec3}
		*/
        projectOnVector( r: Vec3 ): Vec3 {
            const v1 = Vec3._v1;
            v1.copy( r ).normalize();
            const d = this.dot( v1 );
            return this.copy( v1 ).multiplyScalar( d );
        }

		/**
		* Sets the direction and length of this vector by projecting it onto a vector representing a plane's normal
		* @param {Vec3} planeNormal The normal of the plane we are projecting onto
		* @returns {Vec3}
		*/
        projectOnPlane( planeNormal: Vec3 ): Vec3 {
            const v1 = Vec3._v1;
            v1.copy( this ).projectOnVector( planeNormal );
            return this.sub( v1 );
        }

		/**
		* Reflects this vector against a plane orthogonal to normal
		* @param {Vec3} normal The reference vector
		* @returns {Vec3}
		*/
        reflect( normal: Vec3 ): Vec3 {
            const v1 = Vec3._v1;
            return this.sub( v1.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );
        }


    }
}