namespace Trike {
	/**
	* A Quaternion class for handling rotations in 3D.
	* Each Quat class also keeps an optional reference to an Euler object which can get updated each time the Quat is modified.
	*/
    export class Quat {
        public _x: number;
        public _y: number;
        public _z: number;
        public _w: number;
        public _euler: Euler;
        public elements: Float32Array;

        /** Creates an instance of a Quat */
        constructor( x?: number, y?: number, z?: number, w?: number ) {
            this._x = x || 0;
            this._y = y || 0;
            this._z = z || 0;
            this._w = ( w !== undefined ) ? w : 1;
            this.elements = new Float32Array( 4 );
        }

        get getElements(): Float32Array {
            const elm = this.elements;
            elm[ 0 ] = this._x;
            elm[ 1 ] = this._y;
            elm[ 2 ] = this._z;
            elm[ 3 ] = this._w;
            return elm;
        }

        /** Call this to update the internal euler object */
        _updateEuler() {
            if ( this._euler !== undefined ) {
                this._euler.setFromQuaternion( this, undefined, false );
            }
        }

		/**
		* Gets the x value of this Quat.
		* @returns {number}
		*/
        get x() {
            return this._x;
        }

		/**
		* Sets the x value of this Quat. This updates the internal euler object.
		* @param {number} value The x value
		*/
        set x( value ) {
            this._x = value;
            this._updateEuler();
        }

		/**
		* Gets the y value of this Quat.
		* @returns {number}
		*/
        get y() {
            return this._y;
        }

		/**
		* Sets the y value of this Quat. This updates the internal euler object.
		* @param {number} value The y value
		*/
        set y( value ) {
            this._y = value;
            this._updateEuler();
        }

		/**
		* Gets the z value of this Quat.
		* @returns {number}
		*/
        get z() {
            return this._z;
        }

		/**
		* Sets the z value of this Quat. This updates the internal euler object.
		* @param {number} value The z value
		*/
        set z( value ) {
            this._z = value;
            this._updateEuler();
        }

		/**
		* Gets the w value of this Quat.
		* @returns {number}
		*/
        get w() {
            return this._w;
        }

		/**
		* Sets the w values of this Quat. This updates the internal euler object.
		* @param {number} value The w value
		*/
        set w( value ) {
            this._w = value;
            this._updateEuler();
        }

		/**
		* Sets the values of this Quat
		* @param {number} x The x value
		* @param {number} y The y value
		* @param {number} z The z value
		* @param {number} w The w value
		* @returns {Quat}
		*/
        set( x: number, y: number, z: number, w: number ): Quat {
            this._x = x;
            this._y = y;
            this._z = z;
            this._w = w;

            this._updateEuler();

            return this;
        }

		/**
		* Copies the values of a given Quat to this
		* @param {Quat} quaternion The Quat we are copying from
		* @returns {Quat}
		*/
        copy( quaternion: Quat ): Quat {
            this._x = quaternion._x;
            this._y = quaternion._y;
            this._z = quaternion._z;
            this._w = quaternion._w;

            this._updateEuler();

            return this;
        }

		/**
		* Sets the values of this Quat from an Euler
		* See http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m
		* @param {Euler} euler The Euler we are extracting values from
		* @param {boolean} update True if this operation should update the internal euler object of the Quat
		* @returns {Quat}
		*/
        setFromEuler( euler: Euler, update?: boolean ): Quat {
            const c1 = Math.cos( euler._x / 2 );
            const c2 = Math.cos( euler._y / 2 );
            const c3 = Math.cos( euler._z / 2 );
            const s1 = Math.sin( euler._x / 2 );
            const s2 = Math.sin( euler._y / 2 );
            const s3 = Math.sin( euler._z / 2 );

            if ( euler.order === 'XYZ' ) {
                this._x = s1 * c2 * c3 + c1 * s2 * s3;
                this._y = c1 * s2 * c3 - s1 * c2 * s3;
                this._z = c1 * c2 * s3 + s1 * s2 * c3;
                this._w = c1 * c2 * c3 - s1 * s2 * s3;
            }
            else if ( euler.order === 'YXZ' ) {
                this._x = s1 * c2 * c3 + c1 * s2 * s3;
                this._y = c1 * s2 * c3 - s1 * c2 * s3;
                this._z = c1 * c2 * s3 - s1 * s2 * c3;
                this._w = c1 * c2 * c3 + s1 * s2 * s3;
            }
            else if ( euler.order === 'ZXY' ) {
                this._x = s1 * c2 * c3 - c1 * s2 * s3;
                this._y = c1 * s2 * c3 + s1 * c2 * s3;
                this._z = c1 * c2 * s3 + s1 * s2 * c3;
                this._w = c1 * c2 * c3 - s1 * s2 * s3;
            }
            else if ( euler.order === 'ZYX' ) {
                this._x = s1 * c2 * c3 - c1 * s2 * s3;
                this._y = c1 * s2 * c3 + s1 * c2 * s3;
                this._z = c1 * c2 * s3 - s1 * s2 * c3;
                this._w = c1 * c2 * c3 + s1 * s2 * s3;
            }
            else if ( euler.order === 'YZX' ) {
                this._x = s1 * c2 * c3 + c1 * s2 * s3;
                this._y = c1 * s2 * c3 + s1 * c2 * s3;
                this._z = c1 * c2 * s3 - s1 * s2 * c3;
                this._w = c1 * c2 * c3 - s1 * s2 * s3;
            }
            else if ( euler.order === 'XZY' ) {
                this._x = s1 * c2 * c3 - c1 * s2 * s3;
                this._y = c1 * s2 * c3 - s1 * c2 * s3;
                this._z = c1 * c2 * s3 + s1 * s2 * c3;
                this._w = c1 * c2 * c3 + s1 * s2 * s3;
            }

            if ( update !== false )
                this._updateEuler();

            return this;
        }

