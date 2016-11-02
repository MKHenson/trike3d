namespace Trike {
	/*
	* A specialized convolver that uses the sky cube texture as its source
	*/
    export class SkyboxConvolver extends CubeConvolver {
        private _renderCount: number;
        private _sky: SkyboxSimple | SkyboxAtmospheric;

        constructor() {
            super();
            this._renderCount = 0;
        }

		/*
		* Gets or sets the skybox we are convolving
		* @param {SkyboxSimple|SkyboxAtmospheric} val [Optional]
		* @returns {SkyboxSimple|SkyboxAtmospheric}
		*/
        skybox( val: SkyboxSimple | SkyboxAtmospheric ): SkyboxSimple | SkyboxAtmospheric {
            if ( val === undefined ) return this._sky;

            this._sky = val;

            if ( val instanceof RenderTargetCube )
                this.continuousRedraw = true;
            else
                this.continuousRedraw = false;

            if ( val )
                this.source( val.skyTexture() )
            else
                this.source( null );

            this.redrawRequired = true;
            return val;
        }

		/*
		* Use this function to perform any pre-renders. Useful if an object needs to do its own render pass before a
		* the render call begins.
		* @param {Scene} scene The scene  being rendered
		* @param {Camera} camera The camera beinf used to render the scene
		* @param {RenderTarget} renderTarget The render target the scene is being drawn to
		* @param {Renderer} renderer The renderer being used to draw the scene
		* @param {boolean} Returns false if an error occurred
		*/
        prepRender( scene: Scene, camera: Camera, renderTarget?: RenderTarget, renderer?: Renderer ): boolean {
            if ( !this._sky )
                return true;

            // If the skybox render count does not match ours, then its been updated
            // and we have to update our variance shading maps
            if ( this._sky.renderCount !== this._renderCount )
                this.redrawRequired = true;

            this._renderCount = this._sky.renderCount;
            super.prepRender( scene, camera, renderTarget, renderer );
            return true;
        }

		/*
		* Get or set the specularity of the convolution
		* @param {number} [Optional]
		* @returns {number}
		*/
        specularity( val?: number ): number {
            if ( val === undefined ) return super.specularity();
            this._renderCount = -1; // Causes a redraw
            return super.specularity( val );
        }

		/*
		* Cleans up the class
		*/
        dispose() {
            super.dispose();
            this._sky = null;
        }
    }
}