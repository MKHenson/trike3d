namespace Trike {
	/**
	* Creates a realistic skybox using planet & light scattering algorithms.
	* A separate scattering shader is used to first draw the skybox into a cube texture. The texture
	* is then used by the default skybox material. We do this to save some render cycles.
	* Inspired from the article by Sean O'Neil
	* http://http.developer.nvidia.com/GPUGems2/gpugems2_chapter16.html
	*/
    export class SkyboxAtmospheric extends Skybox {
        private _pass: RenderPass;
        private _skyMat: MaterialSkyAtmospheric;
        private _cubeRenderer: CubeRenderer;

        // Geometry for rending the skybox
        private _atmosphere: GeometrySphere;
        private _atmosphereMesh: Mesh;
        private _atmosphereArr: Array<Mesh>;

        // Variables to place to sun
        private _inclination: number;
        private _azimuth: number;
        private _sunDistance: number;
        private _sunPosition: Vec3;

        // Night properties
        private _nightColor: Color;
        private _night: TextureBase;
        private _nightOpacity: number;
        private _eulerNight: Euler;

        // Night Fog properties
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

            //
            this.renderCount = 0;

            // Night properties
            this._night = null;
            this._nightColor = new Color( 0x1F3245 );
            this._eulerNight = new Euler();

            // Night fog properties
            this._fogHazeEnabled = false;
            this._fogMin = 0.4;
            this._fogMax = 0.6;
            this._fogColor = new Color( 0xE3DBCA );

            // Scattering sun properties
            this._sunPosition = new Vec3();
            this._sunDistance = 400000;

            // The material to draw the scattering
            this._skyMat = new MaterialSkyAtmospheric();

            // The scattering renderer
            this._cubeRenderer = new CubeRenderer( textureSize, textureSize, TextureType.HalfFloatType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.NearestMipMapLinear, TextureFormat.RGBAFormat );
            this._cubeRenderer.far( 2000000 );
            this._cubeRenderer.cubeTarget.generateMipmaps = true;
            this._cubeRenderer.cubeTarget.anisotropy = 1;

            // Pass for drawing the scattering
            this._pass = new RenderPass( this._skyMat, this._cubeRenderer.cubeTarget, PassType.Albedo );

            // Creating the drawables for the scattering
            this._atmosphere = new GeometrySphere( 450000, 32, 15 );
            this._atmosphereMesh = new Mesh( this._skyMat, this._atmosphere );
            this._atmosphereArr = [ this._atmosphereMesh ];
            this._atmosphereMesh.updateWorldMatrix( true, true );

            // Set the initial values
            this.inclination( 0.49 );
            this.azimuth( 0.25 );
            this.nightFogEnabled( false );

            // Set the skybox texture
            this.skyTexture( this._cubeRenderer.cubeTarget );
        }

		/*
		* Gests the material responsible for rendering atmospheric scattering
		* @returns {MaterialSkyAtmospheric}
		*/
        atmosphericShader(): MaterialSkyAtmospheric { return this._skyMat; }

		/*
		* Gets or sets the texture size of the cube texture we use to draw the atmosphere
		* @param {number} The size of the cube texture. Ideall should be a multiple of 2
		* @returns {number}
		*/
        textureSize( val?: number ): number {
            if ( val === undefined ) return this._cubeRenderer.cubeTarget.width;

            this._cubeRenderer.resize( val );
            this._skyMat.uniformUpdated = true;
            return val;
        }

		/**
		* Cleans up the object for garbage collection
		*/
        dispose() {
            super.dispose();

            this._night = null;
            this._eulerNight = null;
            this._nightColor = null;

            this._cubeRenderer.dispose();
            this._pass.dispose();
            this._skyMat.dispose();
            this._atmosphere.dispose();
            this._atmosphereMesh.dispose();

            this._cubeRenderer = null;
            this._pass = null;
            this._atmosphereMesh = null;
            this._atmosphereArr = null;
            this._sunPosition = null;
            this._skyMat = null;
            this._atmosphere = null;
            this._atmosphereMesh = null;
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
                cubeRenderer = this._cubeRenderer,
                meshArr = this._atmosphereArr;

            let c: Camera;

            // Set the depth and stencil properties
            renderer.autoClearDepth = true;
            renderer.autoClearStencil = true;

            // Turn off mipmaps for most of the targets
            const mipmaps = pass.renderTarget.generateMipmaps;
            pass.renderTarget.generateMipmaps = false;

            // Render the world into its 6 cube textures
            for ( let i = 0; i < 6; i++ ) {
                c = cubeRenderer.activateCamera( i );

                if ( i === 5 )
                    pass.renderTarget.generateMipmaps = mipmaps;

                if ( !renderer.renderObjects( meshArr, c, pass ) )
                    return false;
            }

            // Set the skybox texture
            this.skyTexture( cubeRenderer.cubeTarget );

            // Revert the clear values
            renderer.autoClearDepth = clearDepth;
            renderer.autoClearStencil = clearStencil;

            return true;
        }

		/**
		* Calculates the sun position for the scattering shader
		*/
        private calculateSunPosition() {
            const theta: number = Math.PI * ( this._inclination - 0.5 );
            const phi: number = 2 * Math.PI * ( this._azimuth - 0.5 );
            this._sunPosition.x = this._sunDistance * Math.cos( phi );
            this._sunPosition.y = this._sunDistance * Math.sin( phi ) * Math.sin( theta );
            this._sunPosition.z = this._sunDistance * Math.sin( phi ) * Math.cos( theta );
            this._skyMat.setUniform( 'sunPosition', this._sunPosition, true );
            this._skyMat.uniformUpdated = true;
        }

		/**
		* Gets or sets the sun inclination
		* @param {number} val [Optional] In radians
		* @returns {number}
		*/
        inclination( val?: number ) {
            if ( val === undefined ) return this._inclination;
            this._inclination = val;
            this.calculateSunPosition();
            return val;
        }

		/**
		* Gets or sets the sun azimuth - The azimuth is the angle between the north vector
		* and the perpendicular projection of the star down onto the horizon.
		* @param {number} val [Optional] In radians
		* @returns {number}
		*/
        azimuth( val?: number ) {
            if ( val === undefined ) return this._azimuth;
            this._azimuth = val;
            this.calculateSunPosition();
            return val;
        }

		/**
		* Gets or sets the atmosphere turbidity - which is the cloudiness or haziness of the atmosphere
		* @param {number} val [Optional]
		* @returns {number}
		*/
        turbidity( val?: number ) {
            if ( val === undefined ) return this._skyMat._uniforms[ 'turbidity' ].value;
            this._skyMat.setUniform( 'turbidity', val, true );
            this._skyMat.uniformUpdated = true;
            return val;
        }

		/**
		* Gets or sets the reileigh factor of the atmosphere
		* @param {number} val [Optional]
		* @returns {number}
		*/
        reileigh( val?: number ) {
            if ( val === undefined ) return this._skyMat._uniforms[ 'reileigh' ].value;
            this._skyMat.setUniform( 'reileigh', val, true );
            this._skyMat.uniformUpdated = true;
            return val;
        }

		/**
		* Gets or sets the mie coefficient factor of the atmosphere
		* @param {number} val [Optional]
		* @returns {number}
		*/
        mieCoefficient( val?: number ) {
            if ( val === undefined ) return this._skyMat._uniforms[ 'mieCoefficient' ].value;
            this._skyMat.setUniform( 'mieCoefficient', val, true );
            this._skyMat.uniformUpdated = true;
            return val;
        }

		/**
		* Gets or sets the sky alpha. The alpha multiplier helps determine the ratio of day texture to night
		* @param {number} val [Optional]
		* @returns {number}
		*/
        alpha( val?: number ) {
            if ( val === undefined ) return this._skyMat._uniforms[ 'alpha' ].value;
            this._skyMat.setUniform( 'alpha', val, true );
            this._skyMat.uniformUpdated = true;
            return val;
        }

		/**
		* Gets or sets the mie direction factor of the atmosphere
		* @param {number} val [Optional]
		* @returns {number}
		*/
        mieDirectional( val?: number ) {
            if ( val === undefined ) return this._skyMat._uniforms[ 'mieDirectional' ].value;
            this._skyMat.setUniform( 'mieDirectionalG', val, true );
            this._skyMat.uniformUpdated = true;
            return val;
        }

		/**
		* Gets or sets the luminance factor of the atmosphere
		* @param {number} val [Optional]
		* @returns {number}
		*/
        luminance( val?: number ) {
            if ( val === undefined ) return this._skyMat._uniforms[ 'luminance' ].value;
            this._skyMat.setUniform( 'luminance', val, true );
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
                this._skyMat.setUniform( 'night', val );
            }
            else if ( !this._night && val ) {
                this._night = val;
                this._skyMat.addUniform( new UniformVar( 'night', Trike.UniformType.TEXTURE_CUBE, val ) );
                this._skyMat.addUniform( new UniformVar( 'quatNight', Trike.UniformType.QUAT, this._eulerNight._quaternion ) );
                this._skyMat.addDefine( ShaderDefines.NIGHT_MAP );
            }
            else {
                this._night = null;
                this._skyMat.removeUniform( 'night' );
                this._skyMat.removeUniform( 'quatNight' );
                this._skyMat.removeDefine( ShaderDefines.NIGHT_MAP );
            }

            this._skyMat.uniformUpdated = true;
            return val;
        }

		/*
		* Gets or sets the color of the fog haze eminating from the earth
		* @param {Color} val.
		* @returns {Color}
		*/
        earthAmbience( val?: Color ): Color {
            if ( val === undefined ) return this._fogColor;
            this._fogColor = val;

            if ( this._skyMat._uniforms[ 'earthAmbience' ] )
                this._skyMat.setUniform( 'earthAmbience', val );

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

		/*
		* Gets or sets if the fog haze is enabled
		* @param {boolean} val.
		* @returns {boolean}
		*/
        nightFogEnabled( val?: boolean ): boolean {
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
        nightFogMin( val?: number ): number {
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
        nightFogMax( val?: number ): number {
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
        nightFogColor( val?: Color ): Color {
            if ( val === undefined ) return this._fogColor;
            this._fogColor = val;

            if ( this._skyMat._uniforms[ 'fogColor' ] )
                this._skyMat.setUniform( 'fogColor', val );

            this._skyMat.uniformUpdated = true;
            return val;
        }
    }
}