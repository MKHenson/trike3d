namespace Trike {
	/**
	* This pass is responsible for drawing material properties
	* x: diffuse, diffuse, diffuse
	* y: specular, specular, specular
	* z: translucency color, translucency color, translucency color
	* w: emissive, emissive, emissive
	*/
    export class GBufferPass extends RenderPass {
		/**
		* Creates an instance of the pass
		* @param {number} width The width of the render target
		* @param {height} width The height of the render target
		*/
        constructor( width: number, height: number ) {
            super( null, new RenderTarget( width, height, TextureType.FloatType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBAFormat, 1, true, true ), PassType.GBuffer );
        }
    }
}