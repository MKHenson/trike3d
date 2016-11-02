namespace Trike {
	/**
	* A simple container that stores an array of Vec3's
	*/
    export class UniformArray<T> {
        public values: Array<T>;
        public elements: Float32Array;
        public componentSize: number;

        constructor( values: Array<T>, componentSize: number ) {
            this.values = values;
            this.componentSize = componentSize;
            this.elements = new Float32Array( componentSize * values.length );
        }

		/**
		* Gets the Float32Array representation of this array
		* @returns {Float32Array}
		*/
        get getElements(): Float32Array {
            const elm = this.elements;
            const values = this.values;
            let offset: number = 0;
            const componentSize: number = this.componentSize;
            let elms: Float32Array;
            let ii, il;

            for ( let i = 0, l = values.length; i < l; i++ ) {
                offset = i * componentSize;
                elms = ( <any>values[ i ] ).getElements;
                for ( ii = 0, il = componentSize; ii < il; ii++ )
                    elm[ offset + ii ] = elms[ ii ];
            }

            return elm;
        }

		/**
		* Sets the points for this array container
		* @param {Array<T>} values
		* @returns {UniformArray<T>}
		*/
        set( values: Array<T> = [] ): UniformArray<T> {
            this.values = values;
            this.elements = new Float32Array( this.componentSize * values.length );
            return this;
        }
    }
}