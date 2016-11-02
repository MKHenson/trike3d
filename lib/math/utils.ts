namespace Trike {
	/**
	* A collection of useful math utils
	*/
    export class MathUtils {
        private static degreeToRadiansFactor: number = Math.PI / 180;
        private static radianToDegreesFactor: number = 180 / Math.PI;

		/**
		* Converts from degrees to radians
		* @param {number} degrees
		* @returns {number}
		*/
        static degToRad( degrees: number ): number {
            return degrees * MathUtils.degreeToRadiansFactor;
        }

		/**
		* Converts from radians to degrees
		* @param {number} radians
		* @returns {number}
		*/
        static radToDeg( radians: number ): number {
            return radians * MathUtils.radianToDegreesFactor;
        }

		/**
		* Clamps a number x between a and b
		* @param {number} x
		* @param {number} a
		* @param {number} b
		* @returns {number}
		*/
        static clamp( x: number, a: number, b: number ): number {
            return ( x < a ) ? a : ( ( x > b ) ? b : x );
        }

		/**
		* Gets the sign of a number
		* @param {number} x
		* @returns {number} -1 or 1
		*/
        static sign( x: number ): number {
            return ( x < 0 ) ? - 1 : ( x > 0 ) ? 1 : 0;
        }

		/**
		* Checks if a number is a power of 2
		* @param {number} value
		* @returns {boolean}
		*/
        static isPowerOfTwo( value: number ): boolean {
            return ( value & ( value - 1 ) ) === 0 && value !== 0;
        }

		/**
		* Smoothstep is a scalar interpolation function commonly used in computer graphics and video game engines.
		* The function interpolates smoothly between two input values based on a third one that should be
		* between the first two. The returned value is clamped between 0 and 1.
		* @param {number} min
		* @param {number} max
		* @param {number} value
		* @returns {number}
		*/
        static smoothstep( min: number, max: number, value: number ): number {
            const x = Math.max( 0, Math.min( 1, ( value - min ) / ( max - min ) ) );
            return x * x * ( 3 - 2 * x );
        }
    }
}