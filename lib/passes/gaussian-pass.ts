namespace Trike {
	/**
	* This composition is used to blur the scene using two Gaussian blur materials
	*/
    export class GaussianPass extends CompositionPass {
        public blurHorizontal: MaterialGaussian;
        public blurVertical: MaterialGaussian;
        private _tempTarget: RenderTarget;

        constructor() {
            super( 'Gaussian Pass', null, null, FilterType.ScreenQuad, Phase.PostCompostion );

            this.blurHorizontal = new MaterialGaussian();
            this.blurVertical = new MaterialGaussian();
            this._tempTarget = new RenderTarget( 512, 512, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBFormat, 0, false, false );
            this.blurHorizontal.setDirection( true );
            this.blurVertical.setDirection( false );

            this.numSubPasses = 2;
        }

		/**
		* Resizes the render target, if present, in this pass
		* @param {number} width The width of the render target
		* @param {height} width The height of the render target
		*/
        resize( width: number, height: number ) {
            this._tempTarget.resize( width, height );
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
                this.material = this.blurHorizontal;
                this.blurHorizontal.map( renderTarget );
                this.renderTarget = this._tempTarget;
            }
            else if ( this.currentSubPass === 1 ) {
                this.material = this.blurVertical;
                this.blurVertical.map( this._tempTarget );
                this.renderTarget = renderTarget;
            }
        }
    }
}