namespace Trike {
    export class DepthTexture extends TextureBase {
        public stencilBuffer: boolean;

        constructor( width: number, height: number, stencilBuffer: boolean = true ) {
            super( width, height, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, ( stencilBuffer ? TextureFormat.DepthStencil : TextureFormat.DepthComponent ), ( stencilBuffer ? TextureType.UNSIGNED_INT_24_8_WEBGL :
                TextureType.UnsignedShortType ) );

            this.stencilBuffer = stencilBuffer;
        }

        compile( gl: WebGLRenderingContext ) {
            if ( this.webglTexture )
                gl.deleteTexture( this.webglTexture );

            const isTargetPowerOfTwo: boolean = Texture.isPowerOfTwo( this.width ) && Texture.isPowerOfTwo( this.height );

            // Create the depth texture
            this.webglTexture = gl.createTexture();
            gl.bindTexture( gl.TEXTURE_2D, this.webglTexture );
            Texture.setFilters( this, gl, gl.TEXTURE_2D, isTargetPowerOfTwo );
            const glFormat = Trike.getGLParam( this.format, gl );
            const glType = Trike.getGLParam( this.type, gl );
            gl.texImage2D( gl.TEXTURE_2D, 0, glFormat, this.width, this.height, 0, glFormat, glType, null );

            gl.bindTexture( gl.TEXTURE_2D, null );
        }

		/**
		* Resizes the target. Will require a re-compile
		*/
        resize( width, height ) {
            this.width = width;
            this.height = height;
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
        }
    }
}