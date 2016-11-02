namespace Trike {
	/**
	* Render targets are special textures that a webgl render can draw a scene onto. The
	* texture can then be re-used as a texture that can be applied onto other objects.
	*/
    export class RenderTarget extends TextureBase {
        private static renderTargetCounter: number = 0;

        public depthBuffer: boolean;
        public stencilBuffer: boolean;
        public requiresBuild: boolean;

        public frameBuffer: WebGLFramebuffer;
        public renderBuffer: WebGLRenderbuffer;
        private _sharedRenderBuffer: RenderTarget;
        public renderDepthToTexture: boolean;

        public depthTexture: DepthTexture;
        public id: number;


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
		* @param {boolean} depthBuffer If true, this render target will maintain a depth buffer
		* @param {boolean} stencilBuffer If true, this render target will maintain a stencil buffer
		* @param {boolean} renderDepthToTexture If true, this render target will create a depth texture (Not well supported)
		*/
        constructor( width: number, height: number, type?: TextureType, wrapS: TextureWrapping = TextureWrapping.ClampToEdgeWrapping, wrapT: TextureWrapping = TextureWrapping.ClampToEdgeWrapping, magFilter: TextureFilter = TextureFilter.Nearest, minFilter: TextureFilter = TextureFilter.Nearest, format: TextureFormat = TextureFormat.RGBAFormat, anisotropy: number = 1, depthBuffer: boolean = true, stencilBuffer: boolean = true, renderDepthToTexture: boolean = false ) {
            super( width, height, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );

            this.width = width;
            this.height = height;
            this.id = RenderTarget.renderTargetCounter;
            RenderTarget.renderTargetCounter++;

            // Some browsers have the ability to render the depth buffer into a texture
            if ( renderDepthToTexture )
                this.depthTexture = new DepthTexture( width, height, stencilBuffer );
            else
                this.depthTexture = null;

            this.depthBuffer = depthBuffer !== undefined ? depthBuffer : true;
            this.stencilBuffer = stencilBuffer !== undefined ? stencilBuffer : true;

            this.frameBuffer = null;
            this.webglTexture = null;
            this.renderBuffer = null;
            this.requiresBuild = true;
            this.generateMipmaps = false;
            this.renderDepthToTexture = renderDepthToTexture;
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
            super.destroyBuffers( gl );

            gl.deleteFramebuffer( this.frameBuffer );
            gl.deleteRenderbuffer( this.renderBuffer );
            if ( this.depthTexture )
                this.depthTexture.destroyBuffers( gl );

            this.frameBuffer = null;
            this.renderBuffer = null;
            this.depthTexture = null;
            this._sharedRenderBuffer = null;
        }

		/**
		* Resizes the target. Will require a re-compile
		* @param {number} width
		* @param {number} height
		*/
        resize( width, height ) {
            this.width = width;
            this.height = height;
            this.requiresBuild = true;
            if ( this.renderDepthToTexture )
                this.depthTexture.resize( width, height );
        }


		/**
		* Gets the shared render buffer of this target
		* @returns {WebGLRenderbuffer}
		*/
        get sharedRenderBuffer(): RenderTarget { return this._sharedRenderBuffer; }
		/**
		* Sets the shared render buffer of this target. Causes a rebuild.
		* @param {WebGLRenderbuffer} val
		*/
        set sharedRenderBuffer( val: RenderTarget ) {
            this._sharedRenderBuffer = val;
            this.requiresBuild = true;
        }

		/**
		* Builds the frame buffers. Called if requiresBuild is set to true.
		*/
        compile( gl: WebGLRenderingContext ): boolean {
            if ( this.webglTexture ) {
                gl.deleteTexture( this.webglTexture );
                gl.deleteFramebuffer( this.frameBuffer );
                if ( !this._sharedRenderBuffer )
                    gl.deleteRenderbuffer( this.renderBuffer );
            }

            // If this buffer shares its depth and stencil from another, we need to make sure that render buffer
            // is compiled first
            if ( this._sharedRenderBuffer && this._sharedRenderBuffer.requiresBuild )
                this._sharedRenderBuffer.compile( gl );


            // Create the texture
            this.webglTexture = gl.createTexture();

            // Setup texture, create render and frame buffers
            const isTargetPowerOfTwo = Texture.isPowerOfTwo( this.width ) && Texture.isPowerOfTwo( this.height ),
                glFormat = Trike.getGLParam( this.format, gl ),
                glType = Trike.getGLParam( this.type, gl );

            // Create the frame buffer
            this.frameBuffer = gl.createFramebuffer();

            // rendering to that texture type not supported
            if ( gl.checkFramebufferStatus( gl.FRAMEBUFFER ) !== gl.FRAMEBUFFER_COMPLETE )
                return false;

            // Create the render buffer
            if ( this._sharedRenderBuffer )
                this.renderBuffer = this._sharedRenderBuffer.renderBuffer;
            else
                this.renderBuffer = gl.createRenderbuffer();

            if ( this.renderDepthToTexture && Capabilities.getSingleton().depthTextureExt )
                this.depthTexture.compile( gl );

            gl.bindTexture( gl.TEXTURE_2D, this.webglTexture );
            Texture.setFilters( this, gl, gl.TEXTURE_2D, isTargetPowerOfTwo );
            gl.texImage2D( gl.TEXTURE_2D, 0, glFormat, this.width, this.height, 0, glFormat, glType, null );

            // Bind the frame buffer so that its active
            gl.bindFramebuffer( gl.FRAMEBUFFER, this.frameBuffer );

            // Tell the bound frame buffer its associated with this texture and render buffer
            gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.webglTexture, 0 );

            if ( this._sharedRenderBuffer ) {
                if ( this.depthBuffer && !this.stencilBuffer )
                    gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderBuffer );
                else if ( this.depthBuffer && this.stencilBuffer )
                    gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.renderBuffer );
            }
            else {
                gl.bindRenderbuffer( gl.RENDERBUFFER, this.renderBuffer );

                if ( this.depthBuffer && !this.stencilBuffer ) {
                    if ( this.renderDepthToTexture )
                        gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture.webglTexture, 0 );
                    else {
                        gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height );
                        gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderBuffer );
                    }
                }
                else if ( this.depthBuffer && this.stencilBuffer ) {
                    if ( this.renderDepthToTexture )
                        gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture.webglTexture, 0 );
                    else {
                        gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_STENCIL, this.width, this.height );
                        gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.renderBuffer );
                    }
                }
                else
                    gl.renderbufferStorage( gl.RENDERBUFFER, gl.RGBA4, this.width, this.height );
            }

            // Generate mipmaps
            if ( isTargetPowerOfTwo )
                gl.generateMipmap( gl.TEXTURE_2D );

            // Release everything
            gl.bindTexture( gl.TEXTURE_2D, null );
            gl.bindRenderbuffer( gl.RENDERBUFFER, null );
            gl.bindFramebuffer( gl.FRAMEBUFFER, null );

            this.requiresBuild = false;
            return true;
        }
    }
}