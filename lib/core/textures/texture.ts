namespace Trike {
	/**
	* A wrapper class for webgl textures
	*/
    export class Texture extends TextureBase {
        public image: HTMLImageElement;
        public flipY: boolean;
        public premultiplyAlpha: boolean;
        public unpackAlignment: number;

        public mapping: TextureMapping;
        public mipmaps: Array<ImageData>;
        public offset: Vec2;
        public repeat: Vec2;


        // For loading images
        private _imageLoader: HTMLImageElement;
        private _proxyComplete: any;
        private _proxyProgress: any;
        private _proxyError: any;

		/**
		* Creates an instance of the Texture
		* @param {HTMLImageElement} image Optional image to use
		* @param {TextureMapping} mapping The mapping technique for this texture
		* @param {TextureWrapping} wrapS The S wrapping mode for the texture (horizontal)
		* @param {TextureWrapping} wrapT The T wrapping mode for the texture (vertical)
		* @param {TextureFilter} magFilter The filter to use when magnifying the image
		* @param {TextureFilter} minFilter The filter to use when minifying the image
		* @param {TextureFormat} format The texture format
		* @param {TextureType} type The texture type
		* @param {number} anisotropy Higher values give better results but are more expensive
		*/
        constructor( image?: HTMLImageElement, mapping?: TextureMapping, wrapS?: TextureWrapping, wrapT?: TextureWrapping, magFilter?: TextureFilter, minFilter?: TextureFilter, format?: TextureFormat, type?: TextureType, anisotropy?: number ) {
            super( 0, 0, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );

            if ( image === undefined || image === null )
                image = TextureBase.defaultImage;

            this.width = image.width;
            this.height = image.height;

            this.webglTexture = null;
            this.requiresBuild = true;
            this.flipY = true;
            this.premultiplyAlpha = false;

            // valid values: 1, 2, 4, 8 (see http://www.khronos.org/opengles/sdk/docs/man/xhtml/glPixelStorei.xml)
            this.unpackAlignment = 4;

            this.image = image;
            this.mipmaps = new Array<ImageData>();

            this.mapping = mapping !== undefined ? mapping : TextureMapping.UVMapping;

            this.offset = new Vec2( 0, 0 );
            this.repeat = new Vec2( 1, 1 );

            this.requiresBuild = true;
        }

		/**
		* Loads an image into this texure.
		* @param {string} url The image file URI we are loading
		* @param {string} crossOrigin The cross origin for the loader. The default is 'anonymous'
		* @returns {Texture}
		*/
        loadImage( url: string, crossOrigin: string = 'anonymous' ): Texture {
            if ( url === null || url === '' ) {
                this.image = TextureBase.defaultImage;
                this.width = this.image.width;
                this.height = this.image.height;
                this.requiresBuild = true;
                return;
            }

            // Create any temp loader vars
            if ( !this._imageLoader ) {
                this._imageLoader = document.createElement( 'img' );
                this._proxyComplete = this._onComplete.bind( this );
                this._proxyProgress = this._onProgress.bind( this );
                this._proxyError = this._onError.bind( this );
            }

            if ( crossOrigin !== undefined )
                this._imageLoader.crossOrigin = crossOrigin;

            this._imageLoader.addEventListener( 'load', this._proxyComplete );
            this._imageLoader.addEventListener( 'progress', this._proxyProgress );
            this._imageLoader.addEventListener( 'error', this._proxyError );
            this._imageLoader.src = url;

            return this;
        }

        /** Each time we make progress on the download */
        _onProgress( e ) {
            const percentLoaded: number = e.loaded / e.total * 100;
            this.emit<TextureLoaderEvents, ITextureLoaderEvent>( 'texture_loader_progress', { texture: this, previousImage: this.image, progress: percentLoaded, originalEvent: e });
        }

        /** Error downloading file */
        _onError( e ) {
            if ( !this._imageLoader )
                return;

            this._imageLoader.removeEventListener( 'load', this._proxyComplete );
            this._imageLoader.removeEventListener( 'progress', this._proxyProgress );
            this._imageLoader.removeEventListener( 'error', this._proxyError );
            this._imageLoader = null;

            this.emit<TextureLoaderEvents, ITextureLoaderEvent>( 'texture_loader_error', { texture: this, previousImage: this.image, progress: 0, originalEvent: e });
        }

        /** File loaded */
        _onComplete( e ) {
            if ( !this._imageLoader )
                return;

            const prevImage: HTMLImageElement = this.image;
            this._imageLoader.removeEventListener( 'load', this._proxyComplete );
            this._imageLoader.removeEventListener( 'progress', this._proxyProgress );
            this._imageLoader.removeEventListener( 'error', this._proxyError );
            this.image = this._imageLoader;
            this.width = this.image.width;
            this.height = this.image.height;
            this.requiresBuild = true;

            this.emit<TextureLoaderEvents, ITextureLoaderEvent>( 'texture_loader_complete', { texture: this, previousImage: prevImage, progress: 100, originalEvent: e });
        }

		/**
		* Sets some of the filter data of the texture
		*/
        static setFilters( texture: TextureBase, gl: WebGLRenderingContext, textureType: number, isImagePowerOfTwo: boolean ) {
            if ( isImagePowerOfTwo ) {
                gl.texParameteri( textureType, gl.TEXTURE_WRAP_S, Trike.getGLParam( texture.wrapS, gl ) );
                gl.texParameteri( textureType, gl.TEXTURE_WRAP_T, Trike.getGLParam( texture.wrapT, gl ) );

                gl.texParameteri( textureType, gl.TEXTURE_MAG_FILTER, Trike.getGLParam( texture.magFilter, gl ) );
                gl.texParameteri( textureType, gl.TEXTURE_MIN_FILTER, Trike.getGLParam( texture.minFilter, gl ) );
            }
            else {
                gl.texParameteri( textureType, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
                gl.texParameteri( textureType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );

                gl.texParameteri( textureType, gl.TEXTURE_MAG_FILTER, Texture.filterFallback( texture.magFilter, gl ) );
                gl.texParameteri( textureType, gl.TEXTURE_MIN_FILTER, Texture.filterFallback( texture.minFilter, gl ) );
            }

            if ( Capabilities.getSingleton().glExtensionTextureFilterAnisotropic && texture.type !== TextureType.FloatType ) {
                if ( texture.anisotropy > 1 )
                    gl.texParameterf( textureType, Capabilities.getSingleton().glExtensionTextureFilterAnisotropic.TEXTURE_MAX_ANISOTROPY_EXT, Math.min( texture.anisotropy, Capabilities.getSingleton().maxAnisotropy ) );
            }
        }

		/**
		* This function is called to fill the buffers of the webgl texture.
		* @param {WebGLRenderingContext} gl The WebGLRenderingContext we are using to compile the texture with
		* @param {number} glFormat The webgl texture format flag
		* @param {number} glType The webgl texture type flag
		* @param {boolean} isImagePowerOfTwo The Is this texture a power of 2
		* @param {Array<ImageData>} mipmaps An optional array of images to be used for mipmaps
		*/
        fillTextureBuffer( gl: WebGLRenderingContext, glFormat: number, glType: number, isImagePowerOfTwo: boolean, mipmaps: Array<ImageData> ) {
            let mipmap;

            // regular Texture (image, video, canvas)
            // use manually created mipmaps if available
            // if there are no manual mipmaps
            // set 0 level mipmap and then use GL to generate other mipmap levels
            if ( mipmaps.length > 0 && isImagePowerOfTwo ) {
                for ( let i = 0, il = mipmaps.length; i < il; i++ ) {
                    mipmap = mipmaps[ i ];
                    gl.texImage2D( gl.TEXTURE_2D, i, glFormat, glFormat, glType, mipmap );
                }
            }
            else
                gl.texImage2D( gl.TEXTURE_2D, 0, glFormat, glFormat, glType, this.image );
        }

		/**
		* Builds the webgl texture and fills the buffer data
		* @param {WebGLRenderingContext} gl The WebGLRenderingContext we are using to compile the texture with
		* @param {number} slot The slot we can use to build this texture. This is provided by the Renderer
		*/
        compile( gl: WebGLRenderingContext, slot: number ) {
            const image = this.image;
            const isImagePowerOfTwo = Texture.isPowerOfTwo( image.width ) && Texture.isPowerOfTwo( image.height );
            const glFormat = Trike.getGLParam( this.format, gl );
            const glType = Trike.getGLParam( this.type, gl );
            const mipmaps = this.mipmaps;
            const generateMipmaps = this.generateMipmaps;


            if ( this.webglTexture ) {
                gl.deleteTexture( this.webglTexture );
                this.webglTexture = null;
            }

            // Create the texture
            this.webglTexture = gl.createTexture();

            // Bind it so we can set the params
            gl.activeTexture( slot );
            gl.bindTexture( gl.TEXTURE_2D, this.webglTexture );

            // Now set the texture parameters
            gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, ( this.flipY ? 1 : 0 ) );
            gl.pixelStorei( gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, ( this.premultiplyAlpha ? 1 : 0 ) );
            gl.pixelStorei( gl.UNPACK_ALIGNMENT, this.unpackAlignment );

            // Sets the different texture filters.
            Texture.setFilters( this, gl, gl.TEXTURE_2D, isImagePowerOfTwo );

            this.fillTextureBuffer( gl, glFormat, glType, isImagePowerOfTwo, mipmaps );

            if ( generateMipmaps ) {
                let genMaps: boolean = false;
                if ( mipmaps.length > 0 )
                    this.fillTextureBuffer( gl, glFormat, glType, isImagePowerOfTwo, this.mipmaps );
                else
                    genMaps = true;

                if ( genMaps && isImagePowerOfTwo )
                    gl.generateMipmap( gl.TEXTURE_2D );
            }

            gl.bindTexture( gl.TEXTURE_2D, null );

            this.requiresBuild = false;
        }


		/**
		* Checks if a value is a power of 2
		* @param {number} value The value we are checking
		* @returns {boolean}
		*/
        static isPowerOfTwo( value: number ): boolean {
            return ( value & ( value - 1 ) ) === 0;
        }


		/**
		* Determines which webgl texture filter we need to use
		* @param {TextureFilter} value The TextureFilter we are checking
		* @param {WebGLRenderingContext} gl The WebGLRenderingContext associated with this texture
		* @returns {number}
		*/
        static filterFallback( f: TextureFilter, gl: WebGLRenderingContext ): number {
            if ( f === TextureFilter.Nearest || f === TextureFilter.NearestMipMap || f === TextureFilter.NearestMipMapLinear )
                return gl.NEAREST;

            return gl.LINEAR;
        }

		/**
		* Cleans up the references and frees the memory buffers
		*/
        dispose() {
            this._onError( null );
            super.dispose();

            this.image = null;
            this.mapping = null;
            this.mipmaps = null;
        }
    }
}