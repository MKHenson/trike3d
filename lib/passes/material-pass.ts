namespace Trike {
	/**
	* Some multi materials have an array of material passes. These are drawn just before the render call
	* and are useful for drawing information
	*/
    export class MaterialPass extends RenderPass {
        private static _curPassID: number = 100;

        // The renderer keeps a count off each time its resized. This matches the resizeId - but if it doesnt
        // then that means the renderer was resized but this pass was not notified. In those cases the pass
        // will be notified and the resizeId synced with the renderer.
        public resizeId: number;
        public enabled: boolean;

		/**
		* Creates an instance of the pass. By default a render target the same size as the viewport is created
		* and maintained. Optionally you can pass your own target.
		* @param {number} width The width of the render target
		* @param {height} width The height of the render target
		* @param {PassType} passType The type of pass
		* @param {RenderTarget} renderTarget Optionally you can pass your own render target
		*/
        constructor( width: number, height: number, passType: PassType, renderTarget?: RenderTarget ) {
            super( null, renderTarget || new RenderTarget( width, height, TextureType.FloatType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBAFormat, 1, true, true ), passType );
            this.resizeId = 0;
            this.enabled = true;
        }

		/**
		* Gets a new unique pass ID
		* @returns {number}
		*/
        static getNewPassID(): number {
            MaterialPass._curPassID++;
            return MaterialPass._curPassID;
        }
    }
}