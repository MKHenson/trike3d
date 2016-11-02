namespace Trike {
	/**
	* A special kind of render target that creates a 6 sided cubed texture instead of a regular 2d texture.
	* Cube render targets need separate render calls to draw each of the 6 textures. You can set which side
	* to draw by calling the activeCubeFace property.
	*/
    export class RenderTargetCube extends RenderTarget {
        private _activeCubeFace: number;

        private _frameBuffers: Array<WebGLFramebuffer>;
        private _renderBuffers: Array<WebGLRenderbuffer>;
        private _depthTextures: Array<DepthTexture>;

		/**
		* Creates an instance of the render target
		* @param {number} width The width of this texture
		* @param {number} height The height of this texture
		* @param {TextureType} type The texture type
		* @param {TextureWrapping} wrapS How the texture wraps horizontally
		* @param {TextureWrapping} wrapT How the texture wraps vertically
		* @param {TextureFilter} magFilter The filter to use when the texture is magnified
		* @param {TextureFilter} minfFilter The filter to use when the texture is minified
		* @param {TextureFormat} format The texture format
		* @param {number} anisotropy Can improve the texture quality. Higher values mean better quality textures (max 16 at this time).
		* @param {boolean} depthBuffer If true, this render target will maintain a depth buffers
		* @param {boolean} stencilBuffer If true, this render target will maintain a stencil buffers
		* @param {boolean} renderDepthToTexture If true, this render target will create a depth textures (Not well supported)
		*/
        constructor( width: number, height: number, type?: TextureType, wrapS?: TextureWrapping, wrapT?: TextureWrapping, magFilter: TextureFilter = TextureFilter.Linear, minFilter: TextureFilter = TextureFilter.Linear, format?: TextureFormat, anisotropy?: number, depthBuffer: boolean = false, stencilBuffer: boolean = false, renderDepthToTexture: boolean = false ) {
            super( width, height, type, wrapS, wrapT, magFilter, minFilter, format, anisotropy, depthBuffer, stencilBuffer, false );

            this.renderDepthToTexture = renderDepthToTexture;
            if ( renderDepthToTexture )
                for ( let i = 0, l = 6; i < 6; i++ )
                    this._depthTextures[ i ] = new DepthTexture( width, height, stencilBuffer );

            this._activeCubeFace = 0;
            this._frameBuffers = [];
            this._renderBuffers = [];
            this._depthTextures = [];
        }

		/**
		* Gets the currently active texture for this render target
		* @returns {number} index The index from 0 to 5
		*/
        get activeCubeFace(): number { return this._activeCubeFace; }
		/**
		* Sets the currently active texture for this render target
		* @param {number} index The index from 0 to 5
		*/
        set activeCubeFace( index: number ) {
            if ( index > 5 )
                index = 5;

            this._activeCubeFace = index;
            this.frameBuffer = this._frameBuffers[ index ];
            this.renderBuffer = this._renderBuffers[ index ];
            this.depthTexture = this._depthTextures[ index ];
        }

		/**
		* Cleans up the references and the queues the buffers for removal.
		*/
        dispose() {
            super.dispose();
        }

		/**
		* Cleans up the references and frees the memory buffers
		*/
        destroyBuffers( gl: WebGLRenderingContext ) {
            if ( this.renderDepthToTexture )
                for ( let i = 0, l = 6; i < 6; i++ ) {
                    this._depthTextures[ i ].destroyBuffers( gl );
                    gl.deleteFramebuffer( this._frameBuffers[ i ] );
                    gl.deleteRenderbuffer( this._renderBuffers[ i ] );
                }

            this._frameBuffers = null;
            this._renderBuffers = null;
            this._depthTextures = null;

            // Call base
            super.destroyBuffers( gl );
        }

		/**
		* Resizes the target. Will require a re-compile
		*/
        resize( width, height ) {
            this.width = width;
            this.height = height;
            this.requiresBuild = true;
            if ( this.renderDepthToTexture )
                for ( let i = 0, l = 6; i < 6; i++ )
                    this._depthTextures[ i ].resize( width, height );
        }

		/**
		* Builds the frame buffers. Called if requiresBuild is set to true.
		*/
        compile( gl: WebGLRenderingContext ): boolean {
            if ( this.webglTexture ) {
                gl.deleteTexture( this.webglTexture );

                for ( let i = 0, l = 6; i < 6; i++ ) {
                    gl.deleteFramebuffer( this._frameBuffers[ i ] );
                    gl.deleteRenderbuffer( this._renderBuffers[ i ] );
                }

                this._activeCubeFace = 0;
                this._frameBuffers = [];
                this._renderBuffers = [];
                this._depthTextures = [];

                this.frameBuffer = null;
                this.renderBuffer = null;
                this.depthTexture = null;
            }

            // Create the texture
            this.webglTexture = gl.createTexture();

            // Setup texture, create render and frame buffers
            const isTargetPowerOfTwo = Texture.isPowerOfTwo( this.width ) && Texture.isPowerOfTwo( this.height ),
                glFormat = Trike.getGLParam( this.format, gl ),
                glType = Trike.getGLParam( this.type, gl );


            // Bind the webgl texture
            gl.bindTexture( gl.TEXTURE_CUBE_MAP, this.webglTexture );

            // Set the texture filters
            Texture.setFilters( this, gl, gl.TEXTURE_CUBE_MAP, isTargetPowerOfTwo );

            // Now for each of the 6 sides of a cube texture...
            for ( let i = 0, l = 6; i < 6; i++ ) {
                if ( this.renderDepthToTexture && Capabilities.getSingleton().depthTextureExt )
                    this._depthTextures[ i ].compile( gl );

                // Create the frame buffers
                this._frameBuffers[ i ] = gl.createFramebuffer();

                // rendering to that texture type not supported
                if ( gl.checkFramebufferStatus( gl.FRAMEBUFFER ) !== gl.FRAMEBUFFER_COMPLETE )
                    return false;

                // Create the render buffer
                this._renderBuffers[ i ] = gl.createRenderbuffer();

                gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, glFormat, this.width, this.height, 0, glFormat, glType, null );

                // Bind the frame buffer so that its active
                gl.bindFramebuffer( gl.FRAMEBUFFER, this._frameBuffers[ i ] );

                // Tell the bound frame buffer its associated with this texture and render buffer
                gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.webglTexture, 0 );

                gl.bindRenderbuffer( gl.RENDERBUFFER, this._renderBuffers[ i ] );


                if ( this.depthBuffer && !this.stencilBuffer ) {
                    if ( this.renderDepthToTexture )
                        gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this._depthTextures[ i ].webglTexture, 0 );
                    else {
                        gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height );
                        gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._renderBuffers[ i ] );
                    }
                }
                else if ( this.depthBuffer && this.stencilBuffer ) {
                    if ( this.renderDepthToTexture )
                        gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, this._depthTextures[ i ].webglTexture, 0 );
                    else {
                        gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_STENCIL, this.width, this.height );
                        gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this._renderBuffers[ i ] );
                    }
                }
                else
                    gl.renderbufferStorage( gl.RENDERBUFFER, gl.RGBA4, this.width, this.height );
            }

            // Generate mipmaps
            if ( isTargetPowerOfTwo && this.generateMipmaps )
                gl.generateMipmap( gl.TEXTURE_CUBE_MAP );

            // Release everything
            gl.bindTexture( gl.TEXTURE_CUBE_MAP, null );
            gl.bindRenderbuffer( gl.RENDERBUFFER, null );
            gl.bindFramebuffer( gl.FRAMEBUFFER, null );

            this.requiresBuild = false;
            return true;
        }
    }
}