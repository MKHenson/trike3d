namespace Trike {
	/**
	* This pass is responsible for simply drawing a render target to the screen
	*/
    export class ScreenPass extends RenderPass {
        public solidMaterial: MaterialScreenTexture;
        public transparentMaterial: MaterialScreenTexture;

		/**
		* Creates an instance of the FinalPass
		* @param {RenderTarget} renderTarget The render target we are drawing to. Null will draw to the screen.
		*/
        constructor(renderTarget: RenderTarget) {
            const solidMaterial = new MaterialScreenTexture();
            const transparentMaterial = new MaterialScreenTexture(true);
            transparentMaterial.blendMode = BlendMode.PremultipliedAlpha;
            super(solidMaterial, renderTarget, PassType.ScreenQuad);

            this.solidMaterial = solidMaterial;
            this.transparentMaterial = transparentMaterial;
        }

        set map(val: TextureBase) {
            const defMat: MaterialScreenTexture = <MaterialScreenTexture>this.material;
            defMat.setUniform('map', val, false);
        }
    }
}