namespace Trike {
	/*
	* A Class of useful interpolater functions
	* http://flashcove.net/795/cubic-spline-generation-in-as3-catmull-rom-curves/
	*/
    export class Interpolater {
		/**
		* Catmull works by specifying 4 control points p0, p1, p2, p3 and a weight. The function is used to calculate a point n between p1 and p2 based
		* on the weight. The weight is normalized, so if it's a value of 0 then the return value will be p1 and if its 1 it will return p2.
		* @param {number} p0 The first control point. If set to p1 then the interpolation will start from p1 exactly
		* @param {number} p1 The first value
		* @param {number} p2 The second value
		* @param {number} p3 The second control point. If set to p3 then the interpolation will start from p1 exactly
		* @param {number} weight The normalized weight, ideally from 0 to 1
		* @returns {number}
		*/
        static catmullRom( p0: number, p1: number, p2: number, p3: number, weight: number ): number {
            const weight2: number = weight * weight;
            const weight3: number = weight2 * weight;
            const v0 = ( p2 - p0 ) * 0.5,
                v1 = ( p3 - p1 ) * 0.5;

            return ( 2 * ( p1 - p2 ) + v0 + v1 ) * weight3 + ( - 3 * ( p1 - p2 ) - 2 * v0 - v1 ) * weight2 + v0 * weight + p1;
        }

		/**
		* Interpolates between two numbers based on a weight
		* @param {number} a The first number
		* @param {number} b The second number
		* @param {number} weight The normalized weight, ideally from 0 to 1
		* @returns {number}
		*/
        static interpolate( a, b, weight: number ): number {
            return a + ( b - a ) * weight;
        }

		/**
		* Same as catmullRom, but optimized to work with {Vec2}
		* @param {Vec2} p0 The first control point. If set to p1 then the interpolation will start from p1 exactly
		* @param {Vec2} p1 The first value
		* @param {Vec2} p2 The second value
		* @param {Vec2} p3 The second control point. If set to p3 then the interpolation will start from p1 exactly
		* @param {number} weight The normalized weight, ideally from 0 to 1
		* @returns {Vec2}
		*/
        static catmullRomV2( p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, weight: number, out?: Vec2 ): Vec2 {
            const u3 = weight * weight * weight;
            const u2 = weight * weight;
            const f1 = -0.5 * u3 + u2 - 0.5 * weight;
            const f2 = 1.5 * u3 - 2.5 * u2 + 1.0;
            const f3 = -1.5 * u3 + 2.0 * u2 + 0.5 * weight;
            const f4 = 0.5 * u3 - 0.5 * u2;
            const x = p0.x * f1 + p1.x * f2 + p2.x * f3 + p3.x * f4;
            const y = p0.y * f1 + p1.y * f2 + p2.y * f3 + p3.y * f4;
            return ( out ? out.set( x, y ) : new Vec2( x, y ) );
        }

		/**
		* Calculates a point on a line, from a set of graph points using catmul-rom interpolation.
		* Given an array of 2D points representing a graph over two axes x and y.
		* We query each of the points using a queryValue that tests which of the
		* points is closest based on the desired query axis. For example if your array of points represents
		* values (y) over time (x); you can query a value v at time 0.2 like so
		* catmulValueFromGraph(points, 0.2, x)
		* @param {Array<Vec2>} points The control points that represent the graph
		* @param {number} queryValue The value to check
		* @param {string} queryAxis The axis to check values against
		* @param {Vec2} out [Optional] Specify a vector to fill instead of creating a new one
		* @returns {Vec2}
		*/
        static catmulValueFromGraph( points: Array<Vec2>, queryValue: number, queryAxis: string = 'x', out?: Vec2 ): Vec2 {
            let p0: Vec2 = null,
                p1: Vec2 = null,
                p2: Vec2 = null,
                p3: Vec2 = null;

            for ( let i = 0, l = points.length; i < l; i++ ) {
                if ( i > 0 )
                    p0 = points[ i - 1 ];
                else
                    p0 = points[ i ];

                p1 = points[ i ];

                if ( i + 1 < l )
                    p2 = points[ i + 1 ];
                else
                    p2 = points[ i ];

                if ( i + 2 < l )
                    p3 = points[ i + 1 ];
                else
                    p3 = points[ i ];


                if ( queryValue >= p1[ queryAxis ] && queryValue <= p2[ queryAxis ] ) {
                    const weight = ( queryValue - p1[ queryAxis ] ) / ( p2[ queryAxis ] - p1[ queryAxis ] );
                    return Interpolater.catmullRomV2( p0, p1, p2, p3, weight, out );
                }
            }

            return null;
        }


		/**
		* Creates a interpolated path array of 2D points from a given path. The granularity of the out array
		* is decided by the number of intervals.
		* @param {Array<Vec2>} path The path you want to smooth out
		* @param {number} interval The interval of each sample
		* @param {Array<Vec2>} out [Optional]
		* @returns {Array<Vec2>}
		*/
        static catmullRomPathV2( path: Array<Vec2>, interval: number = 0.01, out: Array<Vec2> = [] ): Array<Vec2> {
            if ( path === null )
                return;

            for ( let i = 0, l = path.length; i < l - 1; i++ ) {
                let ui = 0;
                for ( let u = 0.0; u < 1.0; u += interval ) {
                    let vec = new Vec2();
                    vec = Interpolater.catmullRomV2(
                        path[ Math.max( 0, i - 1 ) ],
                        path[ i ],
                        path[ Math.min( i + 1, l - 1 ) ],
                        path[ Math.min( i + 2, l - 1 ) ],
                        u
                    );

                    out.push( vec );   // store each value
                    ui++;
                }
            }

            return out;
        }

		/**
		* Creates a interpolated path array of 3D points from a given path. The granularity of the out array
		* @param {Array<Vec3>} path The path you want to smooth out
		* @param {number} interval The interval of each sample
		* @param {Array<Vec3>} out [Optional]
		* @returns {Array<Vec3>}
		*/
        static catmullRomPathV3( path: Array<Vec3>, interval: number = 0.01, out: Array<Vec3> = [] ): Array<Vec3> {
            if ( path === null )
                return;

            let pa: Vec3, pb: Vec3, pc: Vec3, pd: Vec3;

            for ( let i = 0, l = path.length; i < l - 1; i++ ) {
                let ui = 0;
                for ( let u = 0.0; u < 1.0; u += interval ) {
                    pa = path[ Math.max( 0, i - 1 ) ];
                    pb = path[ i ];
                    pc = path[ Math.min( i + 1, l - 1 ) ];
                    pd = path[ Math.min( i + 2, l - 1 ) ];

                    const vec = new Vec3();
                    vec.x = Interpolater.catmullRom( pa.x, pb.x, pc.x, pd.x, u );
                    vec.y = Interpolater.catmullRom( pa.y, pb.y, pc.y, pd.y, u );
                    vec.z = Interpolater.catmullRom( pa.z, pb.z, pc.z, pd.z, u );

                    out.push( vec );   // store each value
                    ui++;
                }
            }

            return out;
        }
    }
}