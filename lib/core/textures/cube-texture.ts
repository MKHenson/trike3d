namespace Trike {
	/**
	* A {CubeTexture} in Trike is a wrapper for a webgl cube texture that is made of 6 images/canvases.
	* You use an index between 0 - 5 to access each of the images. The renderer will transform the
	* images into Canvas objects before being rendered. This is done so that the images are kept at a
	* consistent width and height. Webgl will throw an error if any of the images is a different dimension.
	* You can use the loadImages and setImage function to update the texture.
	*/
    export class CubeTexture extends TextureBase {
        private _canvases: Array<HTMLCanvasElement>;
        private _imageLoaders: Array<HTMLImageElement>;

        // For loading images
        private _proxyComplete: any;
        private _proxyProgress: any;
        private _proxyError: any;

        private _flipY;
        private _premultiplyAlpha: boolean;
        private _unpackAlignment: number;

		/**
		* Creates an instance of the Texture
		* @param {TextureWrapping} wrapS The S wrapping mode for the texture (horizontal)
		* @param {TextureWrapping} wrapT The T wrapping mode for the texture (vertical)
		* @param {TextureFilter} magFilter The filter to use when magnifying the image
		* @param {TextureFilter} minFilter The filter to use when minifying the image
		* @param {TextureFormat} format The texture format
		* @param {TextureType} type The texture type
		* @param {number} anisotropy Higher values give better results but are more expensive
		*/
        constructor( wrapS?: TextureWrapping, wrapT?: TextureWrapping, magFilter?: TextureFilter, minFilter?: TextureFilter, format?: TextureFormat, type?: TextureType, anisotropy?: number ) {
            super( 0, 0, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );


            this._canvases = new Array<HTMLCanvasElement>( 6 );
            this._imageLoaders = new Array<HTMLImageElement>( 6 );
            this.requiresBuild = true;
            this._flipY = false;
            this._premultiplyAlpha = false;

            // valid values: 1, 2, 4, 8 (see http://www.khronos.org/opengles/sdk/docs/man/xhtml/glPixelStorei.xml)
            this._unpackAlignment = 4;

            // Fill the images with the default
            for ( let i = 0; i < 6; i++ ) {
                this._imageLoaders[ i ] = TextureBase.defaultImage;
                this._canvases[ i ] = document.createElement( 'canvas' );

                // Draw the contents of the default image in each canvas
                this._canvases[ i ].width = TextureBase.defaultImage.width;
                this._canvases[ i ].height = TextureBase.defaultImage.height;

                const context = this._canvases[ i ].getContext( '2d' );
                context.drawImage( TextureBase.defaultImage, 0, 0 );
            }
        }

		/**
		* This ensures that all of the images used in the cube texture are a consistent height and width.
		*/
        private resizeImages() {
            let maxHeight: number = 0;
            let maxWidth: number = 0;

            for ( let i = 0; i < 6; i++ ) {
                if ( this._imageLoaders[ i ].width > maxWidth )
                    maxWidth = this._imageLoaders[ i ].width;
                if ( this._imageLoaders[ i ].height > maxHeight )
                    maxHeight = this._imageLoaders[ i ].height;
            }

            // Re-draw each canvas to the max height and width
            for ( let i = 0; i < 6; i++ ) {
                // Resize the canvases so that they are the same size as the biggest image
                this._canvases[ i ].width = maxWidth;
                this._canvases[ i ].height = maxHeight;

                const context = this._canvases[ i ].getContext( '2d' );
                context.drawImage( this._imageLoaders[ i ], 0, 0, maxWidth, maxHeight );
            }

            this.width = maxWidth;
            this.height = maxHeight;
        }

		/**
		* Loads an image into this texure.
		* @param {string} url The image file URI we are loading
		* @param {number} index The index of which image we are loading
		* @param {string} crossOrigin The cross origin for the loader. The default is 'anonymous'
		* @returns {CubeTexture}
		*/
        loadImageAtIndex( url: string, index: number, crossOrigin: string = 'anonymous' ): CubeTexture {
            if ( index > 5 )
                throw new Error( 'You cannot set an index higher than 5. There are 6 sides to a cube (0 is inclusive).' );


            // If null or empty use the default image
            if ( url === '' || !url ) {
                this._imageLoaders[ index ] = TextureBase.defaultImage;
                this.requiresBuild = true;
                this.resizeImages();
                return;
            }

            // Create the proxies if not already created
            if ( !this._proxyComplete ) {
                this._proxyComplete = this._onComplete.bind( this );
                this._proxyProgress = this._onProgress.bind( this );
                this._proxyError = this._onError.bind( this );
            }

            this._imageLoaders[ index ] = document.createElement( 'img' );

            const loader: HTMLImageElement = this._imageLoaders[ index ];

            if ( crossOrigin !== undefined )
                loader.crossOrigin = crossOrigin;

            loader.addEventListener( 'load', this._proxyComplete );
            loader.addEventListener( 'progress', this._proxyProgress );
            loader.addEventListener( 'error', this._proxyError );
            loader.src = url;

            return this;
        }

		/**
		* Builds the webgl texture and fills the buffer data
		* @param {WebGLRenderingContext} gl The WebGLRenderingContext we are using to compile the texture with
		* @param {number} slot The slot we can use to build this texture. This is provided by the Renderer
		*/
        public compile( gl: WebGLRenderingContext, slot: number ) {
            if ( this.webglTexture ) {
                gl.deleteTexture( this.webglTexture );
                this.webglTexture = null;
            }

            // Create the texture
            this.webglTexture = gl.createTexture();

            // Bind it so we can set the params
            gl.activeTexture( slot );
            gl.bindTexture( gl.TEXTURE_CUBE_MAP, this.webglTexture );

            // Now set the texture parameters
            gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, ( this._flipY ? 1 : 0 ) );
            gl.pixelStorei( gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, ( this._premultiplyAlpha ? 1 : 0 ) );
            gl.pixelStorei( gl.UNPACK_ALIGNMENT, this._unpackAlignment );

            // Local vars
            const image = this._canvases[ 0 ];
            const isImagePowerOfTwo = Texture.isPowerOfTwo( image.width ) && Texture.isPowerOfTwo( image.height );
            const glFormat = Trike.getGLParam( this.format, gl );
            const glType = Trike.getGLParam( this.type, gl );
            const generateMipmaps = this.generateMipmaps;

            // Sets the different texture filters.
            Texture.setFilters( this, gl, gl.TEXTURE_CUBE_MAP, isImagePowerOfTwo );

            // Fill the buffers with the texture maps
            for ( let i = 0; i < 6; i++ )
                gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, glFormat, glFormat, glType, this._canvases[ i ] );


            if ( this.generateMipmaps && isImagePowerOfTwo )
                gl.generateMipmap( gl.TEXTURE_CUBE_MAP );


            this.requiresBuild = false;
            gl.bindTexture( gl.TEXTURE_2D, null );
        }

        /** Each time we make progress on the download */
        private _onProgress( e ) {
            let index: number = 0;

            for ( let i = 0; i < 6; i++ )
                if ( this._imageLoaders[ i ] === e.target ) {
                    index = i;
                    break;
                }

            const percentLoaded: number = e.loaded / e.total * 100;
            this.emit<TextureLoaderEvents, ITextureLoaderEvent>( 'texture_loader_progress', { texture: this, previousImage: null, progress: percentLoaded, originalEvent: e, index: index });
        }

        /** Error downloading file */
        private _onError( e ) {
            let imageLoader: HTMLImageElement = null;
            let index: number = 0;

            for ( let i = 0; i < 6; i++ )
                if ( this._imageLoaders[ i ] === e.target ) {
                    // this._images[i] = e.target;
                    imageLoader = e.target;
                    this._imageLoaders[ i ] = TextureBase.defaultImage;
                    index = i;
                    break;
                }

            imageLoader.removeEventListener( 'load', this._proxyComplete );
            imageLoader.removeEventListener( 'progress', this._proxyProgress );
            imageLoader.removeEventListener( 'error', this._proxyError );
            this.emit<TextureLoaderEvents, ITextureLoaderEvent>( 'texture_loader_error', { texture: this, previousImage: null, progress: 0, originalEvent: e, index: index });
        }

        /** File loaded */
        private _onComplete( e ) {
            let imageLoader: HTMLImageElement = null;
            let index: number = 0;

            for ( let i = 0; i < 6; i++ )
                if ( this._imageLoaders[ i ] === e.target ) {
                    this._imageLoaders[ i ] = e.target;
                    imageLoader = e.target;
                    index = i;
                    break;
                }

            imageLoader.removeEventListener( 'load', this._proxyComplete );
            imageLoader.removeEventListener( 'progress', this._proxyProgress );
            imageLoader.removeEventListener( 'error', this._proxyError );

            this.requiresBuild = true;
            this.resizeImages();
            this.emit<TextureLoaderEvents, ITextureLoaderEvent>( 'texture_loader_complete', { texture: this, previousImage: null, progress: 100, originalEvent: e, index: index });
        }

		/**
		* Cleans up the references and frees the memory buffers
		*/
        dispose() {
            super.dispose();

            let imageLoader: HTMLImageElement;
            for ( let i = 0; i < 6; i++ ) {
                imageLoader = this._imageLoaders[ i ];
                if ( !imageLoader )
                    continue;

                imageLoader.removeEventListener( 'load', this._proxyComplete );
                imageLoader.removeEventListener( 'progress', this._proxyProgress );
                imageLoader.removeEventListener( 'error', this._proxyError );
            }

            this._canvases = null;
            this._imageLoaders = null;
            this._proxyComplete = null;
            this._proxyProgress = null;
            this._proxyError = null;
        }
    }
}