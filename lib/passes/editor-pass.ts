namespace Trike {
	/**
	* This pass is responsible for drawing any color information that needs to be applied to the final
	* pass. Its only created if in editor mode.
	*/
    export class EditorPass extends RenderPass {
		/**
		* Creates an instance of the pass
		* @param {number} width The width of the render target
		* @param {height} width The height of the render target
		*/
        constructor( width: number, height: number ) {
            super( null, new RenderTarget( width, height, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBAFormat, 1, true, true ), PassType.EditorPass );
        }
    }
}