		/**
		* Sets the values of this Quat from a vector and its angle.
		* See http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
		* @param {Vec3} axis The axis mask. This must be normalized.
		* @param {number} angle The rotate amount in radians
		* @returns {Quat}
		*/
        setFromAxisAngle( axis: Vec3, angle: number ): Quat {
            const halfAngle = angle / 2, s = Math.sin( halfAngle );

            this._x = axis.x * s;
            this._y = axis.y * s;
            this._z = axis.z * s;
            this._w = Math.cos( halfAngle );
            this._updateEuler();
            return this;
        }

		/**
		* Sets the values of this Quat from a rotation matrix
		* @param {Matrix4} m The rotation matrix we are extracting values from.
		* @returns {Quat}
		*/
        setFromRotationMatrix( m: Matrix4 ): Quat {
            // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
            // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

            const te = m.elements,
                m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
                m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
                m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

                trace = m11 + m22 + m33;

            let s;

            if ( trace > 0 ) {
                s = 0.5 / Math.sqrt( trace + 1.0 );

                this._w = 0.25 / s;
                this._x = ( m32 - m23 ) * s;
                this._y = ( m13 - m31 ) * s;
                this._z = ( m21 - m12 ) * s;
            }
            else if ( m11 > m22 && m11 > m33 ) {
                s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );
                this._w = ( m32 - m23 ) / s;
                this._x = 0.25 * s;
                this._y = ( m12 + m21 ) / s;
                this._z = ( m13 + m31 ) / s;
            }
            else if ( m22 > m33 ) {
                s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

                this._w = ( m13 - m31 ) / s;
                this._x = ( m12 + m21 ) / s;
                this._y = 0.25 * s;
                this._z = ( m23 + m32 ) / s;
            }
            else {
                s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );
                this._w = ( m21 - m12 ) / s;
                this._x = ( m13 + m31 ) / s;
                this._y = ( m23 + m32 ) / s;
                this._z = 0.25 * s;
            }

