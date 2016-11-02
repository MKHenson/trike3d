namespace Trike {
	/**
	* A simple 4D Vector
	*/
    export class Vec4 {
        public x: number;
        public y: number;
        public z: number;
        public w: number;
        public elements: Float32Array;

		/**
		* Creates a new vector instance
		* @param {number} x [Optional] The x value
		* @param {number} y [Optional] The y value
		* @param {number} z [Optional] The z value
		* @param {number} w [Optional] The w value
		*/
        constructor( x?: number, y?: number, z?: number, w?: number ) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            this.w = ( w !== undefined ) ? w : 1;
            this.elements = new Float32Array( 4 );
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
            elm[ 3 ] = this.w;
            return elm;
        }

		/**
		* Sets the components of this vector
		* @param {number} x The x value
		* @param {number} y The y value
		* @param {number} z The z value
		* @param {number} w The w value
		* @returns {Vec4}
		*/
        set( x: number, y: number, z: number, w: number ): Vec4 {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        }

		/**
		* Sets the x component of this vector
		* @param {number} x The x value
		* @returns {Vec4}
		*/
        setX( x: number ): Vec4 {
            this.x = x;
            return this;
        }

		/**
		* Sets the y component of this vector
		* @param {number} y The y value
		* @returns {Vec4}
		*/
        setY( y: number ): Vec4 {
            this.y = y;
            return this;
        }

		/**
		* Sets the z component of this vector
		* @param {number} z The z value
		* @returns {Vec4}
		*/
        setZ( z: number ): Vec4 {
            this.z = z;
            return this;
        }

		/**
		* Sets the w component of this vector
		* @param {number} w The w value
		* @returns {Vec4}
		*/
        setW( w: number ): Vec4 {
            this.w = w;
            return this;
        }

		/**
		* Sets one of the vectors values by index.
		* @param {number} index The index to set, 0 = x, 1 = y, 2 = z, 3 = w
		* @param {number} value The new value
		* @returns {Vec4}
		*/
        setComponent( index: number, value: number ) {
            switch ( index ) {
                case 0: this.x = value; break;
                case 1: this.y = value; break;
                case 2: this.z = value; break;
                case 3: this.w = value; break;
                default: throw new Error( 'index is out of range: ' + index );
            }
        }

		/**
		* Gets one of the vectors values by index.
		* @param {number} index The index to get, 0 = x, 1 = y, 2 = z, 3 = w
		* @returns {number}
		*/
        getComponent( index: number ): number {
            switch ( index ) {
                case 0: return this.x;
                case 1: return this.y;
                case 2: return this.z;
                case 3: return this.w;
                default: throw new Error( 'index is out of range: ' + index );
            }
        }


		/**
		* Copies the values of v into this vector
		* @param {Vec4} v The vector to copy from
		* @returns {Vec4}
		*/
        copy( v: Vec4 ): Vec4 {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            this.w = ( v.w !== undefined ) ? v.w : 1;
            return this;
        }

		/**
		* Add the vector v and sets the result on this vector's components
		* @param {Vec4} v The vector to add from
		* @returns {Vec4}
		*/
        add( v: Vec4 ): Vec4 {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            this.w += v.w;
            return this;
        }

		/**
		* Add the scalar s and sets the result on this vector
		* @param {number} s The scalar value to add
		* @returns {Vec4}
		*/
        addScalar( s: number ): Vec4 {
            this.x += s;
            this.y += s;
            this.z += s;
            this.w += s;
            return this;
        }


		/**
		* Adds the vectors a and b and sets the result on this vector
		* @param {Vec4} a The first vector
		* @param {Vec4} b The second vector
		* @returns {Vec4}
		*/
        addVectors( a: Vec4, b: Vec4 ): Vec4 {
            this.x = a.x + b.x;
            this.y = a.y + b.y;
            this.z = a.z + b.z;
            this.w = a.w + b.w;
            return this;
        }


		/**
		* Subtracts the vectors v and sets the result on this vector
		* @param {Vec4} v The vector to subtract
		* @returns {Vec4}
		*/
        sub( v: Vec4 ): Vec4 {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            this.w -= v.w;

            return this;
        }

		/**
		* Subtracts the vectors a and b and sets the result on this vector
		* @param {Vec4} a The first vector
		* @param {Vec4} b The second vector
		* @returns {Vec4}
		*/
        subVectors( a: Vec4, b: Vec4 ): Vec4 {
            this.x = a.x - b.x;
            this.y = a.y - b.y;
            this.z = a.z - b.z;
            this.w = a.w - b.w;
            return this;
        }

		/**
		* Multiplies the vector v with this vector
		* @param {Vec4} v The vector
		* @returns {Vec4}
		*/
        multiply( v: Vec4 ): Vec4 {
            this.x *= v.x;
            this.y *= v.y;
            this.z *= v.z;
            this.w *= v.w;
            return this;
        }

		/**
		* Multiplies the scalar s with this vector
		* @param {number} s The scalar to multiply
		* @returns {Vec4}
		*/
        multiplyScalar( s: number ): Vec4 {
            this.x *= s;
            this.y *= s;
            this.z *= s;
            this.w *= s;
            return this;
        }

		/**
		* Multiplies the vectors a and b and sets the result on this vector
		* @param {Vec4} a The first vector
		* @param {Vec4} b The second vector
		* @returns {Vec4}
		*/
        multiplyVectors( a: Vec4, b: Vec4 ): Vec4 {
            this.x = a.x * b.x;
            this.y = a.y * b.y;
            this.z = a.z * b.z;
            this.z = a.w * b.w;
            return this;
        }

		/**
		* Transforms this point with the matrix m
		* @param {Matrix4} m The matrix to apply
		* @returns {Vec4}
		*/
        applyMatrix4( m: Matrix4 ): Vec4 {
            const x = this.x;
            const y = this.y;
            const z = this.z;
            const w = this.w;

            const e = m.elements;

            this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] * w;
            this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] * w;
            this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] * w;
            this.w = e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] * w;

            return this;
        }

		/**
		* Divides this vector by the vector v
		* @param {Vec4} v The vector to divide by
		* @returns {Vec4}
		*/
        divide( v: Vec4 ): Vec4 {
            this.x /= v.x;
            this.y /= v.y;
            this.z /= v.z;
            this.w /= v.w;
            return this;
        }

		/**
		* Divides this vector by the scalar s
		* @param {number} s The scalar to divide by
		* @returns {Vec4}
		*/
        divideScalar( s: number ): Vec4 {
            if ( s !== 0 ) {
                const invScalar = 1 / s;

                this.x *= invScalar;
                this.y *= invScalar;
                this.z *= invScalar;
                this.w *= invScalar;
            }
            else {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 1;
            }

            return this;
        }


        setAxisAngleFromQuaternion( q: Quat ): Vec4 {
            // http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/index.htm
            // q is assumed to be normalized

            this.w = 2 * Math.acos( q.w );
            const s = Math.sqrt( 1 - q.w * q.w );

            if ( s < 0.0001 ) {
                this.x = 1;
                this.y = 0;
                this.z = 0;
            }
            else {
                this.x = q.x / s;
                this.y = q.y / s;
                this.z = q.z / s;
            }

            return this;
        }

        setAxisAngleFromRotationMatrix( m: Matrix4 ): Vec4 {
            // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToAngle/index.htm
            // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

            let angle, x, y, z,		// variables for result
                epsilon = 0.01,		// margin to allow for rounding errors
                epsilon2 = 0.1,		// margin to distinguish between 0 and 180 degrees
                te = m.elements,

                m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
                m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
                m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

            if ( ( Math.abs( m12 - m21 ) < epsilon )
                && ( Math.abs( m13 - m31 ) < epsilon )
                && ( Math.abs( m23 - m32 ) < epsilon ) ) {
                // singularity found
                // first check for identity matrix which must have +1 for all terms
                // in leading diagonal and zero in other terms

                if ( ( Math.abs( m12 + m21 ) < epsilon2 )
                    && ( Math.abs( m13 + m31 ) < epsilon2 )
                    && ( Math.abs( m23 + m32 ) < epsilon2 )
                    && ( Math.abs( m11 + m22 + m33 - 3 ) < epsilon2 ) ) {
                    // this singularity is identity matrix so angle = 0
                    this.set( 1, 0, 0, 0 );
                    return this; // zero angle, arbitrary axis
                }

                // otherwise this singularity is angle = 180
                angle = Math.PI;

                const xx = ( m11 + 1 ) / 2;
                const yy = ( m22 + 1 ) / 2;
                const zz = ( m33 + 1 ) / 2;
                const xy = ( m12 + m21 ) / 4;
                const xz = ( m13 + m31 ) / 4;
                const yz = ( m23 + m32 ) / 4;

                if ( ( xx > yy ) && ( xx > zz ) ) {
                    // m11 is the largest diagonal term
                    if ( xx < epsilon ) {
                        x = 0;
                        y = 0.707106781;
                        z = 0.707106781;
                    }
                    else {
                        x = Math.sqrt( xx );
                        y = xy / x;
                        z = xz / x;
                    }

                }
                else if ( yy > zz ) {
                    // m22 is the largest diagonal term
                    if ( yy < epsilon ) {
                        x = 0.707106781;
                        y = 0;
                        z = 0.707106781;
                    }
                    else {
                        y = Math.sqrt( yy );
                        x = xy / y;
                        z = yz / y;
                    }
                }
                else {
                    // m33 is the largest diagonal term so base result on this
                    if ( zz < epsilon ) {
                        x = 0.707106781;
                        y = 0.707106781;
                        z = 0;

                    }
                    else {
                        z = Math.sqrt( zz );
                        x = xz / z;
                        y = yz / z;
                    }

                }

                this.set( x, y, z, angle );
                return this; // return 180 deg rotation
            }

            // as we have reached here there are no singularities so we can handle normally
            let s = Math.sqrt(( m32 - m23 ) * ( m32 - m23 )
                + ( m13 - m31 ) * ( m13 - m31 )
                + ( m21 - m12 ) * ( m21 - m12 ) ); // used to normalize

            if ( Math.abs( s ) < 0.001 )
                s = 1;

            // prevent divide by zero, should not happen if matrix is orthogonal and should be
            // caught by singularity test above, but I've left it in just in case
            this.x = ( m32 - m23 ) / s;
            this.y = ( m13 - m31 ) / s;
            this.z = ( m21 - m12 ) / s;
            this.w = Math.acos(( m11 + m22 + m33 - 1 ) / 2 );

            return this;
        }

		/**
		* Sets this vector's values to the lowest between itself and the reference vector v
		* @param {Vec4} v The reference vector
		* @returns {Vec4}
		*/
        min( v: Vec4 ): Vec4 {
            if ( this.x > v.x )
                this.x = v.x;

            if ( this.y > v.y )
                this.y = v.y;

            if ( this.z > v.z )
                this.z = v.z;

            if ( this.w > v.w )
                this.w = v.w;

            return this;
        }

		/**
		* Sets this vector's values to the highest between itself and the reference vector v
		* @param {Vec4} v The reference vector
		* @returns {Vec4}
		*/
        max( v: Vec4 ): Vec4 {
            if ( this.x < v.x )
                this.x = v.x;

            if ( this.y < v.y )
                this.y = v.y;

            if ( this.z < v.z )
                this.z = v.z;

            if ( this.w < v.w )
                this.w = v.w;

            return this;
        }


		/**
		* Clamps this vector to a min and max set of values. This function assumes min < max, if this assumption isn't true it will not operate correctly
		* @param {Vec4} min The min reference vector
		* @param {Vec4} max The max reference vector
		* @returns {Vec4}
		*/
        clamp( min: Vec4, max: Vec4 ): Vec4 {
            // This function assumes min < max, if this assumption isn't true it will not operate correctly
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

            if ( this.w < min.w )
                this.w = min.w;
            else if ( this.w > max.w )
                this.w = max.w;

            return this;
        }

		/**
		* Inverts this vector, essentially multiplying it by -1
		* @returns {Vec4}
		*/
        negate(): Vec4 {
            return this.multiplyScalar( -1 );
        }

		/**
		* Returns the dot product, or scalar value, of this vector and the one passed to it. You can think of the dot as a projection
		* of the one vector onto the other. See here for a visualization: http://www.falstad.com/dotproduct/
		* @param {Vec4} v The vector to dot against
		* @returns {number}
		*/
        dot( v: Vec4 ): number {
            return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
        }

		/**
		* Returns the length squared of this vector
		* @returns {number}
		*/
        lengthSq(): number {
            return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
        }

		/**
		* Returns the length of this vector
		* @returns {number}
		*/
        length(): number {
            return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );
        }

        lengthManhattan(): number {
            return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z ) + Math.abs( this.w );
        }

		/**
		* Normalizes this vector. This essentially makes each component of the vector a value between 0 and 1
		* @returns {Vec4}
		*/
        normalize(): Vec4 {
            return this.divideScalar( this.length() );
        }

		/**
		* Enlarges the vector by the scalar value l
		* @param {number} l The scalar value
		* @returns {Vec4}
		*/
        setLength( l: number ): Vec4 {
            const oldLength = this.length();

            if ( oldLength !== 0 && l !== oldLength )
                this.multiplyScalar( l / oldLength );

            return this;
        }

		/**
		* Interpolates the values of this vector towards its reference v. The interpolation is calculated by
		* the weight value of alpha
		* @param {Vec4} v The vector to interpolate towards
		* @param {number} alpha The weight (typically from 0 to 1)
		* @returns {Vec4}
		*/
        lerp( v: Vec4, alpha: number ): Vec4 {
            this.x += ( v.x - this.x ) * alpha;
            this.y += ( v.y - this.y ) * alpha;
            this.z += ( v.z - this.z ) * alpha;
            this.w += ( v.w - this.w ) * alpha;

            return this;
        }

		/**
		* Returns the distance from this vector to the one reference v
		* @param {Vec4} v The vector reference
		* @returns {number}
		*/
        distanceTo( v: Vec4 ): number {
            return Math.sqrt( this.distanceToSquared( v ) );
        }

		/**
		* Returns the distance squared from this vector to the reference v
		* @param {Vec4} v The vector reference
		* @returns {number}
		*/
        distanceToSquared( v: Vec4 ): number {
            const dx = this.x - v.x;
            const dy = this.y - v.y;
            const dz = this.z - v.z;
            const dw = this.w - v.w;
            return dx * dx + dy * dy + dz * dz + dw * dw;
        }

		/**
		* Checks if one vector's values equals anothers
		* @param {Vec4} v The reference to check against
		* @returns {boolean}
		*/
        equals( v: Vec4 ): boolean {
            return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) && ( v.w === this.w ) );
        }

		/**
		* Extracts the data from an array and sets those values on this vector
		* @param {Array<number>} array The array to fetch from
		* @returns {Vec4}
		*/
        fromArray( array: Array<number> ): Vec4 {
            this.x = array[ 0 ];
            this.y = array[ 1 ];
            this.z = array[ 2 ];
            this.w = array[ 3 ];
            return this;
        }

		/**
		* Returns a new array with the values of this vector
		* @returns {Array<number>}
		*/
        toArray(): Array<number> {
            return [ this.x, this.y, this.z, this.w ];
        }

		/**
		* Clones this Vector
		* @returns {Vec4}
		*/
        clone(): Vec4 {
            return new Vec4( this.x, this.y, this.z, this.w );
        }
    }
}