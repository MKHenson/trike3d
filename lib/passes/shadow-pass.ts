namespace Trike {
	/**
	* This pass is responsible for drawing each of the lights shadow maps
	*/
    export class ShadowLightPass extends RenderPass {
        public blurMaterialX: MaterialGaussian;
        public blurMaterialY: MaterialGaussian;
        public copyMaterial: MaterialScreenTexture;

        public blurX: RenderTarget;
        public blurY: RenderTarget;
        private _shadowFilter: ShadowQuality;

		/**
		* Creates an instance of the pass
		*/
        constructor( softnessPass: boolean = false ) {
            super( null, null, PassType.ShadowLightPass );

            this._shadowFilter = ShadowQuality.High;
            this.copyMaterial = new MaterialScreenTexture( false );
            this.blurMaterialX = new MaterialGaussian();
            this.blurMaterialY = new MaterialGaussian();
            this.blurMaterialY.setDirection( false );
            this.blurX = new RenderTarget( 128, 128, TextureType.FloatType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.Linear, TextureFormat.RGBFormat, 0, false, false );
            this.blurY = new RenderTarget( 128, 128, TextureType.FloatType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.Linear, TextureFormat.RGBFormat, 0, false, false );
        }

		/**
		* Called just before a mesh is drawn
		* @param {Camera} mesh The Mesh we are about to draw
		* @return {boolean}
		*/
        evaluateMesh( mesh: Mesh ): boolean {
            if ( !super.evaluateMesh( mesh ) )
                return false;

            return true;
        }
    }
}