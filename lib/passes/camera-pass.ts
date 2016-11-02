namespace Trike {


	/**
	* The camera pass is the default composition attached to cameras. The material is a
	* MaterialCamEffects shader, which allows you to create fog and other camera effects
	* to the final composite before its sent to the frame buffer.
	*/
    export class CameraPass extends CompositionPass {
        public camEffects: MaterialCamEffects;

        private _rotMatrix: Matrix4;


        private _copyMat: MaterialScreenTexture;
        private _targets: { [id: string]: RenderTarget };
        private _curCamTarget: RenderTarget;

		/**
		* Creates an instance of the CameraPass
		*/
        constructor() {
            super('Camera Pass', null, null, FilterType.ScreenQuad, Phase.Composition);

            this.camEffects = new MaterialCamEffects();
            this._copyMat = new MaterialScreenTexture(false);

            this._rotMatrix = new Matrix4();
            this.numSubPasses = 2;
            this._targets = {};
            this._curCamTarget = null;
        }

        getPassTarget(target: RenderTarget): RenderTarget {
            if (!this._targets[target.id]) {
                this._targets[target.id] = new RenderTarget(target.width, target.height, TextureType.HalfFloatType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBFormat, 0, true, true);

                // Shares the same depth and stencil data from the Gbuffer
                this._targets[target.id].sharedRenderBuffer = target;
            }

            return this._targets[target.id];
        }

        /**
		* Resizes the render target, if present, in this pass
		* @param {number} width The width of the render target
		* @param {height} width The height of the render target
		*/
        resize(width: number, height: number) {
            // Handled in the render function for the camera passes
            if (this._curCamTarget)
                this._curCamTarget.requiresBuild = true;
        }

		/**
		* Cleans up the pass for the GC
		*/
        dispose() {
            if (this.disposed)
                return;

            for (let i in this._targets)
                this._targets[i].dispose();

            this._rotMatrix = null;
            this.camEffects.dispose();
            this._copyMat.dispose();

            this._targets = null;
            this.camEffects = null;
            this._copyMat = null;
            this._curCamTarget = null;

            super.dispose()
        }

		/**
		* This is called just before the render function. Use it, to setup the composition pass before rendering
		* @param {RenderTarget} renderTarget The render target defined by the user
		* @param {Scene} scene The scene being drawn
		* @param {Camera} camera The camera used to draw the scene
		* @param {Renderer} renderer The renderer drawing the scene
		*/
        prepPass(renderTarget: RenderTarget, scene: Scene, camera: Camera, renderer: Renderer) {
            if (this.currentSubPass === 0) {
                this.autoClearColor = true;
                this.autoClearStencil = false;
                this.autoClearDepth = false;

                const camEffects: MaterialCamEffects = this.camEffects;
                this.material = camEffects;

                // Set the composition target
                camEffects.setUniform('composition', renderTarget, true);

                if (camEffects.fogType() === FogType.HeightBased || camEffects.fogConvolver()) {
                    this._rotMatrix.extractRotation(camera.worldMatrix);
                    camEffects.setUniform('cameraWorldRotMat', this._rotMatrix, false);
                }

                // Get the current gbuffer
                const gBuffer = renderer.currentCollection.gBufferPass.renderTarget;

                // Get our render target for the current GBuffer - or create one if we dont have one already
                const camTarget = this.getPassTarget(gBuffer);

                // Make sure the sizes are the same
                if (gBuffer.width !== camTarget.width || gBuffer.height !== camTarget.height)
                    camTarget.resize(gBuffer.width, gBuffer.height);

                this.renderTarget = camTarget;
                this._curCamTarget = camTarget;
            }
            else {
                this.autoClearColor = false;
                this.autoClearStencil = false;
                this.autoClearDepth = false;

                this.renderTarget = renderTarget;
                this.material = this._copyMat;
                this._copyMat.map(this._curCamTarget);
            }
        }


    }
}