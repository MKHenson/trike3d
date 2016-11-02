namespace Trike {
    export class Vec2 {
        public x: number;
        public y: number;
        public elements: Float32Array;

        constructor( x?: number, y?: number ) {
            this.x = x || 0;
            this.y = y || 0;
            this.elements = new Float32Array( 2 );
        }

		/**
		* Gets the Float32Array representation of this vector
		* @returns {Float32Array}
		*/
        get getElements(): Float32Array {
            const elm = this.elements;
            elm[ 0 ] = this.x;
            elm[ 1 ] = this.y;
            return elm;
        }

		/**
		* Sets the x and y component of this vector
		* @param {number} x The x component
		* @param {number} y The y component
		* @returns {Vec2}
		*/
        set( x: number, y: number ): Vec2 {
            this.x = x;
            this.y = y;
            return this;
        }

		/**
		* Sets the x
		* @param {number} x The x component
		* @returns {Vec2}
		*/
        setX( x: number ): Vec2 {
            this.x = x;
            return this;
        }

		/**
		* Sets y component of this vector
		* @param {number} y The y component
		* @returns {Vec2}
		*/
        setY( y: number ): Vec2 {
            this.y = y;
            return this;
        }

		/**
		* Sets the x and y component of this vector by index
		* @param {number} index An index number representing the component's x or y
		* @param {number} y The new value to set the component
		* @returns {Vec2}
		*/
        setComponent( index: number, value: number ): Vec2 {
            switch ( index ) {
                case 0: this.x = value; break;
                case 1: this.y = value; break;
                default: throw new Error( 'index is out of range: ' + index );
            }

            return this;
        }

		/**
		* Gets a value of this vector by its index
		* @param {number} index The index of the component to get
		* @returns {number}
		*/
        getComponent( index: number ): number {
            switch ( index ) {
                case 0: return this.x;
                case 1: return this.y;
                default: throw new Error( 'index is out of range: ' + index );
            }
        }

		/**
		* Sets the x and y component of this vector by copying it from another vector
		* @param {Vec2} v The vector to copy from
		* @returns {Vec2}
		*/
        copy( v: Vec2 ): Vec2 {
            this.x = v.x;
            this.y = v.y;
            return this;
        }

		/**
		* Adds the x and y component of a separate vector
		* @param {Vec2} v The vector to get values from
		* @returns {Vec2}
		*/
        add( v: Vec2 ): Vec2 {
            this.x += v.x;
            this.y += v.y;
            return this;
        }

		/**
		* Adds the values of 2 vectors and assigns it to this vector
		* @param {Vec2} a The first vector
		* @param {Vec2} b The second vector
		* @returns {Vec2}
		*/
        addVectors( a: Vec2, b: Vec2 ): Vec2 {
            this.x = a.x + b.x;
            this.y = a.y + b.y;
            return this;
        }

		/**
		* Adds a number to both components
		* @param {number} s The number to add
		* @returns {Vec2}
		*/
        addScalar( s: number ): Vec2 {
            this.x += s;
            this.y += s;
            return this;
        }

		/**
		* Subtracts the components from a separate vector
		* @param {Vec2} v The vector we are subtracting
		* @returns {Vec2}
		*/
        sub( v: Vec2 ): Vec2 {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        }

		/**
		* Subtracts the vector a with b and assigngs the result to this vector
		* @param {Vec2} a  The first vector
		* @param {Vec2} b The second vector
		* @returns {Vec2}
		*/
        subVectors( a: Vec2, b: Vec2 ): Vec2 {
            this.x = a.x - b.x;
            this.y = a.y - b.y;
            return this;
        }

		/**
		* Multiples the components of this vector with a number s
		* @param {number} s The scalar to multiple with
		* @returns {Vec2}
		*/
        multiplyScalar( s: number ): Vec2 {
            this.x *= s;
            this.y *= s;
            return this;
        }


		/**
		* Multiplies the vector v with this vector
		* @param {Vec2} v The vector to multiple with
		* @returns {Vec2}
		*/
        multiply( v: Vec2 ): Vec2 {
            this.x *= v.x;
            this.y *= v.y;
            return this;
        }

		/**
		* Multiplies a and b with x and y respectively. Same as multiply but with numbers instead of a vector
		* @param {number} a The first number
		* @param {number} b The second number
		* @returns {Vec2}
		*/
        multiply2( a: number, b: number ): Vec2 {
            this.x *= a;
            this.y *= b;
            return this;
        }


		/**
		* Multiplies the vector a with b and assigns the result to this vector
		* @param {number} a The first vector
		* @param {number} b The second vector
		* @returns {Vec2}
		*/
        multiplyVectors( a: Vec2, b: Vec2 ): Vec2 {
            this.x = a.x * b.x;
            this.y = a.y * b.y;
            return this;
        }

		/**
		* Multiplies the vector with a number s
		* @param {number} s The number to multiple with
		* @returns {Vec2}
		*/
        divideScalar( s: number ): Vec2 {
            if ( s !== 0 ) {
                const invScalar = 1 / s;
                this.x *= invScalar;
                this.y *= invScalar;
            }
            else {
                this.x = 0;
                this.y = 0;
            }

            return this;
        }

		/**
		* Finds the lowest values from Vector v or this vector and applies it to x and y
		* @param {Vec2} v The vector we are checking against
		* @returns {Vec2}
		*/
        min( v: Vec2 ): Vec2 {
            if ( this.x > v.x )
                this.x = v.x;

            if ( this.y > v.y )
                this.y = v.y;

            return this;
        }

		/**
		* Finds the highest values from Vector v or this vector and applies it to x and y
		* @param {Vec2} v The vector we are checking against
		* @returns {Vec2}
		*/
        max( v: Vec2 ): Vec2 {
            if ( this.x < v.x )
                this.x = v.x;

            if ( this.y < v.y )
                this.y = v.y;

            return this;
        }

		/**
		* Clamps the lowest and highest values from Vector min and max and applies it to x and y if
		* the components of this vector are outside either's range
		* @param {Vec2} min The minimum values
		* @param {Vec2} max The maximum values
		* @returns {Vec2}
		*/
        clamp( min: Vec2, max: Vec2 ): Vec2 {
            // This function assumes min < max, if this assumption isn't true it will not operate correctly
            if ( this.x < min.x )
                this.x = min.x;
            else if ( this.x > max.x )
                this.x = max.x;

            if ( this.y < min.y )
                this.y = min.y;
            else if ( this.y > max.y )
                this.y = max.y;

            return this;
        }

		/**
		* Multiples this vector by a negative scalar
		* @returns {Vec2}
		*/
        negate(): Vec2 {
            return this.multiplyScalar( - 1 );
        }

		/**
		* Returns the dot product of this vector with vector v
		* @param {Vec2} v The vector to dot with
		* @returns {Vec2}
		*/
        dot( v: Vec2 ): number {
            return this.x * v.x + this.y * v.y;
        }

		/**
		* Returns the square of each component added together
		* @returns {number}
		*/
        lengthSq(): number {
            return this.x * this.x + this.y * this.y;
        }


		/**
		* Returns the length of this vector
		* @returns {number}
		*/
        length(): number {
            return Math.sqrt( this.x * this.x + this.y * this.y );
        }

		/**
		* Normalizes the values of this vector so they are between 0 and 1
		* @returns {Vec2}
		*/
        normalize(): Vec2 {
            return this.divideScalar( this.length() );
        }

		/**
		* Returns the distance to a vector v
		* @param {Vec2} v The target vector
		* @returns {number}
		*/
        distanceTo( v: Vec2 ): number {
            return Math.sqrt( this.distanceToSquared( v ) );
        }

		/**
		* Returns the distance to a vector v squared
		* @param {Vec2} v The target vector
		* @returns {number}
		*/
        distanceToSquared( v: Vec2 ): number {
            const dx = this.x - v.x, dy = this.y - v.y;
            return dx * dx + dy * dy;
        }

		/**
		* Sets the length of this vector
		* @param {number} l The new vector size
		* @returns {Vec2}
		*/
        setLength( l: number ): Vec2 {
            const oldLength = this.length();

            if ( oldLength !== 0 && l !== oldLength )
                this.multiplyScalar( l / oldLength );

            return this;
        }

		/**
		* Linear interpolation of the vector v at point a. The result is applied to this vector
		* @param {Vec2} v The vector to interpolate
		* @param {number} a The alpha value (between 0 and 1)
		* @returns {Vec2}
		*/
        lerp( v: Vec2, a: number ): Vec2 {
            this.x += ( v.x - this.x ) * a;
            this.y += ( v.y - this.y ) * a;
            return this;
        }

		/**
		* Tests for equality with vector v
		* @param {Vec2} v The vector to test
		* @returns {boolean}
		*/
        equals( v: Vec2 ): boolean {
            return ( ( v.x === this.x ) && ( v.y === this.y ) );
        }

		/**
		* Sets the components of this vector from an array
		* @param {Array<number>} v The array to get values from
		* @returns {Vec2}
		*/
        fromArray( array: Array<number> ): Vec2 {
            this.x = array[ 0 ];
            this.y = array[ 1 ];
            return this;
        }

		/**
		* Creates an array from this vector
		* @returns {Array<number>}
		*/
        toArray(): Array<number> {
            return [ this.x, this.y ];
        }

		/**
		* Gets an angle to a vector v
		* @param {Vec2} v The target vector
		* @param {boolean} signed If true, the returned angle's sign is intact. If not the angle is always between 0 - 180
		* @returns {number}
		*/
        angleTo( v: Vec2, signed: boolean ): number {
            if ( signed )
                return Math.atan2( this.x * v.y - this.y * v.x, this.dot( v ) );

            return Math.acos( this.dot( v ) / ( this.length() * v.length() ) );
        }

		/**
		* Clones this vector
		* @returns {Vec2}
		*/
        clone(): Vec2 {
            return new Vec2( this.x, this.y );
        }
    }
}