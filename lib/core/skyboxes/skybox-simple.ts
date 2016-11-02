namespace Trike {
	/**
	* Creates a simple sky box that draws a day / night component from cube maps.
	* A separate shader is used to first draw the skybox into a cube texture. The texture
	* is then used by the default skybox material. We do this to save some render cycles.
	*/
    export class SkyboxSimple extends Skybox {
        private _pass: RenderPass;
        private _skyMat: MaterialSkySimple;
        private _cubeRenderer: CubeRenderer;

        // Day properties
        private _day: TextureBase;
        private _dayColor: Color;
        private _eulerDay: Euler;

        // Night properties
        private _nightColor: Color;
        private _night: TextureBase;
        private _eulerNight: Euler;

        // The radio between day and night
        private _ratio: number;

        // Meshes for drawing the day night shader
        private _skyMeshArr: Array<Mesh>;

        // Fog properties
        private _fogHazeEnabled: boolean;
        private _fogMin: number;
        private _fogMax: number;
        private _fogColor: Color;

        /** A counter for external classes to see if / when the atmosphere shader was updated */
        public renderCount: number;

		/**
		* Creates a Skybox instance
		*/
        constructor( textureSize: number = 1024 ) {
            super();

            this.renderCount = 0;

            // Day
            this._day = null;
            this._dayColor = new Color( 0x65A3E0 );
            this._eulerDay = new Euler();

            // Night
            this._night = null;
            this._nightColor = new Color( 0x1F3245 );
            this._eulerNight = new Euler();

            // Other properties
            this._ratio = 1;
            this._fogHazeEnabled = false;
            this._fogMin = 0.4;
            this._fogMax = 0.6;
            this._fogColor = new Color( 0xE3DBCA );

            // The material to draw the cube map
            this._skyMat = new MaterialSkySimple( this._dayColor, this._nightColor );

            // The day night Renderer
            this._cubeRenderer = new CubeRenderer( textureSize, textureSize, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.NearestMipMapLinear, TextureFormat.RGBAFormat );
            this._cubeRenderer.far( 2000000 );
            this._cubeRenderer.cubeTarget.generateMipmaps = true;
            this._cubeRenderer.cubeTarget.anisotropy = 1;

            // Pass for drawing the cube
            this._pass = new RenderPass( this._skyMat, this._cubeRenderer.cubeTarget, PassType.Albedo );

            // Set the skybox default material properties
            this.dayColor( new Color( 0xffffff ) );
            this.fogEnabled( false );
            this.ratio( 1 );

            // The mesh for drawing the sky material
            const mesh = new Mesh( this._skyMat, this.geometry );
            mesh.setScale( 100000, 100000, 100000 );
            mesh.updateWorldMatrix( true, true );
            this._skyMeshArr = [ mesh ];

            // Set the skybox texture
            this.skyTexture( this._cubeRenderer.cubeTarget );
        }

		/*
		* Gests the material responsible for rendering atmospheric scattering
		* @returns {MaterialSkySimple}
		*/
        skyMaterial(): MaterialSkySimple { return this._skyMat; }

		/*
		* Gets or sets the texture size of the cube texture we use to draw the atmosphere
		* @param {number} The size of the cube texture. Ideall should be a multiple of 2
		* @returns {number}
		*/
        textureSize( val?: number ): number {
            if ( val === undefined ) return this._cubeRenderer.cubeTarget.width;

            this._cubeRenderer.cubeTarget.resize( val, val );
            this._skyMat.uniformUpdated = true;
            return val;
        }

		/**
		* Cleans up the object for garbage collection
		*/
        dispose() {
            super.dispose();

            this._night = null;
            this._nightColor = null;
            this._eulerNight = null;

            this._day = null;
            this._dayColor = null;
            this._eulerDay = null;

            this._cubeRenderer.dispose();
            this._pass.dispose();
            this._skyMat.dispose();

            this._cubeRenderer = null;
            this._pass = null;
            this._skyMat = null;
            this._skyMeshArr = null;

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
            // If nothing needs update, then return
            if ( !this._skyMat.uniformUpdated )
                return true;

            this._skyMat.uniformUpdated = false;
            this.renderCount++;

            // Setup the depth / stencil clears
            const clearDepth = renderer.autoClearDepth,
                clearStencil = renderer.autoClearStencil,
                pass = this._pass,
                meshArr = this._skyMeshArr,
                cubeRenderer = this._cubeRenderer;

            let c: Camera;

            renderer.autoClearDepth = true;
            renderer.autoClearStencil = true;

            // Turn off mipmaps for most of the targets
            const mipmaps = cubeRenderer.cubeTarget.generateMipmaps;
            cubeRenderer.cubeTarget.generateMipmaps = false;

            // Render the world into its 6 cube textures
            for ( let i = 0; i < 6; i++ ) {
                c = cubeRenderer.activateCamera( i );

                if ( i === 5 )
                    cubeRenderer.cubeTarget.generateMipmaps = mipmaps;

                if ( !renderer.renderObjects( meshArr, c, pass ) )
                    return false;
            }

            // Tell the skybox to use this environment texture
            this.skyTexture( cubeRenderer.cubeTarget );

            // Revert the clear values
            renderer.autoClearDepth = clearDepth;
            renderer.autoClearStencil = clearStencil;

            return true;
        }

		/*
		* Gets or sets if the fog haze is enabled
		* @param {boolean} val.
		* @returns {boolean}
		*/
        fogEnabled( val?: boolean ): boolean {
            if ( val === undefined ) return this._fogHazeEnabled;

            if ( this._fogHazeEnabled === val )
                return;

            this._fogHazeEnabled = val;

            if ( val ) {
                this._skyMat.addDefine( '#define FOG' );
                this._skyMat.addUniform( new UniformVar( 'fogMin', Trike.UniformType.FLOAT, this._fogMin ) );
                this._skyMat.addUniform( new UniformVar( 'fogMax', Trike.UniformType.FLOAT, this._fogMax ) );
                this._skyMat.addUniform( new UniformVar( 'fogColor', Trike.UniformType.COLOR3, this._fogColor ) );
            }
            else {
                this._skyMat.removeDefine( '#define FOG' );
                this._skyMat.removeUniform( 'fogMin' );
                this._skyMat.removeUniform( 'fogMax' );
                this._skyMat.removeUniform( 'fogColor' );
            }

            this._skyMat.uniformUpdated = true;
            return val;
        }

		/*
		* Gets or sets the haze fog lower limit (from 0 - 1)
		* @param {number} val.
		* @returns {number}
		*/
        fogMin( val?: number ): number {
            if ( val === undefined ) return this._fogMin;
            this._fogMin = val;

            if ( this._skyMat._uniforms[ 'fogMin' ] )
                this._skyMat.setUniform( 'fogMin', val );

            this._skyMat.uniformUpdated = true;
            return val;
        }

		/*
		* Gets or sets the haze fog upper limit (from 0 - 1)
		* @param {number} val.
		* @returns {number}
		*/
        fogMax( val?: number ): number {
            if ( val === undefined ) return this._fogMax;
            this._fogMax = val;

            if ( this._skyMat._uniforms[ 'fogMax' ] )
                this._skyMat.setUniform( 'fogMax', val );

            this._skyMat.uniformUpdated = true;
            return val;
        }

		/*
		* Gets or sets the color of the fog haze
		* @param {Color} val.
		* @returns {Color}
		*/
        fogColor( val?: Color ): Color {
            if ( val === undefined ) return this._fogColor;
            this._fogColor = val;

            if ( this._skyMat._uniforms[ 'fogColor' ] )
                this._skyMat.setUniform( 'fogColor', val );

            this._skyMat.uniformUpdated = true;
            return val;
        }

		/*
		* Gest or sets the color multiplier for day
		* @param {Color} val
		* @returns {Color}
		*/
        dayColor( val?: Color ): Color {
            if ( val === undefined ) return this._skyMat._uniforms[ 'dayColor' ].value;
            this._skyMat.setUniform( 'dayColor', val );
            this._skyMat.uniformUpdated = true;
            return val;
        }

		/*
		* Sets the cube texture or render target that is drawn for day time
		* @param {TextureBase} val The texture can be either a RenderTargetCube or a CubeTexture
		* @returns {TextureBase} The texture can be either a RenderTargetCube or a CubeTexture
		*/
        day( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._day;

            if ( this._day && val ) {
                this._day = val;
                this._skyMat.setUniform( 'daySampler', val );
            }
            else if ( !this._day && val ) {
                this._day = val;
                this._skyMat.addUniform( new UniformVar( 'daySampler', Trike.UniformType.TEXTURE_CUBE, val ) );
                this._skyMat.addUniform( new UniformVar( 'quatDay', Trike.UniformType.QUAT, this._eulerDay._quaternion ) );
                this._skyMat.addDefine( ShaderDefines.DAY_MAP );
            }
            else {
                this._day = null;
                this._skyMat.removeUniform( 'daySampler' );
                this._skyMat.removeUniform( 'quatDay' );
                this._skyMat.removeDefine( ShaderDefines.DAY_MAP );
            }

            this._skyMat.uniformUpdated = true;
            return val;
        }

		/*
		* Gets or sets the ratio of day to night. 0 Is fully daylight and 1 is fully night
		* @param {number} val A normalised value usually from 0 to 1
		* @returns {number} A normalised value usually from 0 to 1
		*/
        ratio( val?: number ): number {
            if ( val === undefined ) return this._ratio;

            if ( this._ratio === val )
                return;

            this._ratio = val;
            this._skyMat.setUniform( 'ratio', val );
            this._skyMat.uniformUpdated = true;
            return val;
        }

		/**
		* Gets or sets the rotation euler of the day cube texture
		* @param {Euler} val The euler object
		* @returns {Euler}
		*/
        eulerDay( val?: Euler ): Euler {
            if ( val === undefined ) return this._eulerDay;

            this._eulerDay = val;
            if ( !this._day )
                return;

            this._skyMat.setUniform( 'quatDay', val._quaternion );
            this._skyMat.uniformUpdated = true;
            return val;
        }

		/*
		* Gets or sets the cube texture or render target that is drawn for day time
		* @param {TextureBase} val The texture can be either a RenderTargetCube or a CubeTexture
		* @returns {TextureBase} The texture can be either a RenderTargetCube or a CubeTexture
		*/
        night( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._night;

            if ( this._night && val ) {
                this._night = val;
                this._skyMat.setUniform( 'nightSampler', val );
            }
            else if ( !this._night && val ) {
                this._night = val;
                this._skyMat.addUniform( new UniformVar( 'nightSampler', Trike.UniformType.TEXTURE_CUBE, val ) );
                this._skyMat.addUniform( new UniformVar( 'quatNight', Trike.UniformType.QUAT, this._eulerNight._quaternion ) );
                this._skyMat.addDefine( ShaderDefines.NIGHT_MAP );
            }
            else {
                this._night = null;
                this._skyMat.removeUniform( 'nightSampler' );
                this._skyMat.removeUniform( 'quatNight' );
                this._skyMat.removeDefine( ShaderDefines.NIGHT_MAP );
            }

            this._skyMat.uniformUpdated = true;
            return val;
        }

		/**
		* Gets or sets the rotation euler of the night skybox
		* @param {Euler} val The euler object
		* @returns {Euler} The euler object
		*/
        eulerNight( val?: Euler ): Euler {
            if ( val === undefined ) return this._eulerNight;
            this._eulerNight = val;
            if ( !this._night )
                return;

            this._skyMat.setUniform( 'quatNight', val._quaternion );
            this._skyMat.uniformUpdated = true;
            return val;
        }

		/*
		* Gest or sets the color multiplier for night
		* @param {Color} val
		* @returns {Color}
		*/
        nightColor( val?: Color ): Color {
            if ( val === undefined ) return this._skyMat._uniforms[ 'nightColor' ].value;
            this._skyMat.setUniform( 'nightColor', val );
            this._skyMat.uniformUpdated = true;
            return val;
        }
    }
}