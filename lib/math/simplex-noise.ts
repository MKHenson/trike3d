namespace Trike {
	/**
	* Simplex noise is a method for constructing an n-dimensional noise function.
	* It was developed an improvement over Perlin noise. The simplex noise class takes a random
	* number generator to randomly create a noise environment. You can then sample values of that
	* environment in different dimensions.
	*
	* Example usage:
	* const simplex = new SimplexNoise(),
	* value2d = simplex.noise2D( x, y ),
	* value3d = simplex.noise3D( x, y, z ),
	* value4d = simplex.noise4D( x, y, z, w );
	*
	* To use a seeded noise use the following:
	* const randomFunc = Random.Alea([seed]).random,
    * simplex = new SimplexNoise(randomFunc),
    * value2d = simplex.noise2D(x, y);
	*/
    export class SimplexNoise {
        private static F2 = 0.5 * ( Math.sqrt( 3.0 ) - 1.0 );
        private static G2 = ( 3.0 - Math.sqrt( 3.0 ) ) / 6.0;
        private static F3 = 1.0 / 3.0;
        private static G3 = 1.0 / 6.0;
        private static F4 = ( Math.sqrt( 5.0 ) - 1.0 ) / 4.0;
        private static G4 = ( 5.0 - Math.sqrt( 5.0 ) ) / 20.0;

        private p: Uint8Array;
        private perm: Uint8Array;
        private permMod12: Uint8Array;
        private grad3: Float32Array;
        private grad4: Float32Array;

        constructor( random = Math.random ) {
            this.p = new Uint8Array( 256 );
            this.perm = new Uint8Array( 512 );
            this.permMod12 = new Uint8Array( 512 );
            for ( let i = 0; i < 256; i++ ) {
                this.p[ i ] = random() * 256;
            }
            for ( let i = 0; i < 512; i++ ) {
                this.perm[ i ] = this.p[ i & 255 ];
                this.permMod12[ i ] = this.perm[ i ] % 12;
            }

            this.grad3 = new Float32Array( [ 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1,
                -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1 ] );

            this.grad4 = new Float32Array( [ 0, 1, 1, 1, 0, 1, 1, - 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, -1, 1, 1, 0, -1, 1, - 1, 0, -1, -1, 1, 0, -1, -1, -1,
                1, 0, 1, 1, 1, 0, 1, - 1, 1, 0, - 1, 1, 1, 0, - 1, - 1, - 1, 0, 1, 1, - 1, 0, 1, - 1, - 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 1, 0, 1, 1, 1, 0, - 1, 1, - 1, 0, 1, 1, - 1, 0, - 1,
                - 1, 1, 0, 1, - 1, 1, 0, - 1, - 1, - 1, 0, 1, - 1, - 1, 0, - 1, 1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1, 0, - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1, 0 ] );
        }

		/*
		* 2D simplex noise. Use this to generate a number when given three constants.
		* @param {number} x The X constant
		* @param {number} y The Y constant
		* returns {number}
		*/
        noise2D( xin: number, yin: number ): number {
            const permMod12 = this.permMod12,
                perm = this.perm,
                grad3 = this.grad3,
                G2: number = SimplexNoise.G2;
            let n0: number = 0, n1: number = 0, n2: number = 0; // Noise contributions from the three corners
            // Skew the input space to determine which simplex cell we're in
            const s: number = ( xin + yin ) * SimplexNoise.F2; // Hairy factor for 2D
            const i: number = Math.floor( xin + s );
            const j: number = Math.floor( yin + s );
            const t: number = ( i + j ) * G2;
            const X0: number = i - t; // Unskew the cell origin back to (x,y) space
            const Y0: number = j - t;
            const x0: number = xin - X0; // The x,y distances from the cell origin
            const y0: number = yin - Y0;
            // For the 2D case, the simplex shape is an equilateral triangle.
            // Determine which simplex we are in.
            let i1: number, j1: number; // Offsets for second (middle) corner of simplex in (i,j) coords
            if ( x0 > y0 ) {
                i1 = 1;
                j1 = 0;
            } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
            else {
                i1 = 0;
                j1 = 1;
            } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
            // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
            // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
            // c = (3-sqrt(3))/6
            const x1: number = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
            const y1: number = y0 - j1 + G2;
            const x2: number = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
            const y2: number = y0 - 1.0 + 2.0 * G2;
            // Work out the hashed gradient indices of the three simplex corners
            const ii: number = i & 255;
            const jj: number = j & 255;
            // Calculate the contribution from the three corners
            let t0: number = 0.5 - x0 * x0 - y0 * y0;
            if ( t0 >= 0 ) {
                const gi0: number = permMod12[ ii + perm[ jj ] ] * 3;
                t0 *= t0;
                n0 = t0 * t0 * ( grad3[ gi0 ] * x0 + grad3[ gi0 + 1 ] * y0 ); // (x,y) of grad3 used for 2D gradient
            }
            let t1: number = 0.5 - x1 * x1 - y1 * y1;
            if ( t1 >= 0 ) {
                const gi1: number = permMod12[ ii + i1 + perm[ jj + j1 ] ] * 3;
                t1 *= t1;
                n1 = t1 * t1 * ( grad3[ gi1 ] * x1 + grad3[ gi1 + 1 ] * y1 );
            }
            let t2: number = 0.5 - x2 * x2 - y2 * y2;
            if ( t2 >= 0 ) {
                const gi2: number = permMod12[ ii + 1 + perm[ jj + 1 ] ] * 3;
                t2 *= t2;
                n2 = t2 * t2 * ( grad3[ gi2 ] * x2 + grad3[ gi2 + 1 ] * y2 );
            }
            // Add contributions from each corner to get the final noise value.
            // The result is scaled to return values in the interval [-1,1].
            return 70.0 * ( n0 + n1 + n2 );
        }

		/*
		* 3D simplex noise. Use this to generate a number when given three constants.
		* @param {number} x The X constant
		* @param {number} y The Y constant
		* @param {number} z The Z constant
		* returns {number}
		*/
        noise3D( xin: number, yin: number, zin: number ): number {
            const permMod12 = this.permMod12,
                perm = this.perm,
                grad3 = this.grad3,
                G3: number = SimplexNoise.G3,
                F3: number = SimplexNoise.F3;
            let n0: number, n1: number, n2: number, n3: number; // Noise contributions from the four corners
            // Skew the input space to determine which simplex cell we're in
            const s: number = ( xin + yin + zin ) * F3; // Very nice and simple skew factor for 3D
            const i: number = Math.floor( xin + s );
            const j: number = Math.floor( yin + s );
            const k: number = Math.floor( zin + s );
            const t: number = ( i + j + k ) * G3;
            const X0: number = i - t; // Unskew the cell origin back to (x,y,z) space
            const Y0: number = j - t;
            const Z0: number = k - t;
            const x0: number = xin - X0; // The x,y,z distances from the cell origin
            const y0: number = yin - Y0;
            const z0: number = zin - Z0;
            // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
            // Determine which simplex we are in.
            let i1: number, j1: number, k1: number; // Offsets for second corner of simplex in (i,j,k) coords
            let i2: number, j2: number, k2: number; // Offsets for third corner of simplex in (i,j,k) coords
            if ( x0 >= y0 ) {
                if ( y0 >= z0 ) {
                    i1 = 1;
                    j1 = 0;
                    k1 = 0;
                    i2 = 1;
                    j2 = 1;
                    k2 = 0;
                } // X Y Z order
                else if ( x0 >= z0 ) {
                    i1 = 1;
                    j1 = 0;
                    k1 = 0;
                    i2 = 1;
                    j2 = 0;
                    k2 = 1;
                } // X Z Y order
                else {
                    i1 = 0;
                    j1 = 0;
                    k1 = 1;
                    i2 = 1;
                    j2 = 0;
                    k2 = 1;
                } // Z X Y order
            }
            else { // x0<y0
                if ( y0 < z0 ) {
                    i1 = 0;
                    j1 = 0;
                    k1 = 1;
                    i2 = 0;
                    j2 = 1;
                    k2 = 1;
                } // Z Y X order
                else if ( x0 < z0 ) {
                    i1 = 0;
                    j1 = 1;
                    k1 = 0;
                    i2 = 0;
                    j2 = 1;
                    k2 = 1;
                } // Y Z X order
                else {
                    i1 = 0;
                    j1 = 1;
                    k1 = 0;
                    i2 = 1;
                    j2 = 1;
                    k2 = 0;
                } // Y X Z order
            }
            // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
            // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
            // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
            // c = 1/6.
            const x1: number = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
            const y1: number = y0 - j1 + G3;
            const z1: number = z0 - k1 + G3;
            const x2: number = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
            const y2: number = y0 - j2 + 2.0 * G3;
            const z2: number = z0 - k2 + 2.0 * G3;
            const x3: number = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
            const y3: number = y0 - 1.0 + 3.0 * G3;
            const z3: number = z0 - 1.0 + 3.0 * G3;
            // Work out the hashed gradient indices of the four simplex corners
            const ii: number = i & 255;
            const jj: number = j & 255;
            const kk: number = k & 255;
            // Calculate the contribution from the four corners
            let t0: number = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
            if ( t0 < 0 ) n0 = 0.0;
            else {
                const gi0: number = permMod12[ ii + perm[ jj + perm[ kk ] ] ] * 3;
                t0 *= t0;
                n0 = t0 * t0 * ( grad3[ gi0 ] * x0 + grad3[ gi0 + 1 ] * y0 + grad3[ gi0 + 2 ] * z0 );
            }
            let t1: number = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
            if ( t1 < 0 ) n1 = 0.0;
            else {
                const gi1: number = permMod12[ ii + i1 + perm[ jj + j1 + perm[ kk + k1 ] ] ] * 3;
                t1 *= t1;
                n1 = t1 * t1 * ( grad3[ gi1 ] * x1 + grad3[ gi1 + 1 ] * y1 + grad3[ gi1 + 2 ] * z1 );
            }
            let t2: number = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
            if ( t2 < 0 ) n2 = 0.0;
            else {
                const gi2: number = permMod12[ ii + i2 + perm[ jj + j2 + perm[ kk + k2 ] ] ] * 3;
                t2 *= t2;
                n2 = t2 * t2 * ( grad3[ gi2 ] * x2 + grad3[ gi2 + 1 ] * y2 + grad3[ gi2 + 2 ] * z2 );
            }
            let t3: number = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
            if ( t3 < 0 ) n3 = 0.0;
            else {
                const gi3: number = permMod12[ ii + 1 + perm[ jj + 1 + perm[ kk + 1 ] ] ] * 3;
                t3 *= t3;
                n3 = t3 * t3 * ( grad3[ gi3 ] * x3 + grad3[ gi3 + 1 ] * y3 + grad3[ gi3 + 2 ] * z3 );
            }
            // Add contributions from each corner to get the final noise value.
            // The result is scaled to stay just inside [-1,1]
            return 32.0 * ( n0 + n1 + n2 + n3 );
        }
		/*
		* 4D simplex noise. Use this to generate a number when given four constants.
		* @param {number} x The X constant
		* @param {number} y The Y constant
		* @param {number} z The Z constant
		* @param {number} w The W constant
		* returns {number}
		*/
        noise4D( x: number, y: number, z: number, w: number ): number {
            const permMod12 = this.permMod12,
                perm = this.perm,
                grad4 = this.grad4,
                G4: number = SimplexNoise.G4,
                F4: number = SimplexNoise.F4;

            let n0: number, n1: number, n2: number, n3: number, n4: number; // Noise contributions from the five corners
            // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
            const s: number = ( x + y + z + w ) * F4; // Factor for 4D skewing
            const i: number = Math.floor( x + s );
            const j: number = Math.floor( y + s );
            const k: number = Math.floor( z + s );
            const l: number = Math.floor( w + s );
            const t: number = ( i + j + k + l ) * G4; // Factor for 4D unskewing
            const X0: number = i - t; // Unskew the cell origin back to (x,y,z,w) space
            const Y0: number = j - t;
            const Z0: number = k - t;
            const W0: number = l - t;
            const x0: number = x - X0; // The x,y,z,w distances from the cell origin
            const y0: number = y - Y0;
            const z0: number = z - Z0;
            const w0: number = w - W0;
            // For the 4D case, the simplex is a 4D shape I won't even try to describe.
            // To find out which of the 24 possible simplices we're in, we need to
            // determine the magnitude ordering of x0, y0, z0 and w0.
            // Six pair-wise comparisons are performed between each possible pair
            // of the four coordinates, and the results are used to rank the numbers.
            let rankx: number = 0;
            let ranky: number = 0;
            let rankz: number = 0;
            let rankw: number = 0;
            if ( x0 > y0 ) rankx++;
            else ranky++;
            if ( x0 > z0 ) rankx++;
            else rankz++;
            if ( x0 > w0 ) rankx++;
            else rankw++;
            if ( y0 > z0 ) ranky++;
            else rankz++;
            if ( y0 > w0 ) ranky++;
            else rankw++;
            if ( z0 > w0 ) rankz++;
            else rankw++;
            let i1: number, j1: number, k1: number, l1: number; // The integer offsets for the second simplex corner
            let i2: number, j2: number, k2: number, l2: number; // The integer offsets for the third simplex corner
            let i3: number, j3: number, k3: number, l3: number; // The integer offsets for the fourth simplex corner
            // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
            // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
            // impossible. Only the 24 indices which have non-zero entries make any sense.
            // We use a thresholding to set the coordinates in turn from the largest magnitude.
            // Rank 3 denotes the largest coordinate.
            i1 = rankx >= 3 ? 1 : 0;
            j1 = ranky >= 3 ? 1 : 0;
            k1 = rankz >= 3 ? 1 : 0;
            l1 = rankw >= 3 ? 1 : 0;
            // Rank 2 denotes the second largest coordinate.
            i2 = rankx >= 2 ? 1 : 0;
            j2 = ranky >= 2 ? 1 : 0;
            k2 = rankz >= 2 ? 1 : 0;
            l2 = rankw >= 2 ? 1 : 0;
            // Rank 1 denotes the second smallest coordinate.
            i3 = rankx >= 1 ? 1 : 0;
            j3 = ranky >= 1 ? 1 : 0;
            k3 = rankz >= 1 ? 1 : 0;
            l3 = rankw >= 1 ? 1 : 0;
            // The fifth corner has all coordinate offsets = 1, so no need to compute that.
            const x1: number = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
            const y1: number = y0 - j1 + G4;
            const z1: number = z0 - k1 + G4;
            const w1: number = w0 - l1 + G4;
            const x2: number = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
            const y2: number = y0 - j2 + 2.0 * G4;
            const z2: number = z0 - k2 + 2.0 * G4;
            const w2: number = w0 - l2 + 2.0 * G4;
            const x3: number = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
            const y3: number = y0 - j3 + 3.0 * G4;
            const z3: number = z0 - k3 + 3.0 * G4;
            const w3: number = w0 - l3 + 3.0 * G4;
            const x4: number = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
            const y4: number = y0 - 1.0 + 4.0 * G4;
            const z4: number = z0 - 1.0 + 4.0 * G4;
            const w4: number = w0 - 1.0 + 4.0 * G4;
            // Work out the hashed gradient indices of the five simplex corners
            const ii: number = i & 255;
            const jj: number = j & 255;
            const kk: number = k & 255;
            const ll: number = l & 255;
            // Calculate the contribution from the five corners
            let t0: number = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
            if ( t0 < 0 ) n0 = 0.0;
            else {
                const gi0: number = ( perm[ ii + perm[ jj + perm[ kk + perm[ ll ] ] ] ] % 32 ) * 4;
                t0 *= t0;
                n0 = t0 * t0 * ( grad4[ gi0 ] * x0 + grad4[ gi0 + 1 ] * y0 + grad4[ gi0 + 2 ] * z0 + grad4[ gi0 + 3 ] * w0 );
            }
            let t1: number = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
            if ( t1 < 0 ) n1 = 0.0;
            else {
                const gi1: number = ( perm[ ii + i1 + perm[ jj + j1 + perm[ kk + k1 + perm[ ll + l1 ] ] ] ] % 32 ) * 4;
                t1 *= t1;
                n1 = t1 * t1 * ( grad4[ gi1 ] * x1 + grad4[ gi1 + 1 ] * y1 + grad4[ gi1 + 2 ] * z1 + grad4[ gi1 + 3 ] * w1 );
            }
            let t2: number = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
            if ( t2 < 0 ) n2 = 0.0;
            else {
                const gi2: number = ( perm[ ii + i2 + perm[ jj + j2 + perm[ kk + k2 + perm[ ll + l2 ] ] ] ] % 32 ) * 4;
                t2 *= t2;
                n2 = t2 * t2 * ( grad4[ gi2 ] * x2 + grad4[ gi2 + 1 ] * y2 + grad4[ gi2 + 2 ] * z2 + grad4[ gi2 + 3 ] * w2 );
            }
            let t3: number = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
            if ( t3 < 0 ) n3 = 0.0;
            else {
                const gi3: number = ( perm[ ii + i3 + perm[ jj + j3 + perm[ kk + k3 + perm[ ll + l3 ] ] ] ] % 32 ) * 4;
                t3 *= t3;
                n3 = t3 * t3 * ( grad4[ gi3 ] * x3 + grad4[ gi3 + 1 ] * y3 + grad4[ gi3 + 2 ] * z3 + grad4[ gi3 + 3 ] * w3 );
            }
            let t4: number = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
            if ( t4 < 0 ) n4 = 0.0;
            else {
                const gi4: number = ( perm[ ii + 1 + perm[ jj + 1 + perm[ kk + 1 + perm[ ll + 1 ] ] ] ] % 32 ) * 4;
                t4 *= t4;
                n4 = t4 * t4 * ( grad4[ gi4 ] * x4 + grad4[ gi4 + 1 ] * y4 + grad4[ gi4 + 2 ] * z4 + grad4[ gi4 + 3 ] * w4 );
            }
            // Sum up and scale the result to cover the range [-1,1]
            return 27.0 * ( n0 + n1 + n2 + n3 + n4 );
        }
    }
}