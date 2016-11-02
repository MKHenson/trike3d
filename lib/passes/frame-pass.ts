namespace Trike {
	/**
	* This pass copies the scene from the composition target to the final destination
	* which is either the frame buffer or another render target.
	*/
    export class FramePass extends RenderPass {
        public compositionTarget: RenderTarget;

		/**
		* Creates an instance of the FramePass
		*/
        constructor( compositionTarget: RenderTarget ) {
            super( new MaterialScreenTexture( false ), null, FilterType.ScreenQuad );
            this.compositionTarget = compositionTarget;
        }

		/**
		* This is called just before the render function. Use it, to setup the composition pass before rendering
		* @param {RenderTarget} renderTarget The render target defined by the user
		* @param {Scene} scene The scene being drawn
		* @param {Camera} camera The camera used to draw the scene
		* @param {Renderer} renderer The renderer drawing the scene
		*/
        prepPass( renderTarget: RenderTarget, scene: Scene, camera: Camera, renderer: Renderer ) {
            const material: MaterialScreenTexture = <MaterialScreenTexture>this.material;
            material.map( this.compositionTarget );

            this.renderTarget = renderTarget;
        }
    }
}