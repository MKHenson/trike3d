namespace Trike {
	/**
	* A material for the CameraPass composition. Adds screen space fog and other camera related
	* effects to the scene before sending it to the frame buffer.
	*/
    export class MaterialCamEffects extends MaterialMulti {
        private _toneMapper: ToneMapper;
        private _whiteValue: number;
        private _fogType: FogType;
        private _fogColor: Color;
        private _fogDensity: number;
        private _fogHeightMin: number;
        private _fogHeightMax: number;
        private _fogHeightDensity: number;
        private _fogConvolver: CubeConvolver;
        private _fogFlipNormal: number;

        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.ScreenQuad ] = new PassMaterial( 'Final Material', this );

            // Fog
            this._fogType = FogType.None;
            this._fogColor = new Color( 0xffffff );
            this._fogDensity = 1;
            this._fogHeightMin = 0;
            this._fogHeightMax = 400;
            this._fogHeightDensity = 0.05;
            this._fogConvolver = null;
            this._fogFlipNormal = -1;

            // Define the commopn uniforms of the material
            this.addUniform( new UniformVar( 'composition', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'frustumCorners', Trike.UniformType.FLOAT3_ARRAY ), true );
            this.addUniform( new UniformVar( 'brightness', Trike.UniformType.FLOAT, 1 ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );
            this.addAttribute( new AttributeVar( 'frustumCornerIndex', Trike.AttributeType.SCREEN_CORNER_INDEX ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );

            this.setShaders( this.getVertexShader(), this.getFragmentShader() );

            // this._debugType = DebugType.None;
            this.depthRead = false;
            this.depthWrite = false;

            // Default tone mapping
            this._toneMapper = ToneMapper.None;
            this._whiteValue = 11.5;
            this.toneMapper( ToneMapper.Uncharted );

            // No fog by default
            this.fogType( FogType.None );
        }

		/**
		* Create the vertex shader
		* @returns {string}
		*/
        getVertexShader(): string {
            return `

				${ShaderFragments.VertParams.frustumCorners()}

				#if defined(FOG_HEIGHT) || defined(FOG_TEXTURE)
					varying vec3 frustumCornerWorld;
					uniform mat4 cameraWorldRotMat;
				#endif

				attribute vec3 position;

				void main()
				{
					gl_Position = vec4( sign( position.xy ), 0.0, 1.0 );
					${ShaderFragments.VertMain.frustumCorners()}

					#if defined(FOG_HEIGHT) || defined(FOG_TEXTURE)
						// To get the fragment world space we multiply it by the camera's world rotation matrix and then add the position in the frag shader
						frustumCornerWorld = (cameraWorldRotMat * vec4( frustumCorner, 0.0 )).xyz;
					#endif
				}
			`
        }

		/**
		* Create the fragment shader
		* @returns {string}
		*/
        getFragmentShader(): string {
            return `
                uniform sampler2D composition;
                uniform float viewHeight;
                uniform float viewWidth;

                ${ShaderFragments.FragParams.floatToVec()}
				${ShaderFragments.FragParams.frustumCorners()}

				// Fog uniforms
				#if defined(FOG)
					uniform sampler2D gBuffer2;
					uniform vec3 fogColor;
					uniform float fogDensity;

					#if defined(FOG_HEIGHT) || defined(FOG_TEXTURE)
						uniform vec3 cameraPosition;
						varying vec3 frustumCornerWorld;
					#endif

					#if defined(FOG_HEIGHT)
						uniform float fogHeightMin;
						uniform float fogHeightMax;
						uniform float fogHeightDensity;
						uniform float fogSunDistribution;
					#endif

					#ifdef FOG_TEXTURE
						uniform samplerCube fogConvolver;
						uniform float flipNormal;
					#endif
				#endif

				${ShaderFragments.FragParams.toneMapping()}

                void main()
                {
					${ShaderFragments.FragMain.quadTexCoord()}
                	vec4 compositionSample = texture2D( composition, texCoord );
                	gl_FragColor = vec4( compositionSample.xyz, 1.0 );

					${ShaderFragments.FragMain.toneMapping()}

					#if defined(FOG)

						vec4 gBuffer2Sample = texture2D( gBuffer2, texCoord );
                		float normalizedDepth = gBuffer2Sample.z;

                		vec3 fColor = fogColor;
                		float fogAmount = 0.0;

						// Get fragment in WS
						#if defined(FOG_HEIGHT) || defined(FOG_TEXTURE)

							// Gets the fragment position in world space
                			vec3 fragPositionWS = normalizedDepth * frustumCornerWorld;

							// The vert shader multiplied the frustum by the rotation, and now
							// we add the camera position to get the world position
                			fragPositionWS += cameraPosition;

						#endif

                		#if defined(FOG_LOG)
                			fogAmount = 1.0 - exp( -normalizedDepth * fogDensity );

						#elif defined(FOG_HEIGHT)

							// Gets the world position based on the depth
							// http://www.iquilezles.org/www/articles/fog/fog.htm
							// http://www.terathon.com/lengyel/Lengyel-UnifiedFog.pdf
							// http://cluelesscocoacoder.ajbhost.k-hosting.co.uk/?p=225
							// http://isnippets.blogspot.ie/2010/10/real-time-fog-using-post-processing-in.html
                			fogAmount = 1.0 - exp( -normalizedDepth * fogDensity );
                			fogAmount += ( 1.0 - smoothstep( fogHeightMin, fogHeightMax, fragPositionWS.y )) * smoothstep( fogHeightDensity, 1.0, normalizedDepth);
                			fogAmount = min( fogAmount, 1.0 );

						// TODO
                		#elif defined(FOG_LINEAR)
                			const float LOG2 = 1.442695;
                			float fogAmount = exp2( - fogDensity * fogDensity * normalizedDepth * normalizedDepth * LOG2 );
                		#endif

						#ifdef FOG_TEXTURE
							vec3 skyCoord = normalize(fragPositionWS - cameraPosition);
							skyCoord = vec3( flipNormal * skyCoord.x, skyCoord.yz );
							fColor = fColor * textureCube( fogConvolver, skyCoord ).xyz;
						#endif

						// Mixed the fog color with the fog factor
                		gl_FragColor.xyz = mix( gl_FragColor.xyz, fColor, fogAmount );

                	#endif


					gl_FragColor.w = 1.0;
                }
            `
        }

		/**
		* Gets or sets if the fog normal should be flipped
		* @param {boolean} val [Optional]
		* @returns {boolean}
		*/
        fogFlipNormal( val?: boolean ): boolean {
            if ( val === undefined ) return ( this._fogFlipNormal === -1 ? false : true );
            this._fogFlipNormal = ( val ? 1 : -1 );
            if ( this._uniforms[ 'flipNormal' ] ) this.setUniform( 'flipNormal', this._fogFlipNormal, true );
            return val;
        }

        private _validateUniforms() {
            if ( ( this._fogType === FogType.HeightBased || this._fogConvolver ) && this._fogType !== FogType.None ) {
                if ( !this._uniforms[ 'cameraWorldRotMat' ] ) {
                    this.addUniform( new UniformVar( 'cameraWorldRotMat', Trike.UniformType.MAT4 ), true );
                    this.addUniform( new UniformVar( 'cameraPosition', Trike.UniformType.FLOAT3 ), true );
                }
            }
            else {
                this.removeUniform( 'cameraWorldRotMat' );
                this.removeUniform( 'cameraPosition' );
            }
        }

		/**
		* Gets or sets the fog type
		* @param {FogType} val [Optional]
		* @returns {FogType}
		*/
        fogType( val?: FogType ): FogType {
            if ( val === undefined ) return this._fogType;

            if ( this._fogType === val ) return val;

            this._fogType = val;

            this.removeDefine( '#define FOG' );
            this.removeDefine( '#define FOG_LINEAR' );
            this.removeDefine( '#define FOG_HEIGHT' );
            this.removeDefine( '#define FOG_LOG' );

            this.removeUniform( 'fogColor' );
            this.removeUniform( 'fogDensity' );
            this.removeUniform( 'fogHeightMin' );
            this.removeUniform( 'fogHeightMax' );
            this.removeUniform( 'fogHeightDensity' );
            this.removeUniform( 'gBuffer2' );

            if ( val === FogType.Linear )
                this.addDefine( '#define FOG_LINEAR' );
            else if ( val === FogType.HeightBased ) {
                this.addDefine( '#define FOG_HEIGHT' );

                // only height properties
                this.addUniform( new UniformVar( 'fogHeightMin', Trike.UniformType.FLOAT, this._fogHeightMin ), true );
                this.addUniform( new UniformVar( 'fogHeightMax', Trike.UniformType.FLOAT, this._fogHeightMax ), true );
                this.addUniform( new UniformVar( 'fogHeightDensity', Trike.UniformType.FLOAT, this._fogHeightDensity ), true );
            }
            else if ( val !== FogType.None )
                this.addDefine( '#define FOG_LOG' );

            // All common fog properties
            if ( val !== FogType.None ) {
                this.addDefine( '#define FOG' );
                this.addUniform( new UniformVar( 'fogColor', Trike.UniformType.COLOR3, this._fogColor ), true );
                this.addUniform( new UniformVar( 'fogDensity', Trike.UniformType.FLOAT, this._fogDensity ), true );
                this.addUniform( new UniformVar( 'gBuffer2', Trike.UniformType.TEXTURE ), true );
            }

            this._validateUniforms();
            return val;
        }

		/**
		* Gets or sets the fog color
		* @param {Color} val [Optional]
		* @returns {Color}
		*/
        fogColor( val?: Color ): Color {
            if ( val === undefined ) return this._fogColor;

            this._fogColor = val;

            if ( this._fogType !== FogType.None )
                this.setUniform( 'fogColor', val, true );

            return val;
        }

		/**
		* Gets or sets the fog density
		* @param {number} val [Optional]
		* @returns {number}
		*/
        fogDensity( val?: number ): number {
            if ( val === undefined ) return this._fogDensity;

            this._fogDensity = val;

            if ( this._fogType !== FogType.None )
                this.setUniform( 'fogDensity', val, true );

            return val;
        }

		/**
		* Gets or sets the fog min height (only applicable if fog algorithm uses height base contributions)
		* @param {number} val [Optional]
		* @returns {number}
		*/
        fogHeightMin( val?: number ): number {
            if ( val === undefined ) return this._fogHeightMin;

            this._fogHeightMin = val;

            if ( this._fogType === FogType.HeightBased )
                this.setUniform( 'fogHeightMin', val, true );

            return val;
        }

		/**
		* Gets or sets the fog max height (only applicable if fog algorithm uses height base contributions)
		* @param {number} val [Optional]
		* @returns {number}
		*/
        fogHeightMax( val?: number ): number {
            if ( val === undefined ) return this._fogHeightMax;

            this._fogHeightMax = val;

            if ( this._fogType === FogType.HeightBased )
                this.setUniform( 'fogHeightMax', val, true );

            return val;
        }

		/**
		* Gets or sets the fog height density (only applicable if fog algorithm uses height base contributions)
		* @param {number} val [Optional]
		* @returns {number}
		*/
        fogHeightDensity( val?: number ): number {
            if ( val === undefined ) return this._fogHeightDensity;

            this._fogHeightDensity = val;

            if ( this._fogType === FogType.HeightBased )
                this.setUniform( 'fogHeightDensity', val, true );

            return val;
        }

        fogConvolver( val?: CubeConvolver ): CubeConvolver {
            if ( val === undefined ) return this._fogConvolver;

            if ( this._fogConvolver && val ) {
                this._fogConvolver = val;
                this.setUniform( 'fogConvolver', val.cubeTexture(), true );
                return val;
            }
            else if ( !this._fogConvolver && val ) {
                this._fogConvolver = val;
                this.addUniform( new UniformVar( 'fogConvolver', Trike.UniformType.TEXTURE_CUBE, val.cubeTexture() ), true );
                this.addUniform( new UniformVar( 'flipNormal', Trike.UniformType.FLOAT, this._fogFlipNormal ), true );
                this.addDefine( '#define FOG_TEXTURE' );
                this._validateUniforms();
            }
            else {
                this._fogConvolver = null;
                this.removeUniform( 'fogConvolver', true );
                this.removeUniform( 'flipNormal', true );
                this.removeDefine( '#define FOG_TEXTURE' );
                this._validateUniforms();
            }

            return val;
        }

		/**
		* Gets or sets the tone mapping algorithm to use on the camera
		* @param {number} val [Optional]
		* @returns {number}
		*/
        brightness( val?: number ): number {
            if ( val === undefined ) return this._uniforms[ 'brightness' ].value;
            this.setUniform( 'brightness', val, true );
            return val;
        }

        /**
		* Gets or sets the white value (only applicable to uncharted style tone mapping)
		* @param {number} val [Optional]
		* @returns {number}
		*/
        whiteValue( val?: number ): number {
            if ( val === undefined ) return this._whiteValue;
            if ( this._whiteValue === val ) return val;

            this._whiteValue = val;
            if ( this._uniforms[ 'whiteValue' ] )
                this.setUniform( 'whiteValue', val, true );

            return val;
        }

		/**
		* Gets or sets the tone mapping algorithm to use on the camera
		* @param {ToneMapper} val [Optional]
		* @returns {ToneMapper}
		*/
        toneMapper( val?: ToneMapper ): ToneMapper {
            if ( val === undefined ) return this._toneMapper;
            if ( this._toneMapper === val ) return val;

            this.removeDefine( '#define TONEMAP_SIMPLE' );
            this.removeDefine( '#define TONEMAP_LINEAR' );
            this.removeDefine( '#define TONEMAP_REINHARD' );
            this.removeDefine( '#define TONEMAP_FILMIC' );
            this.removeDefine( '#define TONEMAP_UNCHARTED' );
            this.removeUniform( 'whiteValue' );

            this._toneMapper = val;
            switch ( val ) {
                case ToneMapper.Simple:
                    this.addDefine( '#define TONEMAP_SIMPLE' );
                    break;
                case ToneMapper.Linear:
                    this.addDefine( '#define TONEMAP_LINEAR' );
                    break;
                case ToneMapper.Reinhard:
                    this.addDefine( '#define TONEMAP_REINHARD' );
                    break;
                case ToneMapper.Filmic:
                    this.addDefine( '#define TONEMAP_FILMIC' );
                    break;
                case ToneMapper.Uncharted:
                    this.addDefine( '#define TONEMAP_UNCHARTED' );
                    this.addUniform( new UniformVar( 'whiteValue', UniformType.FLOAT, this._whiteValue ), true );
                    break;
            }

            return val;
        }
    }
}
