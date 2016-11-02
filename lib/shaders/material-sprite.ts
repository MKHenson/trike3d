namespace Trike {
	/**
	* A material for rendering sprite or billboard type geometry
	*/
    export class MaterialSprite extends MaterialMulti {
        private _map: TextureBase;
        private _alphaTest: number;
        private _highlightBorder: boolean;
        private _highlighted: boolean;
        private _highlightColor: Color;
        private _uvScale: Vec2;
        private _bump: TextureBase;
        private _bumpScale: number;


        private _diffuse: Color;
        private _specular: Color;
        private _shininess: number;

        // Translucency
        private _translucencyEnabled: boolean;
        private _translucencyScale: number;
        private _translucencyDistortion: number;
        private _translucencyPower: number;



        constructor() {
            //Call the material base
            super( MultiMaterialOptions.CreateDefaults );

            this._map = null;
            this._alphaTest = 0;
            this._highlightBorder = false;
            this._highlighted = false;
            this._uvScale = new Vec2( 1, 1 );
            this._bump = null;
            this._bumpScale = 1;

            this._highlightColor = new Color( 0xF6FA7D );

            this._diffuse = new Color( 0xffffff );
            this._specular = new Color( 0xffffff );
            this._shininess = 0.05;

            this._translucencyEnabled = false;
            this._translucencyScale = 1;
            this._translucencyDistortion = 0.185;
            this._translucencyPower = 0.04;

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'modelMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'modelViewMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'projectionMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'rotation', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'customClipping', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'customClipPlane', Trike.UniformType.FLOAT4 ), true );

            // GBuffer only
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'emissive', Trike.UniformType.COLOR3, new Color( 0xffffff ) ) );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'diffuse', Trike.UniformType.COLOR3, this._diffuse ), false );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'specular', Trike.UniformType.COLOR3, this._specular ), false );

            // Add the camera far uniform to the normal depth material
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'cameraFar', Trike.UniformType.FLOAT, 1000 ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'opacity', Trike.UniformType.FLOAT, 1 ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'shininess', Trike.UniformType.FLOAT, this._shininess ) );

            //Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            //Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );


            // We dont use traditional normals for screen quads
            this.materials[ PassType.GBuffer2 ].removeDefine( ShaderDefines.ATTR_NORMAL );
            this.materials[ PassType.GBuffer2 ].removeAttribute( AttributeType.NORMAL );
            this.materials[ PassType.GBuffer2 ].removeUniform( 'normalMatrix' );
            this.materials[ PassType.GBuffer2 ].addDefine( ShaderDefines.FORWARD_NORMAL );

            this.setShaders( this.getVertexShader(), this.getFragmentShader() );
        }

		/**
		* Create the vertex shader
		* @returns {string}
		*/
        getVertexShader(): string {
            return `

				${ShaderFragments.VertParams.defaults()}
				${ShaderFragments.VertParams.clippingParameters()}
				uniform float rotation;

				#if !defined(SHADOW_MAPPING)
					uniform mat4 modelMatrix;
				#endif

				#if defined(ATTR_UV)
					uniform float flipUV;
				#endif

				#if defined(ATTR_UV)
					uniform vec2 uvOffset;
				#endif

				#if defined(PASS_GBUFFER)
					${ShaderFragments.ShadowMapping.vertParams()}
				#endif

				void main()
				{
					#ifdef ATTR_UV
						vUv = uvOffset + uv * uvScale;
						if ( flipUV === 1.0 )
						vUv = vec2( 1.0, 1.0 ) - vUv;
					#endif

					float sx = length( vec3( modelMatrix[0][0], modelMatrix[1][0], modelMatrix[2][0] ) );
					float sy = length( vec3( modelMatrix[0][1], modelMatrix[1][1], modelMatrix[2][1] ) );
					float sz = length( vec3( modelMatrix[0][2], modelMatrix[1][2], modelMatrix[2][2] ) );

					vec2 alignedPosition = position.xy * vec2(sx, sy);

					vec2 rotatedPosition;
					rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
					rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;

					vec4 mvPosition;
					mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
					mvPosition.xy += rotatedPosition;

					${ShaderFragments.VertMain.clipping()}

					gl_Position = projectionMatrix * mvPosition;

					//	Shadows
					#if defined(PASS_GBUFFER)
						#if defined(SHADOW_MAPPING)
							vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
						#endif

						${ShaderFragments.ShadowMapping.vertMain()}
					#endif

					// We need to add the pass data
					${ShaderFragments.Passes.vertNormDepthMain()}
				}
			`
        }

		/**
		* Create the fragment shader
		* @returns {string}
		*/
        getFragmentShader(): string {
            return `

			${ShaderFragments.FragParams.defaults()}
			${ShaderFragments.FragParams.clippingParams()}
			${ShaderFragments.FragParams.encodeNormal()}
			${ShaderFragments.FragParams.map()}
			${ShaderFragments.FragParams.bumpmapUniforms()}
			${ShaderFragments.FragParams.bumpmapFunctions()}
			${ShaderFragments.FragParams.vecToFloat()}

			// GBUFFER PASS
			// ************************
			#if defined(PASS_GBUFFER)
				uniform vec3 emissive;
				${ShaderFragments.ShadowMapping.fragParams()}

				#if defined(HIGHTLIGHT_BORDER)
					uniform float highlighted;
					uniform vec3 highlightColor;
				#endif

				uniform vec3 diffuse;
				uniform vec3 specular;
			#endif

			// GBUFFER2 PASS
			// ************************
			#if defined(PASS_GBUFFER2)
				uniform float shininess;
			#endif

			uniform float flipUV;

			void main()
			{

				${ShaderFragments.FragMain.clippingTest()}

				#if defined(PASS_GBUFFER)

					${ShaderFragments.FragMain.alphaTest()}

					gl_FragColor = vec4( emissive.x, emissive.y, emissive.z, 1.0 );

					// Highlights the sprite with the highlight color
					#if defined(HIGHTLIGHT_BORDER)
						if ( highlighted === 1.0 )
							gl_FragColor.xyz = gl_FragColor.xyz * highlightColor;
					#endif

					float specularStrength = 1.0;

					#ifndef USE_MAP
						vec4 texelColor = vec4(1.0, 1.0, 1.0, 1.0);
					#endif

					${ShaderFragments.ShadowMapping.fragMain()}

					#ifndef SHADOW_MAPPING
						float shadowAmount = 1.0;
					#endif

					// Emmsive in w
					gl_FragColor.w = vec3_to_float( gl_FragColor.xyz * shadowAmount );

					// Diffuse in x
					gl_FragColor.x = vec3_to_float( diffuse * shadowAmount );

					// Specular in y
					gl_FragColor.y = vec3_to_float( specular * specularStrength * shadowAmount );

					// Albedo in Z
					gl_FragColor.z = vec3_to_float( texelColor.xyz );

				#endif

				${ShaderFragments.Passes.fragNormDepthMain()}
				${ShaderFragments.Passes.fragShadowMain()}
			}
			`
        }

		/**
		* Only remove the UV attributes if we dont have any maps
		*/
        _setUV( desired: boolean ) {
            if ( desired ) {
                this.addAttribute( new AttributeVar( 'uv', Trike.AttributeType.UV ) );
                this.addUniform( new UniformVar( 'uvOffset', Trike.UniformType.FLOAT2, new Vec2( 0, 0 ) ) );
                this.addUniform( new UniformVar( 'uvScale', Trike.UniformType.FLOAT2, new Vec2( 1, 1 ) ) );
                this.addUniform( new UniformVar( 'flipUV', Trike.UniformType.FLOAT, 0 ), true );
                this.addDefine( ShaderDefines.ATTR_UV );
            }
            else if ( !this._map && !this._bump ) {
                this.removeUniform( 'uvOffset' );
                this.removeUniform( 'uvScale' );
                this.removeUniform( 'flipUV' );
                this.removeAttribute( Trike.AttributeType.UV );
                this.removeDefine( ShaderDefines.ATTR_UV );
            }
        }

		/*
		* Gets or sets the texture map of this material
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        map( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._map;

            if ( this._map && val ) {
                this._map = val;
                this.setUniform( 'map', val, true );
            }
            else if ( !this._map && val ) {
                this._map = val;
                this.addUniform( new UniformVar( 'map', Trike.UniformType.TEXTURE, val ) );
                this._setUV( true );
                this.addDefine( ShaderDefines.USE_MAP );
            }
            else {
                this._map = null;
                this.removeUniform( 'map' );
                this.removeDefine( ShaderDefines.USE_MAP );
                this._setUV( false );
            }

            return val;
        }

		/*
		* Gets or sets the bump map of this material
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        bumpMap( val?: TextureBase ): TextureBase {
            if ( val === undefined ) this._bump;

            const gBuffer2: MaterialMulti = this.materials[ PassType.GBuffer2 ];

            if ( this._bump && val ) {
                this._bump = val;
                gBuffer2.setUniform( 'bumpMap', val, false );
                gBuffer2.setUniform( 'bumpScale', this._bumpScale, false );
                return val;
            }
            if ( !this._bump && val ) {
                this._bump = val;
                this._setUV( true );
                gBuffer2.addUniform( new UniformVar( 'bumpMap', Trike.UniformType.TEXTURE, val ) );
                gBuffer2.addUniform( new UniformVar( 'bumpScale', Trike.UniformType.FLOAT, this._bumpScale ) );
                gBuffer2.addDefine( ShaderDefines.STANDARD_DERIVATIVES );
                gBuffer2.addDefine( ShaderDefines.BUMP_MAP );
            }
            else {
                this._bump = null;
                this._setUV( false );
                gBuffer2.removeUniform( 'bumpMap' );
                gBuffer2.removeUniform( 'bumpScale' );
                gBuffer2.removeDefine( ShaderDefines.STANDARD_DERIVATIVES );
                gBuffer2.removeDefine( ShaderDefines.BUMP_MAP );
            }

            return val;
        }

		/*
		* Gets or sets the bumpiness scale of the bump map.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        bumpScale( val?: number ): number {
            if ( val === undefined ) return this._bumpScale;

            this._bumpScale = val;
            if ( this._bump )
                this.materials[ PassType.GBuffer2 ].setUniform( 'bumpScale', val, false );

            return val;
        }


		/**
		* Gets or sets the alpha test value. Alpha tests are used to discard pixels with alpha less than
		* the value set as the test. I.e. if the alpha test is 0.5, then any pixels with an
		* alpha value of less than 0.5 are discarded from the render process.
		* @param {number} val
		*/
        alphaTest( val: number ): number {
            if ( val === undefined ) return this._alphaTest;

            this.removeDefine( '#define ALPHATEST ' + this._alphaTest.toFixed( 3 ) );
            this._alphaTest = val;

            if ( val !== 0 )
                this.addDefine( '#define ALPHATEST ' + this._alphaTest.toFixed( 3 ) );

            return this._alphaTest;
        }

		/*
		* Gets or sets if the sprite highliting should be on or off. Useful for showing if a sprite is selected for example.
		* @param {boolean} val [Optional]
		* @returns {boolean}
		*/
        highlightBorder( val?: boolean ): boolean {
            if ( val === undefined ) return this._highlightBorder;

            this.removeDefine( '#define HIGHTLIGHT_BORDER' );
            this.materials[ PassType.GBuffer ].removeUniform( 'highlighted', false );
            this.materials[ PassType.GBuffer ].removeUniform( 'highlightColor', false );
            this._highlightBorder = val;

            if ( val ) {
                this.addDefine( '#define HIGHTLIGHT_BORDER' );

                this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'highlighted', UniformType.FLOAT, 0 ), false );
                this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'highlightColor', Trike.UniformType.COLOR3, this._highlightColor ), false );
                this._setUV( true );
            }
            else
                this._setUV( false );

            return val;
        }

		/*
		* Gets or sets if the sprite is highlighted or not.  Only works if highlightBorder is true
		* @param {boolean} val [Optional]
		* @returns {boolean}
		*/
        highlighted( val?: boolean ): boolean {
            if ( val === undefined ) return this._highlighted;

            const update: boolean = ( this._highlighted !== val ? true : false );
            this._highlighted = val;
            if ( update )
                this.materials[ PassType.GBuffer ].setUniform( 'highlighted', ( val ? 1 : 0 ), false );

            return val;
        }

		/*
		* Gets or sets the color multiplier of the sprite when its 'highlighted'. Only works if highlightBorder is true
		* @param {Color} val [Optional]
		* @returns {Color}
		*/
        highlightColor( val?: Color ): Color {
            if ( val === undefined ) return this._highlightColor;

            this._highlightColor = val;
            if ( this._highlighted )
                this.materials[ PassType.GBuffer ].setUniform( 'highlightColor', val, false );

            return val;
        }

		/*
		* Gets or sets the rotation amount of the sprite in radians
		* @param {number} val [Optional]
		* @returns {number}
		*/
        rotation( val?: number ): number {
            if ( val === undefined ) return this._uniforms[ 'rotation' ].value;
            this.setUniform( 'rotation', val, true );
            return val;
        }

		/*
		* Gets or sets the UV scale of the texture coordinates. Higher values mean higher UV tesselation
		* @param {Vec2} val
		* @returns {Vec2}
		*/
        uvScale( val?: Vec2 ): Vec2 {
            if ( val === undefined ) return this._uvScale;

            this._uvScale = val;

            if ( this._map ) {
                this.setUniform( 'uvScale', this._uvScale, true );
                return this._uvScale;
            }

            return this._uvScale;
        }

		/*
		* Gets or sets the diffuse lighting color of the material
		* @param {number} val [Optional]
		* @returns {number}
		*/
        diffuse( val?: Color ): Color {
            if ( val === undefined )
                return this._diffuse;

            this._diffuse = val;
            this.materials[ PassType.GBuffer ].setUniform( 'diffuse', val, false );

            return this._diffuse;
        }

		/*
		* Gets or sets specular light colour
		* @param {number} val [Optional]
		* @returns {number}
		*/
        specular( val?: Color ): Color {
            if ( val === undefined )
                return this._specular;

            this._specular = val;
            this.materials[ PassType.GBuffer ].setUniform( 'specular', val, false );

            return val;
        }

		/*
		* Gets or sets emissive light colour
		* @param {number} val [Optional]
		* @returns {number}
		*/
        emissive( val?: Color ): Color {
            if ( val === undefined )
                return this.materials[ PassType.GBuffer ]._uniforms[ 'emissive' ].value;

            this.materials[ PassType.GBuffer ].setUniform( 'emissive', val, false );
            return val;
        }

		/*
		* Gets or sets the shininess of the specular component
		* @param {number} val [Optional]
		* @returns {number}
		*/
        shininess( val?: number ): number {
            if ( val === undefined ) return this._shininess;

            this._shininess = val;
            this.materials[ PassType.GBuffer2 ].setUniform( 'shininess', val, false );

            return val;
        }

		/*
		* Gets or sets the opacity of this material. The values are from 0 to 1.
		* @param {number} val
		*/
        opacity( val: number ): number {
            if ( val === undefined ) return this.materials[ PassType.GBuffer2 ]._uniforms[ 'opacity' ].value;

            this.materials[ PassType.GBuffer2 ].setUniform( 'opacity', val, false );
            return val;
        }

		/*
		* Gets or sets if translucency is enabled
		* @param {number} val [Optional]
		* @returns {number}
		*/
        translucencyEnabled( val?: boolean ): boolean {
            if ( val === undefined ) return this._translucencyEnabled;

            if ( this._translucencyEnabled === val )
                return;

            if ( val ) {
                this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'translucencyScale', Trike.UniformType.FLOAT, this._translucencyScale ), false );
                this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'translucencyDistortion', Trike.UniformType.FLOAT, this._translucencyDistortion ), false );
                this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'translucencyPower', Trike.UniformType.FLOAT, this._translucencyPower ), false );
                this.materials[ PassType.GBuffer2 ].addDefine( ShaderDefines.TRANSLUCENCY_ENABLED );
            }
            else {
                this.materials[ PassType.GBuffer2 ].removeUniform( 'translucencyScale', false );
                this.materials[ PassType.GBuffer2 ].removeUniform( 'translucencyDistortion', false );
                this.materials[ PassType.GBuffer2 ].removeUniform( 'translucencyPower', false );
                this.materials[ PassType.GBuffer2 ].removeDefine( ShaderDefines.TRANSLUCENCY_ENABLED );
            }

            this._translucencyEnabled = val;
        }

		/*
		* Gets or sets the translucency scale of the material. This is a uniform multiplier of the effect.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        translucencyScale( val?: number ): number {
            if ( val === undefined ) return this._translucencyScale;

            this._translucencyScale = val;
            if ( this._translucencyEnabled )
                this.materials[ PassType.GBuffer2 ].setUniform( 'translucencyScale', val, false );
        }

		/*
		* Gets or sets the translucency distortion of the material.
		* Modifies the light angle as it enters the material
		* @param {number} val [Optional]
		* @returns {number}
		*/
        translucencyDistortion( val?: number ): number {
            if ( val === undefined ) return this._translucencyDistortion;

            this._translucencyDistortion = val;
            if ( this._translucencyEnabled )
                this.materials[ PassType.GBuffer2 ].setUniform( 'translucencyDistortion', val, false );
        }


		/*
		* Gets or sets the translucency power of the material.
		* Increasing this has the effect of narrowing the area of the effect
		* @param {number} val [Optional]
		*/
        translucencyPower( val?: number ): number {
            if ( val === undefined ) return this._translucencyPower;

            this._translucencyPower = val;
            if ( this._translucencyEnabled )
                this.materials[ PassType.GBuffer2 ].setUniform( 'translucencyPower', val, false );
        }

		/*
		* Checks the uniforms or attributes of the material after a potentially breaking change
		*/
        protected _validate() {
            if ( !this.materials[ PassType.GBuffer ]._uniforms[ 'modelMatrix' ] )
                this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'modelMatrix', Trike.UniformType.MAT4 ), false );
        }

        ///**
        //* Gets or sets the softening filtering method of the shadow map
        //* @param val {ShadowSoftener} [Optional]
        //* @returns {ShadowSoftener}
        //*/
        //      shadowSoftener(val?: ShadowSoftener): ShadowSoftener
        //      {
        //          if (val === undefined) return this._shadowType;

        //          this._shadowType = val;

        //          this.materials[PassType.GBuffer].removeDefine(ShaderDefines.SHADOW_FILTER_INTERPOLATED);
        //          this.materials[PassType.GBuffer].removeDefine(ShaderDefines.SHADOW_FILTER_PCF);
        //          this.materials[PassType.GBuffer].removeDefine(ShaderDefines.SHADOW_FILTER_PCF_SOFT);

        //          if (val === ShadowSoftener.Interpolated)
        //              this.materials[PassType.GBuffer].addDefine(ShaderDefines.SHADOW_FILTER_INTERPOLATED);
        //          else if (val === ShadowSoftener.PCF)
        //              this.materials[PassType.GBuffer].addDefine(ShaderDefines.SHADOW_FILTER_PCF);
        //          else if (val === ShadowSoftener.PCFSoft)
        //              this.materials[PassType.GBuffer].addDefine(ShaderDefines.SHADOW_FILTER_PCF_SOFT);

        //          return val;
        //      }

        ///**
        //* Gets or sets the quality of the shadow mapping filtering system
        //* @param val {ShadowQuality} [Optional]
        //* @returns {ShadowQuality}
        //*/
        //      shadowQuality(val?: ShadowQuality): ShadowQuality
        //      {
        //          if (val === undefined) return this._shadowFilter;

        //          this._shadowFilter = val;
        //          if (this._shadowFilter === ShadowQuality.High)
        //          {
        //              this.materials[PassType.GBuffer].addDefine(ShaderDefines.SHADOW_TYPE_VSM);
        //              this.materials[PassType.ShadowLightPass].addDefine(ShaderDefines.SHADOW_TYPE_VSM);
        //              this.materials[PassType.ShadowLightPass].addDefine(ShaderDefines.STANDARD_DERIVATIVES);
        //              this.materials[PassType.ShadowLightPass].cullMode = CullFormat.Front;
        //          }
        //          else
        //          {
        //              this.materials[PassType.GBuffer].removeDefine(ShaderDefines.SHADOW_TYPE_VSM);
        //              this.materials[PassType.ShadowLightPass].removeDefine(ShaderDefines.SHADOW_TYPE_VSM);
        //              this.materials[PassType.ShadowLightPass].removeDefine(ShaderDefines.STANDARD_DERIVATIVES);
        //              this.materials[PassType.ShadowLightPass].cullMode = CullFormat.Back;
        //          }

        //          return val;
        //      }

        ///**
        //* Gets or sets or the number of shadows this material supports
        //* @param val {number} [Optional]
        //* @returns {number}
        //*/
        //maxNumShadows(val?: number): number
        //{
        //if (val === undefined) return this._maxNumShadows;

        //if (val < 0) val = 0;
        //if (this._maxNumShadows === val) return this._maxNumShadows;

        //const gBuffer: PassMaterial = this.materials[PassType.GBuffer];
        //gBuffer.removeDefine('#define MAX_SHADOWS ' + this._maxNumShadows.toFixed(0));

        //this._maxNumShadows = val;

        //gBuffer.receivesShadows = false;
        //gBuffer.removeDefine(ShaderDefines.SHADOW_MAPPING);
        //gBuffer.removeUniform('shadowMap');
        //gBuffer.removeUniform('shadowMapSize');
        //gBuffer.removeUniform('shadowBias');
        //gBuffer.removeUniform('shadowDarkness');
        //gBuffer.removeUniform('shadowMatrix');

        //if (val > 0)
        //{
        //    const uTextures = new Array<Texture>(val);
        //    const uShadowSizes = new Array<number>(val);
        //    const uShadowBiases = new Array<number>(val);
        //    const uShadowDarknesses = new Array<number>(val);
        //    const uShadowMatrices = new UniformArray<Matrix4>(new Array<Matrix4>(val), 16);

        //    for (const i = 0; i < val; i++)
        //    {
        //        uTextures[i] = null;
        //        uShadowSizes[i] = 0;
        //        uShadowBiases[i] = 0;
        //        uShadowDarknesses[i] = 0;
        //        uShadowMatrices.values[i] = new Matrix4();
        //    }

        //    gBuffer.receivesShadows = true;
        //    gBuffer.addUniform(new UniformVar('shadowMap', UniformType.UNI_TEXTURE_ARRAY, uTextures));
        //    gBuffer.addUniform(new UniformVar('shadowMapSize', UniformType.UNI_FLOAT_ARRAY, uShadowSizes));
        //    gBuffer.addUniform(new UniformVar('shadowBias', UniformType.UNI_FLOAT_ARRAY, uShadowBiases));
        //    gBuffer.addUniform(new UniformVar('shadowDarkness', UniformType.UNI_FLOAT_ARRAY, uShadowDarknesses));
        //    gBuffer.addUniform(new UniformVar('shadowMatrix', UniformType.UNI_MAT4_ARRAY, uShadowMatrices));
        //    gBuffer.addDefine(ShaderDefines.SHADOW_MAPPING);
        //    gBuffer.addDefine('#define MAX_SHADOWS ' + this._maxNumShadows.toFixed(0));

        //    this.shadowQuality(this._shadowFilter);
        //}

        //}
    }
}