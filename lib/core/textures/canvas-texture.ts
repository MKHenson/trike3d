namespace Trike {
	/**
	* The CanvasTexture uses a Canvas object instead of an image to represent texture data. This can be really useful
	* to draw dynamic textures on a mesh. Simply use the canvas context and set Texture.requiresBuild to true to re-draw the canvas.
	* The CanvasTexture ignores its internal image property when filling the webgl texture buffers, but does use it as a reference when
	* loading images or re-sizing the texture.
	*/
    export class CanvasTexture extends Texture {
        public canvas: HTMLCanvasElement;
        public context: CanvasRenderingContext2D;
        public imageData: ImageData;

		/**
		* Creates an instance of the CanvasTexture
		* @param {number} width The canvas width
		* @param {number} height The canvas height
		* @param {string} fillStyle The fill color of the canvas
		*/
        constructor( width: number, height: number, fillStyle: string = '#000000' ) {
            const canvas = document.createElement( 'canvas' );
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext( '2d' );
            context.fillStyle = fillStyle;
            context.fillRect( 0, 0, width, height );
            const imageData = context.getImageData( 0, 0, width, height );

            const image: HTMLImageElement = document.createElement( 'img' );
            image.src = canvas.toDataURL( 'image/png' );

            super( image );

            this.canvas = canvas;
            this.context = context;
            this.imageData = imageData;
        }

		/**
		* Resizes the canvas
		* @param {number} width The new width
		* @param {number} height The new height
		* @param {boolean} redrawImage Should the canvas re-draw its base image. The default is true.
		*/
        resize( width: number, height: number, redrawImage: boolean = true ) {
            this.flush();

            this.width = width;
            this.height = height;

            this.canvas.width = width;
            this.canvas.height = height;

            if ( redrawImage )
                this.context.drawImage( this.image, 0, 0, this.image.width, this.image.height, 0, 0, width, height );

            this.imageData = this.context.getImageData( 0, 0, width, height );
            this.image.src = this.canvas.toDataURL( 'image/png' );
            this.requiresBuild = true;
        }

		/**
		* Fills the image with the contents of the canvas. Will cause a texture update.
		*/
        flush() {
            this.image.src = this.canvas.toDataURL( 'image/png' );
            this.requiresBuild = true;
        }

		/**
		* Fills the image with the contents of the canvas. Will cause a texture update.
		*/
        syncImageData() {
            this.imageData = this.context.getImageData( 0, 0, this.image.width, this.image.height );
        }

		/**
		* Override the complete function so we can re-draw the image that was loaded onto the canvas
		*/
        _onComplete( e: any ) {
            super._onComplete( e );

            // Update the canvas to have the same image
            this.canvas.width = this.image.width;
            this.canvas.height = this.image.height;
            this.context.drawImage( this.image, 0, 0, this.image.width, this.image.height, 0, 0, this.image.width, this.image.height );
            this.imageData = this.context.getImageData( 0, 0, this.image.width, this.image.height );
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
                gl.texImage2D( gl.TEXTURE_2D, 0, glFormat, glFormat, glType, this.canvas );
        }
    }
}