namespace Trike {
	/**
	* Textures filled with raw data
	*/
    export class DataTexture extends Texture {
        public data: ArrayBufferView;

		/**
		* @param {ArrayBufferView} data Can be either Uint8Array, or Float32Array
		* @param {number} width The width of this texture
		* @param {number} height The height of this texture
		* @param {TextureFormat} format
		* @param {TextureType} type Can be either Uint8Array = TextureType.UnsignedByteType or  Float32Array = TextureType.FloatType
		* @param {number} anisotropy Higher values give better results but are more expensive
		* @param {TextureMapping} mapping The mapping technique for this texture
		* @param {TextureWrapping} wrapS The S wrapping mode for the texture (horizontal)
		* @param {TextureWrapping} wrapT The T wrapping mode for the texture (vertical)
		*/
        constructor( data: ArrayBufferView, width: number, height: number, format?: TextureFormat, type?: TextureType, anisotropy?: number, mapping?: TextureMapping, wrapS?: TextureWrapping, wrapT?: TextureWrapping, magFilter: TextureFilter = TextureFilter.Linear, minFilter: TextureFilter = TextureFilter.Linear ) {
            super( null, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );

            this.data = data;
            this.width = width;
            this.height = height;
            this.generateMipmaps = false;

            if ( !data )
                this.buildCommonDataFormat();
        }


		/**
		* Loads an image into this texure.
		* @param {string} url The image file URI we are loading
		* @param {string} crossOrigin The cross origin for the loader. The default is 'anonymous'
		* @returns {Texture}
		*/
        loadImage( url: string, crossOrigin: string = 'anonymous' ): Texture {
            const binaryLoader: BinaryLoader = new BinaryLoader();
            binaryLoader.on<BinaryLoaderResponses, IBinaryLoaderEvent>( 'binary_success', this.loaded, this );
            binaryLoader.on<BinaryLoaderResponses, IBinaryLoaderEvent>( 'binary_error', this.loaded, this );
            binaryLoader.load( url );

            return this;
        }

		/**
		* Data successfully loaded
		*/
        loaded( response: BinaryLoaderResponses, event: IBinaryLoaderEvent, sender?: BinaryLoader ) {
            sender!.off<BinaryLoaderResponses, IBinaryLoaderEvent>( 'binary_success', this.loaded, this );
            sender!.off<BinaryLoaderResponses, IBinaryLoaderEvent>( 'binary_error', this.loaded, this );

            if ( response === 'binary_error' ) {
                console.error( 'Could not load data texture' );
                this.emit<TextureLoaderEvents, ITextureLoaderEvent>( 'texture_loader_error', { texture: this, previousImage: null, progress: 0, originalEvent: null });
                return;
            }

            // Parse the array buffer based on the data type
            if ( this.type === TextureType.FloatType )
                this.data = new Float32Array( event.buffer );
            else if ( this.type === TextureType.UnsignedByteType )
                this.data = new Uint8Array( event.buffer );

            this.requiresBuild = true;
            this.emit<TextureLoaderEvents, ITextureLoaderEvent>( 'texture_loader_complete', { texture: this, previousImage: this.image, progress: 100, originalEvent: null });
        }


		/**
		* Resizes the data texture. You must re-fill the data object.
		* @param {any} data Must be the same format as the data provided in the constructor
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        resize( data: any, width: number, height: number ) {
            this.width = width;
            this.height = height;
            this.data = data;
            this.requiresBuild = true;
        }


		/**
		* Gets a square of data out of the data array
		*/
        getImageData( left: number, top: number, width: number, height: number ): Array<number> {
            const data: ArrayBufferView = this.data;
            const textureW = this.width;
            const textureH = this.height;
            const numComponents = this.getNumberComponents();
            let index = ( ( textureW * top ) + left ) * numComponents;

            // Make sure within boundaries
            if ( index >= ( <any>this.data ).length )
                return [];
            if ( left + width > textureW )
                width -= ( left + width ) - textureW;
            if ( top + height > textureH )
                height -= ( left + height ) - textureH;
            if ( left < 0 )
                return [];
            if ( top < 0 )
                return [];

            const toReturn: Array<number> = [];

            for ( let y = 0, yl = height; y < yl; y++ ) {
                index = ( ( textureW * ( top + y ) ) + left ) * numComponents;
                for ( let x = 0, xl = width; x < xl; x++ )
                    for ( let c = 0, cl = numComponents; c < cl; c++ )
                        toReturn.push( data[ index + ( x * numComponents + c ) ] );
            }

            return toReturn;
        }

		/**
		* Sets the data values of each component based on the newData array, but only within the rectangular
		* area provided.
		*/
        putImageData( newData: Array<number>, left: number, top: number, width: number, height: number ) {
            const data: ArrayBufferView = this.data;
            const textureW = this.width;
            const textureH = this.height;
            const numComponents = this.getNumberComponents();
            let index = ( ( textureW * top ) + left ) * numComponents;

            // Make sure within boundaries
            if ( index >= ( <any>this.data ).length )
                return;
            if ( left + width > textureW )
                width -= ( left + width ) - textureW;
            if ( top + height > textureH )
                height -= ( left + height ) - textureH;
            if ( left < 0 )
                return;
            if ( top < 0 )
                return;

            const toReturn: Array<number> = [];
            let counter = 0;

            for ( let y = 0, yl = height; y < yl; y++ ) {
                index = ( ( textureW * ( top + y ) ) + left ) * numComponents;

                for ( let x = 0, xl = width; x < xl; x++ )
                    for ( let c = 0, cl = numComponents; c < cl; c++ ) {
                        this.data[ index + ( x * numComponents + c ) ] = newData[ counter ];
                        counter++;
                    }
            }

            return;
        }


		/**
		* Tries to build the data array by looking at the format and type of data texture
		*/
        buildCommonDataFormat() {
            const componentSize: number = this.getNumberComponents();
            const w = this.width;
            const h = this.height;

            // http://books.google.co.uk/books?id=3c-jmWkLNwUC&pg=PA80&lpg=PA80&dq=Int16Array+gl&source=bl&ots=z-tp2x2DAd&sig=2YW_MZ5s8HysyJIhIwTmVjc7QpU&hl=en&sa=X&ei=OSgcVKrpHcmxggSYmYJY&ved=0CCkQ6AEwAQ#v=onepage&q=Int16Array%20gl&f=false
            // Pg 80

            if ( this.type === TextureType.FloatType )
                this.data = new Float32Array( w * h * componentSize );
            else if ( this.type === TextureType.UnsignedByteType )
                this.data = new Uint8Array( w * h * componentSize );

            this.requiresBuild = true;
        }

		/**
		* This function is called to fill the data of a webgl texture.
		*/
        fillTextureBuffer( gl: WebGLRenderingContext, glFormat: number, glType: number, isImagePowerOfTwo: boolean, mipmaps: Array<any> ) {
            let mipmap;

            // use manually created mipmaps if available
            // if there are no manual mipmaps
            // set 0 level mipmap and then use GL to generate other mipmap levels
            if ( mipmaps && mipmaps.length > 0 && isImagePowerOfTwo ) {
                for ( let i = 0, il = mipmaps.length; i < il; i++ ) {
                    mipmap = mipmaps[ i ];
                    gl.texImage2D( gl.TEXTURE_2D, i, glFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data );
                }
            }
            else
                gl.texImage2D( gl.TEXTURE_2D, 0, glFormat, this.width, this.height, 0, glFormat, glType, this.data );
        }
    }
}