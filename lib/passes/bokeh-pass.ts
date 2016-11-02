namespace Trike {
	/**
	* Performs the passes to draw a depth of field type of effect
	*/
    export class BokehPass extends CompositionPass {
        public materialBokeh: MaterialBokeh;
        private copy: MaterialScreenTexture;
        private _tempTarget1: RenderTarget;

        constructor() {
            super( 'AO Pass', null, null, FilterType.ScreenQuad, Phase.PostCompostion );

            this._tempTarget1 = new RenderTarget( 2, 2, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBFormat, 0, false, false );
            this.materialBokeh = new MaterialBokeh();
            this.copy = new MaterialScreenTexture( false );
            this.autoClearStencil = false;
            this.autoClearDepth = false;
            this.numSubPasses = 2;
        }

		/**
		* Resizes the render target, if present, in this pass
		* @param {number} width The width of the render target
		* @param {height} width The height of the render target
		*/
        resize( width: number, height: number ) {
            this.materialBokeh.setUniform( 'aspect', width / height, true );
            this._tempTarget1.resize( width, height );
        }

		/**
		* This is called just before the render function. Use it, to setup the composition pass before rendering
		* @param {RenderTarget} renderTarget The render target defined by the user
		* @param {Scene} scene The scene being drawn
		* @param {Camera} camera The camera used to draw the scene
		* @param {Renderer} renderer The renderer drawing the scene
		*/
        prepPass( renderTarget: RenderTarget, scene: Scene, camera: Camera, renderer: Renderer ) {
            if ( this.currentSubPass === 0 ) {
                this.autoClearColor = true;
                this.material = this.materialBokeh;
                this.renderTarget = this._tempTarget1;
            }
            else {
                this.autoClearColor = true;
                this.material = this.copy;
                this.copy.map( this._tempTarget1 );
                this.renderTarget = renderTarget;
            }
        }

        /**
		* Gets or sets the maximum blur radius of the pixels from each sample point.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        maxBlur( val?: number ): number {
            if ( val === undefined ) return this.materialBokeh._uniforms[ 'maxBlur' ].value;
            this.materialBokeh.setUniform( 'maxBlur', val, true );
            return val;
        }

		/**
		* Gets or sets the aperture value
		* @param {number} val [Optional]
		* @returns {number}
		*/
        aperture( val?: number ): number {
            if ( val === undefined ) return this.materialBokeh._uniforms[ 'aperture' ].value;
            this.materialBokeh.setUniform( 'aperture', val, true );
            return val;
        }

		/**
		* Gets or sets the focus value
		* @param {number} val [Optional]
		* @returns {number}
		*/
        focus( val?: number ): number {
            if ( val === undefined ) return this.materialBokeh._uniforms[ 'focus' ].value;
            this.materialBokeh.setUniform( 'focus', val, true );
            return val;
        }
    }
}