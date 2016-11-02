namespace Trike {
	/**
	* This pass is responsible for simply drawing a shader texture
	*/
    export class TexturePass extends RenderPass {
        public shaderTexture: ShaderTexture;

		/**
		* Creates an instance of the TexturePass
		* @param {ShaderTexture} shaderTexture The texture to draw
		*/
        constructor() {
            super( null, null, PassType.Texture );
        }

        resize( width: number, height: number ) {
            // We do nothing. Not sure if we should do anything here...
        }
    }
}