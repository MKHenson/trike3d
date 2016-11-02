namespace Trike {
	/*
	* This class is used to convolve a cube texture. This is commonly irradience mapping. We
	* are essentially drawing a cube texture into a separate cubeTexture that contains the luminous
	* values of each fragment thats been convolved.
	* See for more:
	* http://codeflow.org/entries/2011/apr/18/advanced-webgl-part-3-irradiance-environment-map/
	*/
    export class CubeConvolver extends Object3D {
        protected _source: TextureBase;

        public redrawRequired: boolean;
        public continuousRedraw: boolean;

        // Irradiance
        private _downsampler: CubeRenderer;
        private _convolution: CubeRenderer;
        private _downsamplerMat: MaterialCubeDownsample;
        private _convolutionMat: MaterialConvolver;
        private _gaussainMat: MaterialGaussian;
        private _invRotMat: Matrix4;
        private _pass: RenderPass;
        private _specularity: number;
        private _contrast: number;

        constructor( textureType: TextureType = TextureType.UnsignedByteType, textureFormat: TextureFormat = TextureFormat.RGBAFormat ) {
            super();

            this.redrawRequired = true;
            this.continuousRedraw = false;

            this._downsampler = new CubeRenderer( 16, 16, textureType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.Linear, textureFormat );
            this._convolution = new CubeRenderer( 16, 16, textureType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.Linear, textureFormat );
            this._downsampler.cubeTarget.generateMipmaps = false;
            this._convolution.cubeTarget.generateMipmaps = false;

            this._invRotMat = new Matrix4();
            this._downsamplerMat = new MaterialCubeDownsample();
            this._convolutionMat = new MaterialConvolver();
            this._gaussainMat = new MaterialGaussian();
            this._pass = new RenderPass( null, null, PassType.ScreenQuad );
            this._specularity = 1;
            this._contrast = 1;
        }

		/*
		* Gets or sets the source cube texture we want to convolve
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        source( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._source;
            this._source = val;
            this.redrawRequired = true;
            return val;
        }

		/*
		* Gets the convolved cube texture
		* @param {RenderTargetCube}
		*/
        cubeTexture(): RenderTargetCube {
            return this._convolution.cubeTarget;
        }

		/*
		* Use this function to perform any pre-renders. Useful if an object needs to do its own render pass before a
		* the render call begins.
		* @param {Scene} scene The scene  being rendered
		* @param {Camera} camera The camera beinf used to render the scene
		* @param {RenderTarget} renderTarget The render target the scene is being drawn to
		* @param {Renderer} renderer The renderer being used to draw the scene
		* @param {boolean} Returns false if an error occurred
		*/
        prepRender( scene: Scene, camera: Camera, renderTarget?: RenderTarget, renderer?: Renderer ): boolean {
            const source = this._source;

            // If no sky then do nothing
            if ( !source )
                return true;

            if ( !this.redrawRequired && this.continuousRedraw === false )
                return true;

            this.redrawRequired = false;

            // Setup the depth / stencil clears
            const clearDepth = renderer.autoClearDepth,
                clearStencil = renderer.autoClearStencil,
                pass = this._pass,
                invRotMat = this._invRotMat,
                downSampleMat = this._downsamplerMat,
                convolveMat = this._convolutionMat,
                downsampler = this._downsampler,
                convolver = this._convolution,
                contrast = this._contrast,
                specularity = this._specularity;

            let c: Camera;

            renderer.autoClearDepth = true;
            renderer.autoClearStencil = true;

            // We first have to down sample the skybox texture. We do this because  the convolution process
            // is very expensive and this needs to be very small
            pass.material = downSampleMat;
            pass.renderTarget = downsampler.cubeTarget;
            for ( let i = 0; i < 6; i++ ) {
                c = downsampler.activateCamera( i );
                invRotMat.extractRotation( c.worldMatrix );
                downSampleMat.setUniform( 'invViewRot', invRotMat, true );
                downSampleMat.setUniform( 'invProjMatrix', c.projectionInverseMatrix, true );
                downSampleMat.setUniform( 'sampler', source, true );
                if ( !renderer.renderObjects( renderer.ssq.meshes, renderer.ssq.camera, pass ) )
                    return false;
            }

            // Now we convolve the down sampled textures. Convolution in this sense means we get the sum
            // of each of the env map pixels with respect to eachother.
            pass.material = convolveMat;
            pass.renderTarget = convolver.cubeTarget;
            for ( let i = 0; i < 6; i++ ) {
                c = convolver.activateCamera( i );
                invRotMat.extractRotation( c.worldMatrix );
                convolveMat.setUniform( 'invViewRot', invRotMat, true );
                convolveMat.setUniform( 'invProjMatrix', c.projectionInverseMatrix, true );
                convolveMat.setUniform( 'specularity', specularity, true );
                convolveMat.setUniform( 'sampler', downsampler.cubeTarget, true );
                if ( !renderer.renderObjects( renderer.ssq.meshes, renderer.ssq.camera, pass ) )
                    return false;
            }

            // Revert the clear values
            renderer.autoClearDepth = clearDepth;
            renderer.autoClearStencil = clearStencil;

            return true;
        }

		/*
		* Get or set the contrast of the convolution
		* @param {number} [Optional]
		* @returns {number}
		*/
        contrast( val?: number ): number {
            if ( val === undefined ) return this._contrast;
            this._contrast = val;
            this.redrawRequired = true;
            return val;
        }

		/*
		* Get or set the specularity of the convolution
		* @param {number} [Optional]
		* @returns {number}
		*/
        specularity( val?: number ): number {
            if ( val === undefined ) return this._specularity;
            this._specularity = val;
            this.redrawRequired = true;
            return val;
        }

		/*
		* Cleans up the class
		*/
        dispose() {
            this._downsampler.dispose();
            this._convolution.dispose();
            this._downsamplerMat.dispose();
            this._convolutionMat.dispose();
            this._pass.dispose();

            this._invRotMat = null;
            this._downsampler = null;
            this._convolution = null;
            this._downsamplerMat = null;
            this._convolutionMat = null;
            this._pass = null;
        }
    }
}