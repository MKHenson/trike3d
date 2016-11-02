namespace Trike {
    export enum Phase {
        Composition,
        PostCompostion,
        LightingSolid
    }

    export enum FilterType {
        Solids,
        Transparents,
        Lights,
        Skyboxes,
        ScreenQuad
    }

	/**
	* Each render call is optionall made up of several composition passes. These can be thought of as
	* post process effects, but can also be broader than that. They occur after the essential rendering
	* has taken place and are part of the camera. The composition passes should essentially put a scene together.
	*/
    export class CompositionPass extends RenderPass {
        public enabled: boolean;
        public autoClearColor: boolean;
        public autoClearDepth: boolean;
        public autoClearStencil: boolean;
        public filterType: FilterType;
        public name: string;

        public numSubPasses: number;
        public currentSubPass: number;
        public phase: Phase;

        // The renderer keeps a count off each time its resized. This matches the resizeId - but if it doesnt
        // then that means the renderer was resized but this pass was not notified. In those cases the pass
        // will be notified and the resizeId synced with the renderer.
        public resizeId: number;


		/**
		* Creates an instance of the FinalPass
		* @param {string} name The unique name of the pass.
		* @param {RenderTarget} renderTarget The render target we are drawing to. Null will draw to the screen.
		* @param {MaterialMulti} material Each composition pass must be given a material with which to draw / compose a scene
		* @param {FilterType} filterType Describes which objects to draw
		* @param {Phase} phase Defines at what point the pass is drawn
		*/
        constructor( name: string, renderTarget: RenderTarget, material: MaterialMulti, filterType: FilterType, phase: Phase ) {
            super( material, renderTarget, PassType.ScreenQuad );

            this.numSubPasses = 1;
            this.phase = phase;
            this.currentSubPass = 0;
            this.name = name;
            this.autoClearColor = true;
            this.autoClearDepth = true;
            this.autoClearStencil = true;
            this.enabled = true;
            this.filterType = FilterType.ScreenQuad;
            this.resizeId = 0;
        }

		/**
		* This is called just before the render function. Use it, to setup the composition pass before rendering
		* @param {RenderTarget} renderTarget The render target defined by the user
		* @param {Scene} scene The scene being drawn
		* @param {Camera} camera The camera used to draw the scene
		* @param {Renderer} renderer The renderer drawing the scene
		*/
        prepPass( renderTarget: RenderTarget, scene: Scene, camera: Camera, renderer: Renderer ) {
        }
    }
}