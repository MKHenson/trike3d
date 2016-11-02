namespace Trike {
	/**
	* This pass is responsible for drawing more material properties
	* x: normal, normal, normal
	* y: albedo, albedo, albedo
	* z: Depth, Opacity, shininess
	* w: translucency distortion, translucency scale, translucency power
	*/
    export class GBuffer2Pass extends RenderPass {
		/**
		* Creates an instance of the pass
		* @param {number} width The width of the render target
		* @param {height} width The height of the render target
		*/
        constructor( width: number, height: number ) {
            super( null, new RenderTarget( width, height, TextureType.FloatType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBAFormat, 1, true, true ), PassType.GBuffer2 );
        }
    }
}