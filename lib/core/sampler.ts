namespace Trike {
    // http://jsperf.com/pixel-interpolation/2
    export class Sampler {
        static clamp( lo, value, hi ): number {
            return value < lo ? lo : value > hi ? hi : value;
        }

        static nearest( pixels: Uint8Array, x: number, y: number, offset: number, width: number ): number {
            return pixels[ offset + Math.round( y ) * width * 4 + Math.round( x ) * 4 ];
        }

        static nearest_unrolled( pixels: Uint8Array, x: number, y: number, width ): Array<number> {
            const yw4x4 = ( ( y + 0.5 ) ^ 0 ) * width * 4 + ( ( x + 0.5 ) ^ 0 ) * 4;
            return [
                pixels[ yw4x4 ],
                pixels[ yw4x4 + 1 ],
                pixels[ yw4x4 + 2 ]
            ];
        }

        static bilinear( pixels: Uint8Array, x: number, y: number, offset: number, width: number ): number {
            const percentX = 1.0 - ( x - Math.floor( x ) );
            const percentY = y - Math.floor( y );

            const top = pixels[ offset + Math.ceil( y ) * width * 4 + Math.floor( x ) * 4 ] * percentX + pixels[ offset + Math.ceil( y ) * width * 4 + Math.ceil( x ) * 4 ] * ( 1.0 - percentX );
            const bottom = pixels[ offset + Math.floor( y ) * width * 4 + Math.floor( x ) * 4 ] * percentX + pixels[ offset + Math.floor( y ) * width * 4 + Math.ceil( x ) * 4 ] * ( 1.0 - percentX );

            return top * percentY + bottom * ( 1.0 - percentY );
        }

        static bilinear_optimized( pixels: Uint8Array, x: number, y: number, offset: number, width: number ): number {
            const percentX = x - ( x ^ 0 );
            const percentX1 = 1.0 - percentX;
            const percentY = y - ( y ^ 0 );
            const fx4 = ( x ^ 0 ) * 4;
            const cx4 = fx4 + 4;
            const fy4 = ( y ^ 0 ) * 4;
            const cy4wo = ( fy4 + 4 ) * width + offset;
            const fy4wo = fy4 * width + offset;

            const top = pixels[ cy4wo + fx4 ] * percentX1 + pixels[ cy4wo + cx4 ] * percentX;
            const bottom = pixels[ fy4wo + fx4 ] * percentX1 + pixels[ fy4wo + cx4 ] * percentX;

            return top * percentY + bottom * ( 1.0 - percentY );
        }

        static bilinear_unrolled( pixels: Uint8Array, x: number, y: number, width: number ): Array<number> {
            const percentX = x - ( x ^ 0 );
            const percentX1 = 1.0 - percentX;
            const percentY = y - ( y ^ 0 );
            const percentY1 = 1.0 - percentY;
            const fx4 = ( x ^ 0 ) * 4;
            const cx4 = fx4 + 4;
            const fy4 = ( y ^ 0 ) * 4;
            const cy4wr = ( fy4 + 4 ) * width;
            const fy4wr = fy4 * width;
            const cy4wg = cy4wr + 1;
            const fy4wg = fy4wr + 1;
            const cy4wb = cy4wr + 2;
            const fy4wb = fy4wr + 2;
            let top, bottom, r, g, b;

            top = pixels[ cy4wr + fx4 ] * percentX1 + pixels[ cy4wr + cx4 ] * percentX;
            bottom = pixels[ fy4wr + fx4 ] * percentX1 + pixels[ fy4wr + cx4 ] * percentX;
            r = top * percentY + bottom * percentY1;

            top = pixels[ cy4wg + fx4 ] * percentX1 + pixels[ cy4wg + cx4 ] * percentX;
            bottom = pixels[ fy4wg + fx4 ] * percentX1 + pixels[ fy4wg + cx4 ] * percentX;
            g = top * percentY + bottom * percentY1;

            top = pixels[ cy4wb + fx4 ] * percentX1 + pixels[ cy4wb + cx4 ] * percentX;
            bottom = pixels[ fy4wb + fx4 ] * percentX1 + pixels[ fy4wb + cx4 ] * percentX;
            b = top * percentY + bottom * percentY1;

            return [ r, g, b ];
        }

        static bicubic_value( x: number, a, b, c, d ): number {
            return Sampler.clamp( 0, 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * x ) * x ) * x + b, 255 );
        }

        static bicubic( pixels: Uint8Array, x: number, y: number, offset: number, width: number ): number {
            const v = [ 0, 0, 0, 0 ];
            const fx = Math.floor( x );
            const fy = Math.floor( y );
            const percentX = x - fx;
            const percentY = y - fy;

            for ( let i = -1; i < 3; i++ ) {
                const yw4o = ( fy + i ) * width * 4 + offset;
                v[ i + 1 ] = ( Sampler.bicubic_value( percentX, pixels[ ( fy + i ) * width * 4 + ( fx - 1 ) * 4 + offset ], pixels[ ( fy + i ) * width * 4 + fx * 4 + offset ], pixels[ ( fy + i ) * width * 4 + ( fx + 1 ) * 4 + offset ], pixels[ ( fy + i ) * width * 4 + ( fx + 2 ) * 4 + offset ] ) );
            }

            return Math.floor( Sampler.bicubic_value( percentY, v[ 0 ], v[ 1 ], v[ 2 ], v[ 3 ] ) );
        }

        static bicubic_optimized( pixels: Uint8Array, x: number, y: number, offset: number, width: number ): number {
            let a, b, c, d, v0, v1, v2, v3;
            const fx = x ^ 0;
            const fy = y ^ 0;
            const percentX = x - fx;
            const percentY = y - fy;

            const fx14 = fx * 4;
            const fx04 = fx14 - 4;
            const fx24 = fx14 + 4;
            const fx34 = fx14 + 8;
            const w4 = width * 4;
            const yw14o = fy * w4 + offset;
            const yw04o = yw14o - w4;
            const yw24o = yw14o + w4;
            const yw34o = yw14o + w4 + w4;

            a = pixels[ yw04o + fx04 ];
            b = pixels[ yw04o + fx14 ];
            c = pixels[ yw04o + fx24 ];
            d = pixels[ yw04o + fx34 ];
            v0 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v0 = v0 > 255 ? 255 : v0 < 0 ? 0 : v0;

            a = pixels[ yw14o + fx04 ];
            b = pixels[ yw14o + fx14 ];
            c = pixels[ yw14o + fx24 ];
            d = pixels[ yw14o + fx34 ];
            v1 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v1 = v1 > 255 ? 255 : v1 < 0 ? 0 : v1;

            a = pixels[ yw24o + fx04 ];
            b = pixels[ yw24o + fx14 ];
            c = pixels[ yw24o + fx24 ];
            d = pixels[ yw24o + fx34 ];
            v2 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v2 = v2 > 255 ? 255 : v2 < 0 ? 0 : v2;

            a = pixels[ yw34o + fx04 ];
            b = pixels[ yw34o + fx14 ];
            c = pixels[ yw34o + fx24 ];
            d = pixels[ yw34o + fx34 ];
            v3 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v3 = v3 > 255 ? 255 : v3 < 0 ? 0 : v3;

            a = v0;
            b = v1;
            c = v2;
            d = v3;
            a = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentY ) * percentY ) * percentY + b;
            return a > 255 ? 255 : a < 0 ? 0 : a ^ 0;
        }

        static bicubic_unrolled( pixels: Uint8Array, x: number, y: number, width: number ): Array<number> {
            let a, b, c, d, v0, v1, v2, v3, r, g;
            const fx = x ^ 0;
            const fy = y ^ 0;
            const percentX = x - fx;
            const percentY = y - fy;

            const fx14 = fx * 4;
            const fx04 = fx14 - 4;
            const fx24 = fx14 + 4;
            const fx34 = fx14 + 8;
            const w4 = width * 4;
            const yw14r = fy * w4;
            const yw04r = yw14r - w4;
            const yw24r = yw14r + w4;
            const yw34r = yw14r + w4 + w4;
            const yw14g = yw14r + 1;
            const yw04g = yw04r + 1;
            const yw24g = yw24r + 1;
            const yw34g = yw34r + 1;
            const yw14b = yw14r + 2;
            const yw04b = yw04r + 2;
            const yw24b = yw24r + 2;
            const yw34b = yw34r + 2;

            // Red
            a = pixels[ yw04r + fx04 ];
            b = pixels[ yw04r + fx14 ];
            c = pixels[ yw04r + fx24 ];
            d = pixels[ yw04r + fx34 ];
            v0 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v0 = v0 > 255 ? 255 : v0 < 0 ? 0 : v0;

            a = pixels[ yw14r + fx04 ];
            b = pixels[ yw14r + fx14 ];
            c = pixels[ yw14r + fx24 ];
            d = pixels[ yw14r + fx34 ];
            v1 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v1 = v1 > 255 ? 255 : v1 < 0 ? 0 : v1;

            a = pixels[ yw24r + fx04 ];
            b = pixels[ yw24r + fx14 ];
            c = pixels[ yw24r + fx24 ];
            d = pixels[ yw24r + fx34 ];
            v2 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v2 = v2 > 255 ? 255 : v2 < 0 ? 0 : v2;

            a = pixels[ yw34r + fx04 ];
            b = pixels[ yw34r + fx14 ];
            c = pixels[ yw34r + fx24 ];
            d = pixels[ yw34r + fx34 ];
            v3 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v3 = v3 > 255 ? 255 : v3 < 0 ? 0 : v3;

            a = v0;
            b = v1;
            c = v2;
            d = v3;
            r = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentY ) * percentY ) * percentY + b;
            r = r > 255 ? 255 : r < 0 ? 0 : r ^ 0;

            // Green
            a = pixels[ yw04g + fx04 ];
            b = pixels[ yw04g + fx14 ];
            c = pixels[ yw04g + fx24 ];
            d = pixels[ yw04g + fx34 ];
            v0 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v0 = v0 > 255 ? 255 : v0 < 0 ? 0 : v0;

            a = pixels[ yw14g + fx04 ];
            b = pixels[ yw14g + fx14 ];
            c = pixels[ yw14g + fx24 ];
            d = pixels[ yw14g + fx34 ];
            v1 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v1 = v1 > 255 ? 255 : v1 < 0 ? 0 : v1;

            a = pixels[ yw24g + fx04 ];
            b = pixels[ yw24g + fx14 ];
            c = pixels[ yw24g + fx24 ];
            d = pixels[ yw24g + fx34 ];
            v2 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v2 = v2 > 255 ? 255 : v2 < 0 ? 0 : v2;

            a = pixels[ yw34g + fx04 ];
            b = pixels[ yw34g + fx14 ];
            c = pixels[ yw34g + fx24 ];
            d = pixels[ yw34g + fx34 ];
            v3 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v3 = v3 > 255 ? 255 : v3 < 0 ? 0 : v3;

            a = v0;
            b = v1;
            c = v2;
            d = v3;
            g = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentY ) * percentY ) * percentY + b;
            g = g > 255 ? 255 : g < 0 ? 0 : g ^ 0;

            // Blue
            a = pixels[ yw04b + fx04 ];
            b = pixels[ yw04b + fx14 ];
            c = pixels[ yw04b + fx24 ];
            d = pixels[ yw04b + fx34 ];
            v0 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v0 = v0 > 255 ? 255 : v0 < 0 ? 0 : v0;

            a = pixels[ yw14b + fx04 ];
            b = pixels[ yw14b + fx14 ];
            c = pixels[ yw14b + fx24 ];
            d = pixels[ yw14b + fx34 ];
            v1 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v1 = v1 > 255 ? 255 : v1 < 0 ? 0 : v1;

            a = pixels[ yw24b + fx04 ];
            b = pixels[ yw24b + fx14 ];
            c = pixels[ yw24b + fx24 ];
            d = pixels[ yw24b + fx34 ];
            v2 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v2 = v2 > 255 ? 255 : v2 < 0 ? 0 : v2;

            a = pixels[ yw34b + fx04 ];
            b = pixels[ yw34b + fx14 ];
            c = pixels[ yw34b + fx24 ];
            d = pixels[ yw34b + fx34 ];
            v3 = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentX ) * percentX ) * percentX + b;
            v3 = v3 > 255 ? 255 : v3 < 0 ? 0 : v3;

            a = v0;
            b = v1;
            c = v2;
            d = v3;
            b = 0.5 * ( c - a + ( 2.0 * a - 5.0 * b + 4.0 * c - d + ( 3.0 * ( b - c ) + d - a ) * percentY ) * percentY ) * percentY + b;
            b = b > 255 ? 255 : b < 0 ? 0 : b ^ 0;

            return [ r, g, b ];
        }
    }
}