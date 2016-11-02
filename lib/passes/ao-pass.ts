namespace Trike {
    export enum AOType {
        SSAO,
        HBSA
    }

	/**
	* Performs the passes to draw an ambient occulusion shadow on the scene
	*/
    export class AOPass extends CompositionPass {
        public materialSSAO: MaterialAO;
        public materialHBAO: MaterialHBAO;
        public currentAO: MaterialMulti;
        public blurHorizontal: MaterialGaussian;
        public blurVertical: MaterialGaussian;
        private copy: MaterialScreenTexture;

        private _tempTarget1: RenderTarget;
        private _tempTarget2: RenderTarget;
        private _tempTarget3: RenderTarget;

        private _blurPass: boolean;

        private _noiseImage: HTMLImageElement;
        private _noiseTexture: Texture;

        private _w: number;
        private _h: number;

        private _hbaoScale: number;
        private _aoScale: number;
        private _noiseScale: number;

        constructor() {
            super( 'AO Pass', null, null, FilterType.ScreenQuad, Phase.LightingSolid );

            this._noiseTexture = this.generateNoiseTexture( 4, 4 );
            this._tempTarget1 = new RenderTarget( 2, 2, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.Linear, TextureFormat.RGBFormat, 0, false, false );
            this._tempTarget2 = new RenderTarget( 2, 2, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.Linear, TextureFormat.RGBFormat, 0, false, false );
            this._tempTarget3 = new RenderTarget( 2, 2, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.Linear, TextureFormat.RGBFormat, 0, false, false );

            this.materialSSAO = new MaterialAO();
            this.materialHBAO = new MaterialHBAO();
            this.materialSSAO.setUniform( 'noiseSampler', this._noiseTexture, true );
            this.materialHBAO.setUniform( 'noiseSampler', this._noiseTexture, true );

            this.blurHorizontal = new MaterialGaussian();
            this.blurVertical = new MaterialGaussian();
            this.blurHorizontal.crossBilateralFilter( true );
            this.blurVertical.crossBilateralFilter( true );
            this.blurHorizontal.setDirection( true );
            this.blurVertical.setDirection( false );

            this.copy = new MaterialScreenTexture( false );
            this.copy.blendMode = BlendMode.Multiplication;
            this._hbaoScale = 0.5;
            this._aoScale = 0.5;

            this.currentAO = this.materialSSAO;

            this.autoClearStencil = false;
            this.autoClearDepth = false;

            this.numSubPasses = 4;
            this._blurPass = true;
            this.noiseScale( 1 );
        }

		/**
		* Gets or sets the type of AO material to use
		* @param {AOType} val [Optional]
		* @returns {AOType}
		*/
        type( val?: AOType ): AOType {
            if ( val === undefined ) return ( this.currentAO instanceof MaterialAO ? AOType.SSAO : AOType.HBSA );

            if ( val === AOType.SSAO ) {
                this.currentAO = this.materialSSAO;
                this._tempTarget1.resize( this._w * this._aoScale, this._h * this._aoScale );
            }
            else {
                this.currentAO = this.materialHBAO;
                this._tempTarget1.resize( this._w * this._hbaoScale, this._h * this._hbaoScale );
                this.currentAO.setUniform( 'noiseScale', new Vec2( this._w * this._hbaoScale / 4, this._h * this._hbaoScale / 4 ), true );
            }

            return val;
        }

		/**
		* Gets or sets if the AO should blur the result before sending it to the screen
		* @param {boolean} val [Optional]
		* @returns {boolean}
		*/
        blurPass( val?: boolean ): boolean {
            if ( val === undefined ) return this._blurPass;
            this._blurPass = val;
            return val;
        }

		/**
		* Resizes the render target, if present, in this pass
		* @param {number} width The width of the render target
		* @param {height} width The height of the render target
		*/
        resize( width: number, height: number ) {
            this._w = width;
            this._h = height;

            this.materialSSAO.setUniform( 'texelSize', new Vec2( 1 / width, 1 / height ), true );

            if ( this.currentAO === this.materialHBAO )
                this._tempTarget1.resize( width * this._hbaoScale, height * this._hbaoScale );
            else
                this._tempTarget1.resize( width * this._aoScale, height * this._aoScale );

            this._tempTarget2.resize( width, height );
            this._tempTarget3.resize( width, height );

            this.noiseScale( this._noiseScale );
        }

		/**
		* Creates a noise texture for the AO materials
		* @param {number} width
		* @param {number} height
		* @param {DataTexture}
		*/
        private generateNoiseTexture( width: number, height: number ): DataTexture {
            const noise = new Float32Array( width * height * 4 );
            let xy: Vec3 = new Vec3();
            for ( let y = 0; y < height; ++y ) {
                for ( let x = 0; x < width; ++x ) {
                    xy = Random.pointInsideSphere( 1, undefined, xy, true );
                    const z = Math.random();
                    const w = Math.random();

                    const offset = 4 * ( y * width + x );
                    noise[ offset + 0 ] = xy.x;
                    noise[ offset + 1 ] = xy.y;
                    noise[ offset + 2 ] = z;
                    noise[ offset + 3 ] = w;
                }
            }

            return new DataTexture( noise, width, height, TextureFormat.RGBAFormat, TextureType.FloatType,
                1, TextureMapping.UVMapping, TextureWrapping.RepeatWrapping, TextureWrapping.RepeatWrapping,
                TextureFilter.Nearest, TextureFilter.Nearest );
        }

		/**
		* This is called just before the render function. Use it, to setup the composition pass before rendering
		* @param {RenderTarget} renderTarget The render target defined by the user
		* @param {Scene} scene The scene being drawn
		* @param {Camera} camera The camera used to draw the scene
		* @param {Renderer} renderer The renderer drawing the scene
		*/
        prepPass( renderTarget: RenderTarget, scene: Scene, camera: Camera, renderer: Renderer ) {
            if ( this.currentSubPass === 0 ) {
                // Shares the same depth and stencil data from the Gbuffer
                if ( !this._tempTarget1.sharedRenderBuffer )
                    this._tempTarget1.sharedRenderBuffer = renderer.defaultCollection.gBufferPass.renderTarget;

                this.autoClearColor = true;
                this.material = this.currentAO;
                this.renderTarget = this._tempTarget1;
            }
            else if ( this._blurPass && this.currentSubPass === 1 ) {
                this.material = this.blurHorizontal;
                this.blurHorizontal.map( this._tempTarget1 );
                this.renderTarget = this._tempTarget2;
            }
            else if ( this._blurPass && this.currentSubPass === 2 ) {
                this.material = this.blurVertical;
                this.blurVertical.map( this._tempTarget2 );
                this.renderTarget = this._tempTarget3;
            }
            else if ( this.currentSubPass === 3 ) {
                this.autoClearColor = false;
                this.material = this.copy;

                if ( this._blurPass )
                    this.copy.map( this._tempTarget3 );
                else
                    this.copy.map( this._tempTarget1 );

                this.renderTarget = renderTarget;
            }
        }

		/**
		* Gets or sets the noise scale of the AO
		* @param {number} val [Optional]
		* @returns {number}
		*/
        noiseScale( val?: number ): number {
            if ( val === undefined ) return this._noiseScale;

            this._noiseScale = val;

            this.materialSSAO.setUniform( 'noiseScale', new Vec2(( this._w * this._aoScale ) / val, ( this._h * this._aoScale ) / val ) );
            this.materialHBAO.noiseScale( new Vec2(( this._w * this._hbaoScale ) / val, ( this._h * this._hbaoScale ) / val ) );
            return val;
        }

        /**
		* Gets or sets the radius of the pixels from each sample point.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        samplingRadius( val?: number ): number {
            if ( val === undefined ) return this.materialSSAO._uniforms[ 'samplingRadius' ].value;

            this.materialSSAO.setUniform( 'samplingRadius', val, true );
            return val;
        }


		/**
		* Gets or sets the distance of how far the AO sample radius is
		* @param {number} val [Optional]
		* @returns {number}
		*/
        distance( val?: number ): number {
            if ( val === undefined ) return this.materialSSAO._uniforms[ 'distance' ].value;

            this.materialSSAO.setUniform( 'distance', val, true );
            return val;
        }

		/**
		* Gets or sets the max intensity of the AO
		* @param {number} val [Optional]
		* @returns {number}
		*/
        intensity( val?: number ): number {
            if ( val === undefined ) return this.materialSSAO._uniforms[ 'intensity' ].value;

            this.materialSSAO.setUniform( 'intensity', val, true );
            return val;
        }

		/**
		* Gets or sets the occuler bias. This helps prevent self occlusion.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        occluderBias( val?: number ): number {
            if ( val === undefined ) return this.materialSSAO._uniforms[ 'occluderBias' ].value;

            this.materialSSAO.setUniform( 'occluderBias', val, true );
            return val;
        }

		/**
		* Gets or sets the first attenuation scalar
		* @param {number} val [Optional]
		* @returns {number}
		*/
        att1( val?: number ): number {
            if ( val === undefined ) return this.materialSSAO._uniforms[ 'attenuation1' ].value;

            this.materialSSAO.setUniform( 'attenuation1', val, true );
            return val;
        }

		/**
		* Gets or sets the second attenuation scalar
		* @param {number} val [Optional]
		* @returns {number}
		*/
        att2( val?: number ): number {
            if ( val === undefined ) return this.materialSSAO._uniforms[ 'attenuation2' ].value;

            this.materialSSAO.setUniform( 'attenuation2', val, true );
            return val;
        }
    }
}