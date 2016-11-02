namespace Trike {
	/**
	* This pass is responsible for drawing the skyboxes of a scene
	*/
    export class SkyPass extends RenderPass {
		/**
		* Creates an instance of the SkyPass
		* @param {RenderTarget} renderTarget The render target we are drawing to. Null will draw to the screen.
		*/
        constructor( renderTarget: RenderTarget ) {
            super( null, renderTarget, PassType.Skybox );
        }
    }
}