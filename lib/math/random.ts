namespace Trike {
	/**
	* Internal class used to create an AleaRand
	*/
    function Mash() {
        let n = 0xefc8249d;

        const mash = function( data ) {
            data = data.toString();
            for ( let i = 0; i < data.length; i++ ) {
                n += data.charCodeAt( i );
                let h = 0.02519603282416938 * n;
                n = h >>> 0;
                h -= n;
                h *= n;
                n = h >>> 0;
                h -= n;
                n += h * 0x100000000; // 2^32
            }
            return ( n >>> 0 ) * 2.3283064365386963e-10; // 2^-32
        };

        return mash;
    }

	/**
	* A random number generator class that allows you to use seeded random numbers
	*/
    export class AleaRand {
        public s0: number;
        public s1: number;
        public s2: number;
        public c: number;

        constructor( s0: number, s1: number, s2: number, c: number ) {
            this.s0 = s0;
            this.s1 = s1;
            this.s2 = s2;
            this.c = c;
        }

        random(): number {
            let s0 = this.s0, s1 = this.s1, s2 = this.s2, c = this.c;
            const t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
            s0 = s1;
            s1 = s2;
            return s2 = t - ( c = t | 0 );
        }

        uint32(): number {
            return this.random() * 0x100000000; // 2^32
        }

        fract53(): number {
            return this.random() +
                ( this.random() * 0x200000 | 0 ) * 1.1102230246251565e-16; // 2^-53
        }
    }

	/**
	* A Collection of random generators
	*/
    export class Random {
		/**
		* Returns a random point inside of a sphere.
		* @param {number} radius The radius of the sphere
		* @param {Vec3} center [Optional] The center position of the sphere
		* @param {Vec3} ref [Optional] Pass in the vector to be filled
		* @param {boolean} uniform [Optional] If true, the point uses a more complex formula to make it more distributed
		* @returns {Vec3}
		*/
        static pointInsideSphere( radius: number = 1, center?: Vec3, ref?: Vec3, uniform: boolean = true ): Vec3 {
            const toRet: Vec3 = ref || new Vec3();

            if ( uniform === false ) {
                const u = Math.random();
                const v = Math.random();
                const theta = 2 * Math.PI * u;
                const phi = Math.acos( 2 * v - 1 );
                const radiusRandom = Math.random() * radius;

                toRet.x = ( center ? center.x : 0 ) + ( radiusRandom * Math.sin( phi ) * Math.cos( theta ) );
                toRet.y = ( center ? center.y : 0 ) + ( radiusRandom * Math.sin( phi ) * Math.sin( theta ) );
                toRet.z = ( center ? center.z : 0 ) + ( radiusRandom * Math.cos( phi ) );
            }
            else {
                const theta = Math.random() * Math.PI * 2;
                const o = Math.acos( 2 * Math.random() - 1 );
                const r = radius * ( Math.pow( Math.random(), 0.3333333333333333 ) );
                const sinO = Math.sin( o );
                toRet.x = ( center ? center.x : 0 ) + r * Math.cos( theta ) * sinO;
                toRet.y = ( center ? center.y : 0 ) + r * Math.sin( theta ) * sinO;
                toRet.z = ( center ? center.z : 0 ) + r * Math.cos( o );
            }

            return toRet;
        }


		/**
		* Returns a random point on the radius of a sphere.
		* @param {number} radius The radius of the sphere
		* @param {Vec3} center [Optional] The center position of the sphere
		* @param {Vec3} ref [Optional] Pass in the vector to be filled
		* @returns {Vec3}
		*/
        static pointOnSphere( radius: number = 1, center?: Vec3, ref?: Vec3 ): Vec3 {
            const toRet: Vec3 = ref || new Vec3();

            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos( 2 * v - 1 );

            toRet.x = ( center ? center.x : 0 ) + ( radius * Math.sin( phi ) * Math.cos( theta ) );
            toRet.y = ( center ? center.y : 0 ) + ( radius * Math.sin( phi ) * Math.sin( theta ) );
            toRet.z = ( center ? center.z : 0 ) + ( radius * Math.cos( phi ) );

            return toRet;
        }

		/**
		* Returns a random point inside of a box.
		* @param {number} width The width of the box
		* @param {number} height The height of the box
		* @param {number} depth The depth of the box
		* @param {Vec3} center [Optional] The center position of the box
		* @param {Vec3} ref [Optional] Pass in the vector to be filled
		* @returns {Vec3}
		*/
        static pointInsideBox( width: number = 1, height: number = 1, depth: number = 1, center?: Vec3, ref?: Vec3 ): Vec3 {
            const toRet: Vec3 = ref || new Vec3();

            toRet.x = Math.random() * width - ( width * 0.5 ) + ( center ? center.x : 0 );
            toRet.y = Math.random() * height - ( height * 0.5 ) + ( center ? center.y : 0 );
            toRet.z = Math.random() * depth - ( depth * 0.5 ) + ( center ? center.z : 0 );

            return toRet;
        }


		/**
		* Creates a random number generator that allows you to use seeded random numbers
		* returns {AleaRand}
		*/
        static Alea( args: Array<number> = [ +new Date ] ): AleaRand {
            let s0 = 0;
            let s1 = 0;
            let s2 = 0;
            let c = 1;

            let mash = Mash();
            s0 = mash( ' ' );
            s1 = mash( ' ' );
            s2 = mash( ' ' );

            for ( let i = 0; i < args.length; i++ ) {
                s0 -= mash( args[ i ] );
                if ( s0 < 0 ) {
                    s0 += 1;
                }
                s1 -= mash( args[ i ] );
                if ( s1 < 0 ) {
                    s1 += 1;
                }
                s2 -= mash( args[ i ] );
                if ( s2 < 0 ) {
                    s2 += 1;
                }
            }

            mash = null;
            const random = new AleaRand( s0, s1, s2, c );
            return random;
        }
    }
}