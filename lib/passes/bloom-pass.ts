namespace Trike {
	/**
	* Extracts the lightness from the scene, then applies a bloom filter on the lighter parts of it
	* See http://kalogirou.net/2006/05/20/how-to-do-good-bloom-for-hdr-rendering/ for more
	*/
    export class BloomPass extends CompositionPass {
        public hdr: MaterialExtractLight;
        public blurHorizontal: MaterialGaussian;
        public blurVertical: MaterialGaussian;
        private copy: MaterialScreenTexture;

        private _tempTarget1: RenderTarget;
        private _tempTarget2: RenderTarget;
        private _tempTarget3: RenderTarget;

        constructor() {
            super( 'Gaussian Pass', null, null, FilterType.ScreenQuad, Phase.PostCompostion );

            this._tempTarget1 = new RenderTarget( 2, 2, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.Linear, TextureFormat.RGBFormat, 0, false, false );
            this._tempTarget2 = new RenderTarget( 2, 2, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.Linear, TextureFormat.RGBFormat, 0, false, false );
            this._tempTarget3 = new RenderTarget( 2, 2, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.Linear, TextureFormat.RGBFormat, 0, false, false );

            this.hdr = new MaterialExtractLight();
            this.blurHorizontal = new MaterialGaussian();
            this.blurVertical = new MaterialGaussian();
            this.copy = new MaterialScreenTexture( false );

            // this.blurHorizontal.blendMode = BlendMode.Additive;
            // this.blurVertical.blendMode = BlendMode.Additive;
            this.copy.blendMode = BlendMode.Additive;

            this.blurHorizontal.setDirection( true );
            this.blurVertical.setDirection( false );
            this.autoClearStencil = false;
            this.autoClearDepth = false;

            this.numSubPasses = 4;
        }

		/**
		* Resizes the render target, if present, in this pass
		* @param {number} width The width of the render target
		* @param {height} width The height of the render target
		*/
        resize( width: number, height: number ) {
            this._tempTarget1.resize( width / 2, height / 2 );
            this._tempTarget2.resize( width / 4, height / 4 );
            this._tempTarget3.resize( width / 4, height / 4 );
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
                this.material = this.hdr;
                this.hdr.map( renderTarget );
                this.renderTarget = this._tempTarget1;
            }
            else if ( this.currentSubPass === 1 ) {
                this.material = this.blurHorizontal;
                this.blurHorizontal.map( this._tempTarget1 );
                this.renderTarget = this._tempTarget2;
            }
            else if ( this.currentSubPass === 2 ) {
                this.material = this.blurVertical;
                this.blurVertical.map( this._tempTarget2 );
                this.renderTarget = this._tempTarget3;
            }
            else if ( this.currentSubPass === 3 ) {
                this.autoClearColor = false;
                this.material = this.copy;
                this.copy.map( this._tempTarget3 );
                this.renderTarget = renderTarget;
            }
        }
    }
}