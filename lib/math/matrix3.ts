namespace Trike {
    export class Matrix3 {
        public elements: Float32Array;

        constructor( n11?: number, n12?: number, n13?: number, n21?: number, n22?: number, n23?: number, n31?: number, n32?: number, n33?: number ) {
            this.elements = new Float32Array( 9 );

            this.set(
                ( n11 !== undefined ) ? n11 : 1, n12 || 0, n13 || 0,
                n21 || 0, ( n22 !== undefined ) ? n22 : 1, n23 || 0,
                n31 || 0, n32 || 0, ( n33 !== undefined ) ? n33 : 1
            );
        }

        set( n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number ): Matrix3 {
            const te = this.elements;
            te[ 0 ] = n11; te[ 3 ] = n12; te[ 6 ] = n13;
            te[ 1 ] = n21; te[ 4 ] = n22; te[ 7 ] = n23;
            te[ 2 ] = n31; te[ 5 ] = n32; te[ 8 ] = n33;
            return this;
        }

        identity(): Matrix3 {
            this.set(
                1, 0, 0,
                0, 1, 0,
                0, 0, 1
            );
            return this;
        }

        copy( m: Matrix3 ): Matrix3 {
            const me = m.elements;

            this.set(
                me[ 0 ], me[ 3 ], me[ 6 ],
                me[ 1 ], me[ 4 ], me[ 7 ],
                me[ 2 ], me[ 5 ], me[ 8 ]
            );

            return this;
        }

        multiplyScalar( s: number ): Matrix3 {
            const te = this.elements;
            te[ 0 ] *= s; te[ 3 ] *= s; te[ 6 ] *= s;
            te[ 1 ] *= s; te[ 4 ] *= s; te[ 7 ] *= s;
            te[ 2 ] *= s; te[ 5 ] *= s; te[ 8 ] *= s;
            return this;
        }

        determinant(): number {
            const te = this.elements;

            const a = te[ 0 ], b = te[ 1 ], c = te[ 2 ],
                d = te[ 3 ], e = te[ 4 ], f = te[ 5 ],
                g = te[ 6 ], h = te[ 7 ], i = te[ 8 ];

            return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
        }

        getInverse( matrix: Matrix4, throwOnInvertible: boolean = false ): Matrix3 {
            // input: THREE.Matrix4
            // ( based on http://code.google.com/p/webgl-mjs/ )
            const me = matrix.elements;
            const te = this.elements;

            te[ 0 ] = me[ 10 ] * me[ 5 ] - me[ 6 ] * me[ 9 ];
            te[ 1 ] = - me[ 10 ] * me[ 1 ] + me[ 2 ] * me[ 9 ];
            te[ 2 ] = me[ 6 ] * me[ 1 ] - me[ 2 ] * me[ 5 ];
            te[ 3 ] = - me[ 10 ] * me[ 4 ] + me[ 6 ] * me[ 8 ];
            te[ 4 ] = me[ 10 ] * me[ 0 ] - me[ 2 ] * me[ 8 ];
            te[ 5 ] = - me[ 6 ] * me[ 0 ] + me[ 2 ] * me[ 4 ];
            te[ 6 ] = me[ 9 ] * me[ 4 ] - me[ 5 ] * me[ 8 ];
            te[ 7 ] = - me[ 9 ] * me[ 0 ] + me[ 1 ] * me[ 8 ];
            te[ 8 ] = me[ 5 ] * me[ 0 ] - me[ 1 ] * me[ 4 ];

            const det = me[ 0 ] * te[ 0 ] + me[ 1 ] * te[ 3 ] + me[ 2 ] * te[ 6 ];

            // no inverse
            if ( det === 0 ) {
                const msg = 'Matrix3.getInverse(): can\'t invert matrix, determinant is 0';

                if ( throwOnInvertible || false ) {
                    throw new Error( msg );
                }
                else {
                    console.warn( msg );
                }

                this.identity();
                return this;
            }

            this.multiplyScalar( 1.0 / det );
            return this;
        }

        transpose(): Matrix3 {
            let tmp, m = this.elements;

            tmp = m[ 1 ]; m[ 1 ] = m[ 3 ]; m[ 3 ] = tmp;
            tmp = m[ 2 ]; m[ 2 ] = m[ 6 ]; m[ 6 ] = tmp;
            tmp = m[ 5 ]; m[ 5 ] = m[ 7 ]; m[ 7 ] = tmp;

            return this;
        }

        getNormalMatrix( m: Matrix4 ): Matrix3 {
            // input: THREE.Matrix4
            this.getInverse( m ).transpose();
            return this;
        }

        transposeIntoArray( r: Array<any> ): Matrix3 {
            const m = this.elements;

            r[ 0 ] = m[ 0 ];
            r[ 1 ] = m[ 3 ];
            r[ 2 ] = m[ 6 ];
            r[ 3 ] = m[ 1 ];
            r[ 4 ] = m[ 4 ];
            r[ 5 ] = m[ 7 ];
            r[ 6 ] = m[ 2 ];
            r[ 7 ] = m[ 5 ];
            r[ 8 ] = m[ 8 ];

            return this;
        }

        clone(): Matrix3 {
            const te = this.elements;

            return new Matrix3
                (
                te[ 0 ], te[ 3 ], te[ 6 ],
                te[ 1 ], te[ 4 ], te[ 7 ],
                te[ 2 ], te[ 5 ], te[ 8 ]
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
            return true;
        }
    }
}

