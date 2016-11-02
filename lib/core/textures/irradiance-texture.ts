// namespace Trike {
// 	/**
// 	* A {IrradianceTexture} in Trike is a wrapper for a webgl cube texture that is made of 6 images.
// 	* The texture takes a cube map target and turns it into an irradiance cube map. ICM's textures
// 	* can be used as a form of global lighting. Check out these articles for more information:
// 	* http://codeflow.org/entries/2011/apr/18/advanced-webgl-part-3-irradiance-environment-map/
// 	* http://http.developer.nvidia.com/GPUGems2/gpugems2_chapter10.html
// 	*/
//     export class IrradiancePass extends RenderPass {
//         private downsampler: CubeRenderer;
//         private convolveTarget: CubeRenderer;

// 		/**
// 		* Creates an instance of the Texture
// 		*/
//         constructor() {
//             super( null, null, PassType.ScreenQuad );
//             this.downsampler = new CubeRenderer( 16, 16 );
//             this.convolveTarget = new CubeRenderer( 16, 16 );
//         }

// 		/**
// 		* This is called just before the render function. Use it, to setup the composition pass before rendering
// 		* @param {RenderTarget} renderTarget The render target defined by the user
// 		* @param {Scene} scene The scene being drawn
// 		* @param {Camera} camera The camera used to draw the scene
// 		* @param {Renderer} renderer The renderer drawing the scene
// 		*/
//         prepPass( renderTarget: RenderTarget, scene: Scene, camera: Camera, renderer: Renderer ) {
//             // if (!this.renderObjects(renderer.ssq.meshes, renderer.ssq.camera, this))
//             //	return false;

//             return true;
//         }

// 		/**
// 		* Cleans up the references and frees the memory buffers
// 		*/
//         dispose() {
//             this.downsampler.dispose();
//             this.convolveTarget.dispose();

//             this.downsampler = null;
//             this.convolveTarget = null;
//         }
//     }
// }