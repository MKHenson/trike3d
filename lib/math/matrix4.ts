namespace Trike {
	/**
	* A simple Matrix4
	*/
    export class Matrix4 {
        public elements: Float32Array;

        private static _t1: Vec3;
        private static _t2: Vec3;
        private static _t3: Vec3;

		/**
		* Creates an instance of a Matrix4
		*/
        constructor( n11?: number, n12?: number, n13?: number, n14?: number, n21?: number, n22?: number, n23?: number, n24?: number, n31?: number, n32?: number, n33?: number, n34?: number, n41?: number, n42?: number, n43?: number, n44?: number ) {
            const te = this.elements = new Float32Array( 16 );

            te[ 0 ] = ( n11 !== undefined ) ? n11 : 1; te[ 4 ] = n12 || 0; te[ 8 ] = n13 || 0; te[ 12 ] = n14 || 0;
            te[ 1 ] = n21 || 0; te[ 5 ] = ( n22 !== undefined ) ? n22 : 1; te[ 9 ] = n23 || 0; te[ 13 ] = n24 || 0;
            te[ 2 ] = n31 || 0; te[ 6 ] = n32 || 0; te[ 10 ] = ( n33 !== undefined ) ? n33 : 1; te[ 14 ] = n34 || 0;
            te[ 3 ] = n41 || 0; te[ 7 ] = n42 || 0; te[ 11 ] = n43 || 0; te[ 15 ] = ( n44 !== undefined ) ? n44 : 1;

            if ( !Matrix4._t1 ) {
                Matrix4._t1 = new Vec3();
                Matrix4._t2 = new Vec3();
                Matrix4._t3 = new Vec3();
            }
        }

		/**
		* Sets the matrix from values
		* @returns {Matrix4}
		*/
        set( n11: number, n12: number, n13: number, n14: number, n21: number, n22: number, n23: number, n24: number, n31: number, n32: number, n33: number, n34: number, n41: number, n42: number, n43: number, n44: number ): Matrix4 {
            const te = this.elements;

            te[ 0 ] = n11; te[ 4 ] = n12; te[ 8 ] = n13; te[ 12 ] = n14;
            te[ 1 ] = n21; te[ 5 ] = n22; te[ 9 ] = n23; te[ 13 ] = n24;
            te[ 2 ] = n31; te[ 6 ] = n32; te[ 10 ] = n33; te[ 14 ] = n34;
            te[ 3 ] = n41; te[ 7 ] = n42; te[ 11 ] = n43; te[ 15 ] = n44;

            return this;
        }

		/**
		* Sets this matrix to an indentity matrix
		* @returns {Matrix4}
		*/
        identity(): Matrix4 {
            this.set(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            );

            return this;
        }

		/**
		* Copies the values of matrix m to this matrix
		* @param {Matrix4} m The matrix to copy from
		* @returns {Matrix4}
		*/
        copy( m: Matrix4 ): Matrix4 {
            this.elements.set( m.elements );
            return this;
        }

		/**
		* Copies the position from one matrix into this
		* @param {Matrix4} m
		* @returns {Matrix4}
		*/
        copyPosition( m: Matrix4 ): Matrix4 {
            const te = this.elements;
            const me = m.elements;

            te[ 12 ] = me[ 12 ];
            te[ 13 ] = me[ 13 ];
            te[ 14 ] = me[ 14 ];

            return this;
        }

		/**
		* Extracts rotation from a matrix
		* @param {Matrix4} m
		* @returns {Matrix4}
		*/
        extractRotation( m: Matrix4 ): Matrix4 {
            const v1 = Matrix4._t1;
            const te = this.elements;
            const me = m.elements;

            const scaleX = 1 / v1.set( me[ 0 ], me[ 1 ], me[ 2 ] ).length();
            const scaleY = 1 / v1.set( me[ 4 ], me[ 5 ], me[ 6 ] ).length();
            const scaleZ = 1 / v1.set( me[ 8 ], me[ 9 ], me[ 10 ] ).length();

            te[ 0 ] = me[ 0 ] * scaleX;
            te[ 1 ] = me[ 1 ] * scaleX;
            te[ 2 ] = me[ 2 ] * scaleX;

            te[ 4 ] = me[ 4 ] * scaleY;
            te[ 5 ] = me[ 5 ] * scaleY;
            te[ 6 ] = me[ 6 ] * scaleY;

            te[ 8 ] = me[ 8 ] * scaleZ;
            te[ 9 ] = me[ 9 ] * scaleZ;
            te[ 10 ] = me[ 10 ] * scaleZ;

            return this;
        }

		/**
		* Creates a rotation at matrix from an Euler
		* @param {Euler} euler
		* @returns {Matrix4}
		*/
        makeRotationFromEuler( euler: Euler ): Matrix4 {
            const te = this.elements;

            const x = euler.x, y = euler.y, z = euler.z;
            const a = Math.cos( x ), b = Math.sin( x );
            const c = Math.cos( y ), d = Math.sin( y );
            const e = Math.cos( z ), f = Math.sin( z );

            if ( euler.order === 'XYZ' ) {
                const ae = a * e, af = a * f, be = b * e, bf = b * f;

                te[ 0 ] = c * e;
                te[ 4 ] = - c * f;
                te[ 8 ] = d;

                te[ 1 ] = af + be * d;
                te[ 5 ] = ae - bf * d;
                te[ 9 ] = - b * c;

                te[ 2 ] = bf - ae * d;
                te[ 6 ] = be + af * d;
                te[ 10 ] = a * c;

            }
            else if ( euler.order === 'YXZ' ) {
                const ce = c * e, cf = c * f, de = d * e, df = d * f;

                te[ 0 ] = ce + df * b;
                te[ 4 ] = de * b - cf;
                te[ 8 ] = a * d;

                te[ 1 ] = a * f;
                te[ 5 ] = a * e;
                te[ 9 ] = - b;

                te[ 2 ] = cf * b - de;
                te[ 6 ] = df + ce * b;
                te[ 10 ] = a * c;

            }
            else if ( euler.order === 'ZXY' ) {
                const ce = c * e, cf = c * f, de = d * e, df = d * f;

                te[ 0 ] = ce - df * b;
                te[ 4 ] = - a * f;
                te[ 8 ] = de + cf * b;

                te[ 1 ] = cf + de * b;
                te[ 5 ] = a * e;
                te[ 9 ] = df - ce * b;

                te[ 2 ] = - a * d;
                te[ 6 ] = b;
                te[ 10 ] = a * c;

            }
            else if ( euler.order === 'ZYX' ) {
                const ae = a * e, af = a * f, be = b * e, bf = b * f;

                te[ 0 ] = c * e;
                te[ 4 ] = be * d - af;
                te[ 8 ] = ae * d + bf;

                te[ 1 ] = c * f;
                te[ 5 ] = bf * d + ae;
                te[ 9 ] = af * d - be;

                te[ 2 ] = - d;
                te[ 6 ] = b * c;
                te[ 10 ] = a * c;

            }
            else if ( euler.order === 'YZX' ) {
                const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

                te[ 0 ] = c * e;
                te[ 4 ] = bd - ac * f;
                te[ 8 ] = bc * f + ad;

                te[ 1 ] = f;
                te[ 5 ] = a * e;
                te[ 9 ] = - b * e;

                te[ 2 ] = - d * e;
                te[ 6 ] = ad * f + bc;
                te[ 10 ] = ac - bd * f;

            }
            else if ( euler.order === 'XZY' ) {
                const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

                te[ 0 ] = c * e;
                te[ 4 ] = - f;
                te[ 8 ] = d * e;

                te[ 1 ] = ac * f + bd;
                te[ 5 ] = a * e;
                te[ 9 ] = ad * f - bc;

                te[ 2 ] = bc * f - ad;
                te[ 6 ] = b * e;
                te[ 10 ] = bd * f + ac;
            }

            // last column
            te[ 3 ] = 0;
            te[ 7 ] = 0;
            te[ 11 ] = 0;

            // bottom row
            te[ 12 ] = 0;
            te[ 13 ] = 0;
            te[ 14 ] = 0;
            te[ 15 ] = 1;

            return this;
        }

		/**
		* Creates a rotation matrix from a quaternion
		* @param {Quat} q
		* @returns {Matrix4}
		*/
        makeRotationFromQuaternion( q: Quat ): Matrix4 {
            const te = this.elements;

            const x = q.x, y = q.y, z = q.z, w = q.w;
            const x2 = x + x, y2 = y + y, z2 = z + z;
            const xx = x * x2, xy = x * y2, xz = x * z2;
            const yy = y * y2, yz = y * z2, zz = z * z2;
            const wx = w * x2, wy = w * y2, wz = w * z2;

            te[ 0 ] = 1 - ( yy + zz );
            te[ 4 ] = xy - wz;
            te[ 8 ] = xz + wy;

            te[ 1 ] = xy + wz;
            te[ 5 ] = 1 - ( xx + zz );
            te[ 9 ] = yz - wx;

            te[ 2 ] = xz - wy;
            te[ 6 ] = yz + wx;
            te[ 10 ] = 1 - ( xx + yy );

            // last column
            te[ 3 ] = 0;
            te[ 7 ] = 0;
            te[ 11 ] = 0;

            // bottom row
            te[ 12 ] = 0;
            te[ 13 ] = 0;
            te[ 14 ] = 0;
            te[ 15 ] = 1;

            return this;
        }

		/**
		* Creates a look at matrix  from the eye, target and up vectors
		* @param {Vec3} eye The camera position
		* @param {Vec3} target The position to look at
		* @param {Vec3} up The up vector of the camera
		* @returns {Matrix4}
		*/
        lookAt( eye: Vec3, target: Vec3, up: Vec3 ): Matrix4 {
            const te = this.elements;
            const x = Matrix4._t1;
            const y = Matrix4._t2;
            const z = Matrix4._t3;

            z.subVectors( eye, target ).normalize();

            if ( z.length() === 0 ) {
                z.z = 1;
            }

            x.crossVectors( up, z ).normalize();

            if ( x.length() === 0 ) {
                z.x += 0.0001;
                x.crossVectors( up, z ).normalize();

            }

            y.crossVectors( z, x );

            te[ 0 ] = x.x; te[ 4 ] = y.x; te[ 8 ] = z.x;
            te[ 1 ] = x.y; te[ 5 ] = y.y; te[ 9 ] = z.y;
            te[ 2 ] = x.z; te[ 6 ] = y.z; te[ 10 ] = z.z;

            return this;
        }

		/**
		* Multiplies this matrix by m
		* @param {Matrix4} m
		* @returns {Matrix4}
		*/
        multiply( m: Matrix4 ): Matrix4 {
            return this.multiplyMatrices( this, m );
        }

		/**
		* Multiplies matrix a by b and assigns it to this
		* @param {Matrix4} a The first matrix
		* @param {Matrix4} b The second matrix
		* @returns {Matrix4}
		*/
        multiplyMatrices( a: Matrix4, b: Matrix4 ): Matrix4 {
            const ae = a.elements;
            const be = b.elements;
            const te = this.elements;

            const a11 = ae[ 0 ], a12 = ae[ 4 ], a13 = ae[ 8 ], a14 = ae[ 12 ];
            const a21 = ae[ 1 ], a22 = ae[ 5 ], a23 = ae[ 9 ], a24 = ae[ 13 ];
            const a31 = ae[ 2 ], a32 = ae[ 6 ], a33 = ae[ 10 ], a34 = ae[ 14 ];
            const a41 = ae[ 3 ], a42 = ae[ 7 ], a43 = ae[ 11 ], a44 = ae[ 15 ];

            const b11 = be[ 0 ], b12 = be[ 4 ], b13 = be[ 8 ], b14 = be[ 12 ];
            const b21 = be[ 1 ], b22 = be[ 5 ], b23 = be[ 9 ], b24 = be[ 13 ];
            const b31 = be[ 2 ], b32 = be[ 6 ], b33 = be[ 10 ], b34 = be[ 14 ];
            const b41 = be[ 3 ], b42 = be[ 7 ], b43 = be[ 11 ], b44 = be[ 15 ];

            te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
            te[ 4 ] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
            te[ 8 ] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
            te[ 12 ] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

            te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
            te[ 5 ] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
            te[ 9 ] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
            te[ 13 ] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

            te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
            te[ 6 ] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
            te[ 10 ] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
            te[ 14 ] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

            te[ 3 ] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
            te[ 7 ] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
            te[ 11 ] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
            te[ 15 ] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

            return this;
        }

		/**
		* Multiplies matrix a by b and flattens to r
		* @param {Matrix4} a The first matrix
		* @param {Matrix4} b The second matrix
		* @param {Array<number>} r The array to flatten to
		* @returns {Matrix4}
		*/
        multiplyToArray( a: Matrix4, b: Matrix4, r: Array<any> ): Matrix4 {
            const te = this.elements;

            this.multiplyMatrices( a, b );

            r[ 0 ] = te[ 0 ]; r[ 1 ] = te[ 1 ]; r[ 2 ] = te[ 2 ]; r[ 3 ] = te[ 3 ];
            r[ 4 ] = te[ 4 ]; r[ 5 ] = te[ 5 ]; r[ 6 ] = te[ 6 ]; r[ 7 ] = te[ 7 ];
            r[ 8 ] = te[ 8 ]; r[ 9 ] = te[ 9 ]; r[ 10 ] = te[ 10 ]; r[ 11 ] = te[ 11 ];
            r[ 12 ] = te[ 12 ]; r[ 13 ] = te[ 13 ]; r[ 14 ] = te[ 14 ]; r[ 15 ] = te[ 15 ];

            return this;
        }

		/**
		* Multiplies this matrix by a scale
		* @param {number} s The number to scale by
		* @returns {Matrix4}
		*/
        multiplyScalar( s: number ): Matrix4 {
            const te = this.elements;

            te[ 0 ] *= s; te[ 4 ] *= s; te[ 8 ] *= s; te[ 12 ] *= s;
            te[ 1 ] *= s; te[ 5 ] *= s; te[ 9 ] *= s; te[ 13 ] *= s;
            te[ 2 ] *= s; te[ 6 ] *= s; te[ 10 ] *= s; te[ 14 ] *= s;
            te[ 3 ] *= s; te[ 7 ] *= s; te[ 11 ] *= s; te[ 15 ] *= s;

            return this;
        }

		/**
		* Multiplies this matrix by a vector array
		* @param {Array<number>} a The array to multiply with
		* @returns {Array<number>}
		*/
        multiplyVector3Array( a: Array<any> ): Array<any> {
            const v1 = Matrix4._t1;

            for ( let i = 0, il = a.length; i < il; i += 3 ) {

                v1.x = a[ i ];
                v1.y = a[ i + 1 ];
                v1.z = a[ i + 2 ];

                v1.applyProjection( this );

                a[ i ] = v1.x;
                a[ i + 1 ] = v1.y;
                a[ i + 2 ] = v1.z;

            }

            return a;
        }

		/**
		* Gets the determinant of this matrix
		* @returns {number}
		*/
        determinant(): number {
            const te = this.elements;

            const n11 = te[ 0 ], n12 = te[ 4 ], n13 = te[ 8 ], n14 = te[ 12 ];
            const n21 = te[ 1 ], n22 = te[ 5 ], n23 = te[ 9 ], n24 = te[ 13 ];
            const n31 = te[ 2 ], n32 = te[ 6 ], n33 = te[ 10 ], n34 = te[ 14 ];
            const n41 = te[ 3 ], n42 = te[ 7 ], n43 = te[ 11 ], n44 = te[ 15 ];

            return (
                n41 * (
                    +n14 * n23 * n32
                    - n13 * n24 * n32
                    - n14 * n22 * n33
                    + n12 * n24 * n33
                    + n13 * n22 * n34
                    - n12 * n23 * n34
                ) +
                n42 * (
                    +n11 * n23 * n34
                    - n11 * n24 * n33
                    + n14 * n21 * n33
                    - n13 * n21 * n34
                    + n13 * n24 * n31
                    - n14 * n23 * n31
                ) +
                n43 * (
                    +n11 * n24 * n32
                    - n11 * n22 * n34
                    - n14 * n21 * n32
                    + n12 * n21 * n34
                    + n14 * n22 * n31
                    - n12 * n24 * n31
                ) +
                n44 * (
                    -n13 * n22 * n31
                    - n11 * n23 * n32
                    + n11 * n22 * n33
                    + n13 * n21 * n32
                    - n12 * n21 * n33
                    + n12 * n23 * n31
                )

            );
        }

		/**
		* Transposes this matrix
		* @returns {Matrix4}
		*/
        transpose(): Matrix4 {
            const te = this.elements;
            let tmp;

            tmp = te[ 1 ]; te[ 1 ] = te[ 4 ]; te[ 4 ] = tmp;
            tmp = te[ 2 ]; te[ 2 ] = te[ 8 ]; te[ 8 ] = tmp;
            tmp = te[ 6 ]; te[ 6 ] = te[ 9 ]; te[ 9 ] = tmp;

            tmp = te[ 3 ]; te[ 3 ] = te[ 12 ]; te[ 12 ] = tmp;
            tmp = te[ 7 ]; te[ 7 ] = te[ 13 ]; te[ 13 ] = tmp;
            tmp = te[ 11 ]; te[ 11 ] = te[ 14 ]; te[ 14 ] = tmp;

            return this;
        }

		/**
		* Flattens this matrix to an array
		* @param {Array<number>} flat The array to set values on
		* @returns {Array<number>}
		*/
        flattenToArray( flat: Array<any> ): Array<any> {
            const te = this.elements;
            flat[ 0 ] = te[ 0 ]; flat[ 1 ] = te[ 1 ]; flat[ 2 ] = te[ 2 ]; flat[ 3 ] = te[ 3 ];
            flat[ 4 ] = te[ 4 ]; flat[ 5 ] = te[ 5 ]; flat[ 6 ] = te[ 6 ]; flat[ 7 ] = te[ 7 ];
            flat[ 8 ] = te[ 8 ]; flat[ 9 ] = te[ 9 ]; flat[ 10 ] = te[ 10 ]; flat[ 11 ] = te[ 11 ];
            flat[ 12 ] = te[ 12 ]; flat[ 13 ] = te[ 13 ]; flat[ 14 ] = te[ 14 ]; flat[ 15 ] = te[ 15 ];

            return flat;
        }

		/**
		* Flattens the data of this matrix into a float array
		* @param {Float32Array} flat The flattened array
		* @param {number} offset The index offset to start from
		* @returns {Float32Array}
		*/
        flattenToArrayOffset( flat: Float32Array, offset: number ): Float32Array {
            const te = this.elements;
            flat[ offset ] = te[ 0 ];
            flat[ offset + 1 ] = te[ 1 ];
            flat[ offset + 2 ] = te[ 2 ];
            flat[ offset + 3 ] = te[ 3 ];

            flat[ offset + 4 ] = te[ 4 ];
            flat[ offset + 5 ] = te[ 5 ];
            flat[ offset + 6 ] = te[ 6 ];
            flat[ offset + 7 ] = te[ 7 ];

            flat[ offset + 8 ] = te[ 8 ];
            flat[ offset + 9 ] = te[ 9 ];
            flat[ offset + 10 ] = te[ 10 ];
            flat[ offset + 11 ] = te[ 11 ];

            flat[ offset + 12 ] = te[ 12 ];
            flat[ offset + 13 ] = te[ 13 ];
            flat[ offset + 14 ] = te[ 14 ];
            flat[ offset + 15 ] = te[ 15 ];

            return flat;
        }

		/**
		* Sets the translation indices of this matrix
		* @param {Vec3} v The position to set
		* @returns {Matrix4}
		*/
        setPosition( v: Vec3 ): Matrix4 {
            const te = this.elements;

            te[ 12 ] = v.x;
            te[ 13 ] = v.y;
            te[ 14 ] = v.z;

            return this;
        }

		/**
		* Gets the inverse of a matrix m and sets it to this
		* @param {Vec3} m The matrix to extract from
		* @param {boolean} throwOnInvertible If true, an error is thrown for bad values
		* @returns {Matrix4}
		*/
        getInverse( m: Matrix4, throwOnInvertible: boolean = false ): Matrix4 {
            // based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
            const te = this.elements;
            const me = m.elements;

            const n11 = me[ 0 ], n12 = me[ 4 ], n13 = me[ 8 ], n14 = me[ 12 ];
            const n21 = me[ 1 ], n22 = me[ 5 ], n23 = me[ 9 ], n24 = me[ 13 ];
            const n31 = me[ 2 ], n32 = me[ 6 ], n33 = me[ 10 ], n34 = me[ 14 ];
            const n41 = me[ 3 ], n42 = me[ 7 ], n43 = me[ 11 ], n44 = me[ 15 ];

            te[ 0 ] = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
            te[ 4 ] = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
            te[ 8 ] = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
            te[ 12 ] = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;
            te[ 1 ] = n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44;
            te[ 5 ] = n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44;
            te[ 9 ] = n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44;
            te[ 13 ] = n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34;
            te[ 2 ] = n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44;
            te[ 6 ] = n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44;
            te[ 10 ] = n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44;
            te[ 14 ] = n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34;
            te[ 3 ] = n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43;
            te[ 7 ] = n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43;
            te[ 11 ] = n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43;
            te[ 15 ] = n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33;

            const det = n11 * te[ 0 ] + n21 * te[ 4 ] + n31 * te[ 8 ] + n41 * te[ 12 ];

            if ( det === 0 ) {
                const msg = 'Matrix4.getInverse(): can\'t invert matrix, determinant is 0';

                if ( throwOnInvertible || false ) {
                    throw new Error( msg );
                }
                else {
                    console.warn( msg );
                }

                this.identity();

                return this;
            }

            this.multiplyScalar( 1 / det );

            return this;
        }

		/**
		* Scales this matrix by a vector v
		* @param {Vec3} v The vector to scale with
		* @returns {Matrix4}
		*/
        scale( v: Vec3 ): Matrix4 {
            const te = this.elements;
            const x = v.x, y = v.y, z = v.z;

            te[ 0 ] *= x; te[ 4 ] *= y; te[ 8 ] *= z;
            te[ 1 ] *= x; te[ 5 ] *= y; te[ 9 ] *= z;
            te[ 2 ] *= x; te[ 6 ] *= y; te[ 10 ] *= z;
            te[ 3 ] *= x; te[ 7 ] *= y; te[ 11 ] *= z;

            return this;
        }

		/**
		* Gets the maximum scale of the matrix
		* @returns {number}
		*/
        getMaxScaleOnAxis(): number {
            const te = this.elements;

            const scaleXSq = te[ 0 ] * te[ 0 ] + te[ 1 ] * te[ 1 ] + te[ 2 ] * te[ 2 ];
            const scaleYSq = te[ 4 ] * te[ 4 ] + te[ 5 ] * te[ 5 ] + te[ 6 ] * te[ 6 ];
            const scaleZSq = te[ 8 ] * te[ 8 ] + te[ 9 ] * te[ 9 ] + te[ 10 ] * te[ 10 ];

            return Math.sqrt( Math.max( scaleXSq, Math.max( scaleYSq, scaleZSq ) ) );
        }

		/**
		* Builds a translation matrix from x, y, and z
		* @param {number} theta The x position
		* @param {number} theta The y position
		* @param {number} theta The z position
		* @returns {Matrix4}
		*/
        makeTranslation( x: number, y: number, z: number ): Matrix4 {
            this.set(
                1, 0, 0, x,
                0, 1, 0, y,
                0, 0, 1, z,
                0, 0, 0, 1
            );

            return this;
        }

		/**
		* Builds a X axis rotation matrix
		* @param {number} theta The angle in radians
		* @returns {Matrix4}
		*/
        makeRotationX( theta: number ): Matrix4 {
            const c = Math.cos( theta ), s = Math.sin( theta );

            this.set(
                1, 0, 0, 0,
                0, c, -s, 0,
                0, s, c, 0,
                0, 0, 0, 1
            );

            return this;
        }

		/**
		* Builds a Y axis rotation matrix
		* @param {number} theta The angle in radians
		* @returns {Matrix4}
		*/
        makeRotationY( theta: number ): Matrix4 {
            const c = Math.cos( theta ), s = Math.sin( theta );
            this.set(
                c, 0, s, 0,
                0, 1, 0, 0,
                -s, 0, c, 0,
                0, 0, 0, 1
            );

            return this;
        }

		/**
		* Builds a Z axis rotation matrix
		* @param {number} theta The angle in radians
		* @returns {Matrix4}
		*/
        makeRotationZ( theta: number ): Matrix4 {
            const c = Math.cos( theta ), s = Math.sin( theta );
            this.set(
                c, -s, 0, 0,
                s, c, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            );
            return this;
        }

		/**
		* Builds a rotation matrix
		* @param {Vec3} axis The reference
		* @param {number} y The angle in radians
		* @returns {Matrix4}
		*/
        makeRotationAxis( axis, angle: number ): Matrix4 {
            // Based on http://www.gamedev.net/reference/articles/article1199.asp
            const c = Math.cos( angle );
            const s = Math.sin( angle );
            const t = 1 - c;
            const x = axis.x, y = axis.y, z = axis.z;
            const tx = t * x, ty = t * y;

            this.set(
                tx * x + c, tx * y - s * z, tx * z + s * y, 0,
                tx * y + s * z, ty * y + c, ty * z - s * x, 0,
                tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
                0, 0, 0, 1
            );

            return this;
        }

		/**
		* Builds a scale matrix
		* @param {number} x The x scale
		* @param {number} y The y scale
		* @param {number} z The z scale
		* @returns {Matrix4}
		*/
        makeScale( x: number, y: number, z: number ): Matrix4 {
            this.set(
                x, 0, 0, 0,
                0, y, 0, 0,
                0, 0, z, 0,
                0, 0, 0, 1
            );
            return this;
        }

		/**
		* Composes a matrix from a position, scale and rotation
		* @param {Vec3} position The position to build from
		* @param {Quat} quaternion The rotation to build from
		* @param {Vec3} scale The scale to build from
		* @returns {Matrix4}
		*/
        compose( position: Vec3, quaternion: Quat, scale: Vec3 ): Matrix4 {
            this.makeRotationFromQuaternion( quaternion );
            this.scale( scale );
            this.setPosition( position );

            return this;
        }

		/**
		* Decomposes a matrix into its position, scale and rotation
		* @param {Vec3} position The position to output to
		* @param {Quat} quaternion The rotation to extract to
		* @param {Vec3} scale The scale to extract to
		* @returns {Matrix4}
		*/
        decompose( position?: Vec3, quaternion?: Quat, scale?: Vec3 ): Matrix4 {
            const vector = Matrix4._t1;
            const matrix = new Matrix4();

            const te = this.elements;

            let sx = vector.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
            const sy = vector.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
            const sz = vector.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

            // if determine is negative, we need to invert one scale
            const det = this.determinant();
            if ( det < 0 )
                sx = -sx;


            position.x = te[ 12 ];
            position.y = te[ 13 ];
            position.z = te[ 14 ];

            // scale the rotation part

            matrix.elements.set( this.elements ); // at this point matrix is incomplete so we can't use .copy()

            const invSX = 1 / sx;
            const invSY = 1 / sy;
            const invSZ = 1 / sz;

            matrix.elements[ 0 ] *= invSX;
            matrix.elements[ 1 ] *= invSX;
            matrix.elements[ 2 ] *= invSX;

            matrix.elements[ 4 ] *= invSY;
            matrix.elements[ 5 ] *= invSY;
            matrix.elements[ 6 ] *= invSY;

            matrix.elements[ 8 ] *= invSZ;
            matrix.elements[ 9 ] *= invSZ;
            matrix.elements[ 10 ] *= invSZ;

            quaternion.setFromRotationMatrix( matrix );

            scale.x = sx;
            scale.y = sy;
            scale.z = sz;

            return this;
        }

		/**
		* Creates a frustum matrix
		* @param {number} left
		* @param {number} right
		* @param {number} top
		* @param {number} bottom
		* @param {number} near The near distance of the camera
		* @param {number} far The far distance of the camera
		* @returns {Matrix4}
		*/
        makeFrustum( left: number, right: number, bottom: number, top: number, near: number, far: number ): Matrix4 {
            const te = this.elements;
            const x = 2 * near / ( right - left );
            const y = 2 * near / ( top - bottom );

            const a = ( right + left ) / ( right - left );
            const b = ( top + bottom ) / ( top - bottom );
            const c = - ( far + near ) / ( far - near );
            const d = - 2 * far * near / ( far - near );

            te[ 0 ] = x; te[ 4 ] = 0; te[ 8 ] = a; te[ 12 ] = 0;
            te[ 1 ] = 0; te[ 5 ] = y; te[ 9 ] = b; te[ 13 ] = 0;
            te[ 2 ] = 0; te[ 6 ] = 0; te[ 10 ] = c; te[ 14 ] = d;
            te[ 3 ] = 0; te[ 7 ] = 0; te[ 11 ] = - 1; te[ 15 ] = 0;

            return this;
        }

		/**
		* Creates a camera perspective matrix
		* @param {number} fov Field of view
		* @param {number} aspect The aspect ratio to use. Typically width  / height
		* @param {number} near The near distance of the camera
		* @param {number} far The far distance of the camera
		* @returns {Matrix4}
		*/
        makePerspective( fov: number, aspect: number, near: number, far: number ): Matrix4 {
            const ymax = near * Math.tan( MathUtils.degToRad( fov * 0.5 ) );
            const ymin = - ymax;
            const xmin = ymin * aspect;
            const xmax = ymax * aspect;

            return this.makeFrustum( xmin, xmax, ymin, ymax, near, far );
        }

		/**
		* Creates a camera orthographic matrix
		* @param {number} left
		* @param {number} right
		* @param {number} top
		* @param {number} bottom
		* @param {number} near The near distance of the camera
		* @param {number} far The far distance of the camera
		* @returns {Matrix4}
		*/
        makeOrthographic( left: number, right: number, top: number, bottom: number, near: number, far: number ): Matrix4 {
            const te = this.elements;
            const w = right - left;
            const h = top - bottom;
            const p = far - near;

            const x = ( right + left ) / w;
            const y = ( top + bottom ) / h;
            const z = ( far + near ) / p;

            te[ 0 ] = 2 / w; te[ 4 ] = 0; te[ 8 ] = 0; te[ 12 ] = -x;
            te[ 1 ] = 0; te[ 5 ] = 2 / h; te[ 9 ] = 0; te[ 13 ] = -y;
            te[ 2 ] = 0; te[ 6 ] = 0; te[ 10 ] = -2 / p; te[ 14 ] = -z;
            te[ 3 ] = 0; te[ 7 ] = 0; te[ 11 ] = 0; te[ 15 ] = 1;

            return this;
        }

		/**
		* Converts a 16 index array to a matrix
		* @param {Array<number>} array
		* @returns {Matrix4}
		*/
        fromArray( array: Array<any> ): Matrix4 {
            this.elements.set( array );
            return this;
        }

		/**
		* Converts this matrix to an array of numbers
		* @returns {Array<number>}
		*/
        toArray(): Array<any> {
            const te = this.elements;

            return [
                te[ 0 ], te[ 1 ], te[ 2 ], te[ 3 ],
                te[ 4 ], te[ 5 ], te[ 6 ], te[ 7 ],
                te[ 8 ], te[ 9 ], te[ 10 ], te[ 11 ],
                te[ 12 ], te[ 13 ], te[ 14 ], te[ 15 ]
            ];
        }

		/**
		* Creates a cloned copy of this matrix
		* @returns {Matrix4}
		*/
        clone(): Matrix4 {
            const te = this.elements;

            return new Matrix4(
                te[ 0 ], te[ 4 ], te[ 8 ], te[ 12 ],
                te[ 1 ], te[ 5 ], te[ 9 ], te[ 13 ],
                te[ 2 ], te[ 6 ], te[ 10 ], te[ 14 ],
                te[ 3 ], te[ 7 ], te[ 11 ], te[ 15 ]
            );
        }

		/**
		* Gets the Float32Array representation of this vector
		* @returns {Float32Array}
		*/
        get getElements(): Float32Array {
            return this.elements;
        }

		/**
		* Checks if this matrxi is equal to ref by checking each element
		* @param {Matrix4} ref
		* @returns {boolean}
		*/
        equals( ref: Matrix4 ): boolean {
            const te = this.elements;
            const re = ref.elements;
            if ( te[ 0 ] !== re[ 0 ] ) return false;
            if ( te[ 1 ] !== re[ 1 ] ) return false;
            if ( te[ 2 ] !== re[ 2 ] ) return false;
            if ( te[ 3 ] !== re[ 3 ] ) return false;
            if ( te[ 4 ] !== re[ 4 ] ) return false;
            if ( te[ 5 ] !== re[ 5 ] ) return false;
            if ( te[ 6 ] !== re[ 6 ] ) return false;
            if ( te[ 7 ] !== re[ 7 ] ) return false;
            if ( te[ 8 ] !== re[ 8 ] ) return false;
            if ( te[ 9 ] !== re[ 9 ] ) return false;
            if ( te[ 10 ] !== re[ 10 ] ) return false;
            if ( te[ 11 ] !== re[ 11 ] ) return false;
            if ( te[ 12 ] !== re[ 12 ] ) return false;
            if ( te[ 13 ] !== re[ 13 ] ) return false;
            if ( te[ 14 ] !== re[ 14 ] ) return false;
            if ( te[ 15 ] !== re[ 15 ] ) return false;
            return true;
        }
    }
}