            this._updateEuler();
            return this;
        }

		/**
		* Inverts this Quaternion
		* @returns {Quat}
		*/
        inverse(): Quat {
            this.conjugate().normalize();
            return this;
        }

		/**
		* Conjugates this Quaternion (multiples by -1)
		* @returns {Quat}
		*/
        conjugate(): Quat {
            this._x *= -1;
            this._y *= -1;
            this._z *= -1;

            this._updateEuler();

            return this;
        }

		/**
		* Returns the length squared of this Quaternion
		* @returns {number}
		*/
        lengthSq(): number {
            return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;
        }


		/**
		* Returns the length this Quaternion
		* @returns {number}
		*/
        length(): number {
            return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );
        }

		/**
		* Normalizes the values of this Quaternion. Making each of its components a value between 0 and 1
		* @returns {Quat}
		*/
        normalize(): Quat {
            let l = this.length();

            if ( l === 0 ) {
                this._x = 0;
                this._y = 0;
                this._z = 0;
                this._w = 1;
            }
            else {
                l = 1 / l;

                this._x = this._x * l;
                this._y = this._y * l;
                this._z = this._z * l;
                this._w = this._w * l;
            }

            return this;
        }

		/**
		* Multiplies this Quaternion with another
		* @returns {Quat}
		*/
        multiply( q: Quat ): Quat {
            return this.multiplyQuaternions( this, q );
        }

		/**
		* Multiplies two Quaternions together and applies the result to this Quat.
		* @returns {Quat}
		*/
        multiplyQuaternions( a: Quat, b: Quat ): Quat {
            // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
            const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
            const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;
            this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
            this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
            this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
            this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

            this._updateEuler();

            return this;
        }

		/**
		* A form of linear interpolation between two quaternions
		* @param {Quat} qb The Quat we are interpolating to.
		* @param {number} t The weight between 0 and 1. 0 Means the quat is unchanged and 1 means its become qb
 		* @returns {Quat}
		*/
        slerp( qb: Quat, t: number ): Quat {
            if ( t === 0 ) return this;
            if ( t === 1 ) return this.copy( qb );

            const x = this._x, y = this._y, z = this._z, w = this._w;

            // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

            let cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;
            if ( cosHalfTheta < 0 ) {
                this._w = -qb._w;
                this._x = -qb._x;
                this._y = -qb._y;
                this._z = -qb._z;

                cosHalfTheta = -cosHalfTheta;
            }
            else {
                this.copy( qb );
            }

            if ( cosHalfTheta >= 1.0 ) {
                this._w = w;
                this._x = x;
                this._y = y;
                this._z = z;

                return this;
            }

            const halfTheta = Math.acos( cosHalfTheta );
            const sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

            if ( Math.abs( sinHalfTheta ) < 0.001 ) {
                this._w = 0.5 * ( w + this._w );
                this._x = 0.5 * ( x + this._x );
                this._y = 0.5 * ( y + this._y );
                this._z = 0.5 * ( z + this._z );

                return this;
            }

            const ratioA = Math.sin(( 1 - t ) * halfTheta ) / sinHalfTheta,
                ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

            this._w = ( w * ratioA + this._w * ratioB );
            this._x = ( x * ratioA + this._x * ratioB );
            this._y = ( y * ratioA + this._y * ratioB );
            this._z = ( z * ratioA + this._z * ratioB );

            this._updateEuler();

            return this;
        }

		/**
		* Checks if quaternion is equal
		* @param {Quat} quaternion The Quat we are testing against
 		* @returns {boolean}
		*/
        equals( quaternion: Quat ): boolean {
            return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );
        }

		/**
		* Builds a quaternion representing the rotation between two 3D vectors directions and applies the result
		* to this Quat.
		* @param {Vec3} vFrom The first vector
		* @param {Vec3} vTo The second vector
 		* @returns {Quat}
		*/
        setFromUnitVectors( vFrom: Vec3, vTo: Vec3 ): Quat {
            // http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final
            // assumes direction vectors vFrom and vTo are normalized

            let v1, r;
            const EPS = 0.000001;

            if ( v1 === undefined )
                v1 = new Vec3();

            r = vFrom.dot( vTo ) + 1;

            if ( r < EPS ) {
                r = 0;

                if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) )
                    v1.set( - vFrom.y, vFrom.x, 0 );
                else
                    v1.set( 0, - vFrom.z, vFrom.y );
            }
            else
                v1.crossVectors( vFrom, vTo );

            this.set( v1.x, v1.y, v1.z, r ).normalize();

            this._updateEuler();
            return this;
        }

		/**
		* Builds this Quat from a 4 slot array
		* @param {Array<number>} array
 		* @returns {Quat}
		*/
        fromArray( array: Array<number> ): Quat {
            this._x = array[ 0 ];
            this._y = array[ 1 ];
            this._z = array[ 2 ];
            this._w = array[ 3 ];
            this._updateEuler();
            return this;
        }

		/**
		* Builds a 4 slot array from this Quat
 		* @returns {Array<number>}
		*/
        toArray(): Array<number> {
            return [ this._x, this._y, this._z, this._w ];
        }

		/**
		* Clones this Quat
 		* @returns {Quat}
		*/
        clone(): Quat {
            return new Quat( this._x, this._y, this._z, this._w );
        }

		/**
		* Performs a form linear interpolation of between 2 Quats
		* @param {Quat} from The Quat we are interpolating from
		* @param {Quat} to The Quat we are interpolating towards
		* @param {Quat} out The Quat we are storing the new orientation in
		* @param {number} t The weight between 0 and 1.
 		* @returns {Quat}
		*/
        static slerp( from: Quat, to: Quat, out: Quat, t: number ): Quat {
            return out.copy( from ).slerp( to, t );
        }
    }
}