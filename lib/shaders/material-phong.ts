namespace Trike {
	/**
	* A phong material shader that draws the material attributes into the RGBA channels
	*/
    export class MaterialPhong extends MaterialBasic implements IReflectiveMaterial {
        private _bump: TextureBase;
        private _bumpScale: number;
        private _specular: TextureBase;

        // Chrome properties
        private _chrome: TextureBase;
        private _chromeReflectivity: number;
        private _chromeCombination: ChromeCombination;
        private _refractionRatio: number;
        private _chromeDirection: ChromeDirection;
        private _flipChrome: number;

        // Translucency
        private _translucencyEnabled: boolean;
        private _translucencyMap: TextureBase;
        private _translucencyScale: number;
        private _translucencyDistortion: number;
        private _translucencyPower: number;

        constructor() {
            // Call the material base
            super();

            this._bump = null;
            this._bumpScale = 1;
            this._specular = null;
            this._chrome = null;

            // Chrome
            this._chromeReflectivity = 1;
            this._chromeCombination = 1;
            this._refractionRatio = 0.98;
            this._chromeDirection = ChromeDirection.Refractive;
            this._flipChrome = -1;

            // Translucency
            this._translucencyEnabled = false;
            this._translucencyMap = null;
            this._translucencyScale = 1;
            this._translucencyDistortion = 0.185;
            this._translucencyPower = 0.04;

            this.setShaders( this.getVertexShader(), this.getFragmentShader() );

            // GBuffer
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'diffuse', Trike.UniformType.COLOR3, new Color( 0xffffff ) ) );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'emissive', Trike.UniformType.COLOR3, new Color( 0x000000 ) ) );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'specular', Trike.UniformType.COLOR3, new Color( 0xffffff ) ) );

            // GBuffer 2
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'cameraFar', Trike.UniformType.FLOAT, 1000 ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'opacity', Trike.UniformType.FLOAT, 1 ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'shininess', Trike.UniformType.FLOAT, 0.05 ) );
        }

		/**
		* Create the vertex shader
		* @returns {string}
		*/
        getVertexShader(): string {
            return `

			// Declarations
			${ShaderFragments.VertParams.defaults()}
			${ShaderFragments.VertParams.clippingParameters()}
			${ShaderFragments.VertParams.skinDeclarations()}

			#ifdef PASS_GBUFFER
				${ShaderFragments.VertParams.envMap()}
				${ShaderFragments.VertParams.reflectionParams()}
				${ShaderFragments.ShadowMapping.vertParams()}
			#endif

			void main()
			{
				${ShaderFragments.VertMain.skin()}
				${ShaderFragments.VertMain.skinTransform()}
				${ShaderFragments.VertMain.skinTransformNormals()}
				${ShaderFragments.VertMain.defaults()}
				${ShaderFragments.VertMain.clipping()}

				#ifdef PASS_GBUFFER
					${ShaderFragments.VertMain.environmentMapping()}
					${ShaderFragments.VertMain.reflection()}
					${ShaderFragments.VertMain.refraction()}
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
			// Declarations
			${ShaderFragments.FragParams.defaults()}
			${ShaderFragments.FragParams.clippingParams()}
			${ShaderFragments.FragParams.encodeNormal()}
			${ShaderFragments.FragParams.map()}
			${ShaderFragments.FragParams.bumpmapUniforms()}
			${ShaderFragments.FragParams.bumpmapFunctions()}
			${ShaderFragments.FragParams.vecToFloat()}
			${ShaderFragments.FragParams.floatToVec()}

			#if defined(PASS_GBUFFER)
				${ShaderFragments.FragParams.reflectionParams()}
				${ShaderFragments.FragParams.environmentMapping()}
				${ShaderFragments.FragParams.refractionParams()}
				${ShaderFragments.ShadowMapping.fragParams()}

				#ifdef USE_SPECULARMAP
					uniform sampler2D specularMap;
				#endif
				uniform vec3 diffuse;
				uniform vec3 specular;
				uniform vec3 emissive;

			#elif defined(PASS_GBUFFER2)
				uniform float shininess;
			#endif

			void main()
			{
				${ShaderFragments.FragMain.clippingTest()}

				#ifdef PASS_GBUFFER

					// If the GBuffer pass needs normals
					#if defined(ATTR_NORMAL)
						vec3 normal = normalize( normalView );
						#if defined(USE_BUMPMAP)
							normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd( vUv, bumpMap, bumpScale ) );
						#endif
					#endif

					gl_FragColor = vec4( diffuse, 1.0 );
					float specularStrength = 1.0;

					// Get the color from the map
					${ShaderFragments.FragMain.alphaTest()}

					#ifndef USE_MAP
						vec4 texelColor = vec4(1.0, 1.0, 1.0, 1.0);
					#endif

					#ifdef USE_SPECULARMAP
						vec4 texelSpecular = texture2D( specularMap, vUv );
						specularStrength = texelSpecular.r;
					#endif

					${ShaderFragments.FragMain.environmentMapping()}
					${ShaderFragments.FragMain.reflection()}
					${ShaderFragments.FragMain.refraction()}
					${ShaderFragments.ShadowMapping.fragMain()}

					#ifndef SHADOW_MAPPING
						float shadowAmount = 1.0;
					#endif

					// diffuse color in x
					gl_FragColor.x = vec3_to_float( diffuse * shadowAmount );

					// specular color in y
					gl_FragColor.y = vec3_to_float( specular * specularStrength * shadowAmount );

					// Albedo in Z
					gl_FragColor.z = vec3_to_float(texelColor.xyz );

					// We store the emmsive in w
					gl_FragColor.w = vec3_to_float( emissive * shadowAmount );

				#endif
				${ShaderFragments.Passes.fragNormDepthMain()}
				${ShaderFragments.Passes.fragShadowMain()}
			}
			`
        }

		/**
		* Only remove the UV attributes if we dont have any maps
		*/
        protected _setUV( desired: boolean ) {
            if ( desired )
                super._setUV( true );
            else if ( !this._bump && !this._specular && !this._translucencyMap && !this.map() ) {
                this.removeAttribute( Trike.AttributeType.UV );
                this.removeUniform( 'uvScale' );
                this.removeDefine( ShaderDefines.ATTR_UV );
            }
        }

		/*
		* Gets or sets the specular highlight map of this material
		* @param {Texture} val [Optional]
		* @returns {Texture}
		*/
        specularMap( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._specular;

            if ( this._specular && val ) {
                this._specular = val;
                this.materials[ PassType.GBuffer ].setUniform( 'specularMap', val, false );
            }
            else if ( !this._specular && val ) {
                this._specular = val;
                this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'specularMap', Trike.UniformType.TEXTURE, val ), false );
                this._setUV( true );
                this.addDefine( ShaderDefines.SPECULAR_MAP );
            }
            else {
                this._specular = null;
                this.materials[ PassType.GBuffer ].removeUniform( 'specularMap', false );
                this._setUV( false );
                this.removeDefine( ShaderDefines.SPECULAR_MAP );
            }

            return val;
        }

		/*
		* Gets or sets the bump map of this material
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        bumpMap( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._bump;

            const gBuffer: PassMaterial = this.materials[ PassType.GBuffer ];
            const gBuffer2: PassMaterial = this.materials[ PassType.GBuffer2 ];
            const passes = [ gBuffer, gBuffer2 ];

            if ( this._bump && val ) {
                this._bump = val;

                // Sometimes the GBuffer has a bump map for refraction / reflection
                if ( gBuffer._uniforms[ 'bumpMap' ] )
                    gBuffer.setUniform( 'bumpMap', val, false );

                gBuffer2.setUniform( 'bumpMap', val, false );
                gBuffer2.setUniform( 'bumpScale', this._bumpScale, false );
            }
            else if ( !this._bump && val ) {
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
                for ( let i = 0, l = passes.length; i < l; i++ ) {
                    passes[ i ].removeUniform( 'bumpMap' );
                    passes[ i ].removeUniform( 'bumpScale' );
                    passes[ i ].removeDefine( ShaderDefines.STANDARD_DERIVATIVES );
                    passes[ i ].removeDefine( ShaderDefines.BUMP_MAP );
                }
            }

            this._validate();
            return val;
        }

		/*
		* Gets or sets the environment map of this material
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        chromeMap( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._chrome;

            const gBuffer = this.materials[ PassType.GBuffer ];

            if ( this._chrome && val ) {
                this._chrome = val;
                gBuffer.setUniform( 'envMap', val, false );
            }
            else if ( !this._chrome && val ) {
                this._chrome = val;

                gBuffer.addUniform( new UniformVar( 'chromeReflectivity', Trike.UniformType.FLOAT, this._chromeReflectivity ), false );
                gBuffer.addUniform( new UniformVar( 'envMap', Trike.UniformType.TEXTURE_CUBE, val ), false );
                gBuffer.addUniform( new UniformVar( 'useRefract', Trike.UniformType.FLOAT, this._chromeDirection ), false );
                gBuffer.addUniform( new UniformVar( 'refractionRatio', Trike.UniformType.FLOAT, this._refractionRatio ), false );
                gBuffer.addUniform( new UniformVar( 'cameraPosition', Trike.UniformType.FLOAT3 ), false );
                gBuffer.addUniform( new UniformVar( 'flipEnvMap', Trike.UniformType.FLOAT, this._flipChrome ), false );
                gBuffer.addUniform( new UniformVar( 'viewMatrix', Trike.UniformType.MAT4 ) );
                gBuffer.addDefine( ShaderDefines.USE_ENV_MAP );
            }
            else {
                this._chrome = null;

                gBuffer.removeUniform( 'chromeReflectivity', false );
                gBuffer.removeUniform( 'envMap', false );
                gBuffer.removeUniform( 'useRefract', false );
                gBuffer.removeUniform( 'refractionRatio', false );
                gBuffer.removeUniform( 'flipEnvMap', false );
                gBuffer.removeUniform( 'cameraPosition' );
                gBuffer.removeUniform( 'viewMatrix' );
                gBuffer.removeDefine( ShaderDefines.USE_ENV_MAP );
            }

            this._validate();
            return val;
        }

		/*
		* Checks the uniforms or attributes of the material after a potentially breaking change
		*/
        protected _validate() {
            const gBuffer: PassMaterial = this.materials[ PassType.GBuffer ];

            // Check for view width and height params
            if ( this.refractionEnabled() ) {
                if ( !gBuffer._uniforms[ 'viewHeight' ] ) {
                    gBuffer.addUniform( new UniformVar( 'viewHeight', UniformType.FLOAT, 512 ) );
                    gBuffer.addUniform( new UniformVar( 'viewWidth', UniformType.FLOAT, 512 ) );
                }
            }
            else {
                if ( gBuffer._uniforms[ 'viewHeight' ] ) {
                    gBuffer.removeUniform( 'viewHeight' );
                    gBuffer.removeUniform( 'viewWidth' );
                }
            }

            if ( this.refractionEnabled() || this.mirrorReflection() || this._chrome || this.maxNumShadows() > 0 ) {
                // Check for model matrix
                if ( this.mirrorReflection() || this._chrome || this.maxNumShadows() > 0 ) {
                    if ( !gBuffer._uniforms[ 'modelMatrix' ] )
                        gBuffer.addUniform( new UniformVar( 'modelMatrix', Trike.UniformType.MAT4 ) );
                }
                else {
                    if ( gBuffer._uniforms[ 'modelMatrix' ] )
                        gBuffer.removeUniform( 'modelMatrix' );
                }

                // Dont add it if there is already one there
                if ( !gBuffer._attributes[ AttributeType.NORMAL ] ) {
                    gBuffer.addUniform( new UniformVar( 'normalMatrix', UniformType.MAT3, new Matrix3() ) );
                    gBuffer.addAttribute( new AttributeVar( 'normal', Trike.AttributeType.NORMAL ) );
                    gBuffer.addDefine( ShaderDefines.ATTR_NORMAL );
                }

                if ( this._bump && !gBuffer.hasDefine( ShaderDefines.BUMP_MAP ) ) {
                    gBuffer.addDefine( ShaderDefines.STANDARD_DERIVATIVES );
                    gBuffer.addDefine( ShaderDefines.BUMP_MAP );
                    gBuffer.addUniform( new UniformVar( 'bumpScale', Trike.UniformType.FLOAT, this._bumpScale ) );
                    gBuffer.addUniform( new UniformVar( 'bumpMap', Trike.UniformType.TEXTURE, this._bump ) );
                }
                else if ( !this._bump && gBuffer.hasDefine( ShaderDefines.BUMP_MAP ) ) {
                    gBuffer.removeDefine( ShaderDefines.STANDARD_DERIVATIVES );
                    gBuffer.removeDefine( ShaderDefines.BUMP_MAP );
                    gBuffer.removeUniform( 'bumpScale' );
                    gBuffer.removeUniform( 'bumpMap' );
                }
            }
            else {
                if ( gBuffer._uniforms[ 'modelMatrix' ] )
                    gBuffer.removeUniform( 'modelMatrix' );

                // Do nothing if there nothing there
                if ( gBuffer._attributes[ AttributeType.NORMAL ] ) {
                    gBuffer.removeUniform( 'normalMatrix' );
                    gBuffer.removeAttribute( Trike.AttributeType.NORMAL );
                    gBuffer.removeDefine( ShaderDefines.ATTR_NORMAL );
                }

                if ( gBuffer.hasDefine( ShaderDefines.BUMP_MAP ) ) {
                    gBuffer.removeDefine( ShaderDefines.STANDARD_DERIVATIVES );
                    gBuffer.removeDefine( ShaderDefines.BUMP_MAP );
                    gBuffer.removeUniform( 'bumpScale' );
                    gBuffer.removeUniform( 'bumpMap' );
                }
            }
        }

		/*
		* Gets or sets if the normal that samples the environment map should be flipped or not
		* @param {boolean} val
		*/
        flipChrome( val?: boolean ): boolean {
            if ( val === undefined ) return ( this._flipChrome === -1 ? true : false );

            this._flipChrome = ( val ? -1 : 1 );
            if ( this._chrome )
                this.materials[ PassType.GBuffer ].setUniform( 'flipEnvMap', this._flipChrome, false );

            return val;
        }

		/*
		* Gets or sets the chrome sampling direction
		* @param {ChromeDirection} val
		* @returns {ChromeDirection}
		*/
        chromeDirection( val?: ChromeDirection ): ChromeDirection {
            if ( val === undefined ) return this._chromeDirection;

            this._chromeDirection = val;
            if ( this._chrome )
                this.materials[ PassType.GBuffer ].setUniform( 'useRefract', this._chromeDirection, false );

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
            if ( this._bump ) {
                const gBuffer = this.materials[ PassType.GBuffer ];
                const gBuffer2 = this.materials[ PassType.GBuffer2 ];

                gBuffer2.setUniform( 'bumpScale', val, false );

                if ( gBuffer._uniforms[ 'bumpScale' ] )
                    gBuffer.setUniform( 'bumpScale', val, false );
            }

            return this._bumpScale;
        }

		/*
		* Gets or sets the refraction ratio
		* @param {number} val [Optional]
		* @returns {number}
		*/
        refractionRatio( val?: number ): number {
            if ( val === undefined ) return this._refractionRatio;

            this._refractionRatio = val;
            if ( this._chrome )
                this.materials[ PassType.GBuffer ].setUniform( 'refractionRatio', val, false );

            return this._refractionRatio;
        }

		/*
		* Gets or sets the chrome combination method of the environment map
		* @param {ChromeCombination} val [Optional]
		* @returns {ChromeCombination}
		*/
        chromeCombination( val?: ChromeCombination ): ChromeCombination {
            if ( val === undefined ) return this._chromeCombination;

            this.materials[ PassType.GBuffer ].removeDefine( '#define CHROME_METHOD ' + this._chromeCombination.toFixed( 1 ) );
            this._chromeCombination = val;

            this.materials[ PassType.GBuffer ].addDefine( '#define CHROME_METHOD ' + this._chromeCombination.toFixed( 1 ) );
            return this._chromeCombination;
        }

		/*
		* Gets or sets the scale of the chrome reflectivity of the material. Values are from 0, being non reflective, to 1 being fully reflective.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        chromeReflectivity( val?: number ): number {
            if ( val === undefined ) return this._chromeReflectivity;

            this._chromeReflectivity = val;
            if ( this._chrome )
                this.materials[ PassType.GBuffer ].setUniform( 'chromeReflectivity', val, false );

            return this._chromeReflectivity;
        }

		/*
		* Gets or sets the scale of the reflectivity of the material. Values are from 0, being non reflective, to 1 being fully reflective.
		* @param {Color} val [Optional]
		* @returns {Color}
		*/
        diffuse( val?: Color ): Color {
            if ( val === undefined )
                return this.materials[ PassType.GBuffer ]._uniforms[ 'diffuse' ].value;

            this.materials[ PassType.GBuffer ].setUniform( 'diffuse', val, false );
            return val;
        }

		/*
		* Gets or sets specular light colour
		* @param {Color} val [Optional]
		* @returns {Color}
		*/
        specular( val?: Color ): Color {
            if ( val === undefined )
                return this.materials[ PassType.GBuffer ]._uniforms[ 'specular' ].value;

            this.materials[ PassType.GBuffer ].setUniform( 'specular', val, false );
            return val;
        }

		/*
		* Gets or sets the shininess of the specular component
		* @param {number} val [Optional]
		* @returns {number}
		*/
        shininess( val?: number ): number {
            if ( val === undefined ) return this.materials[ PassType.GBuffer2 ]._uniforms[ 'shininess' ].value;
            this.materials[ PassType.GBuffer2 ].setUniform( 'shininess', val, false );
            return val;
        }

		/*
		* Gets or sets the texture that defines material translucency
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        translucencyMap( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._translucencyMap;

            if ( this._translucencyMap && val ) {
                this._translucencyMap = val;
                if ( this._translucencyEnabled )
                    this.materials[ PassType.GBuffer2 ].setUniform( 'translucencyMap', val, false );

                return val;
            }
            if ( !this._translucencyMap && val ) {
                this._translucencyMap = val;
                if ( this._translucencyEnabled ) {
                    this._setUV( true );
                    this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'translucencyMap', Trike.UniformType.TEXTURE, val ), false );
                    this.materials[ PassType.GBuffer2 ].addDefine( ShaderDefines.TRANSLUCENCY_MAP );
                }
            }
            else {
                this._translucencyMap = null;
                if ( this._translucencyEnabled ) {
                    this._setUV( false );
                    this.materials[ PassType.GBuffer2 ].removeUniform( 'translucencyMap', false );
                    this.materials[ PassType.GBuffer2 ].removeDefine( ShaderDefines.TRANSLUCENCY_MAP );
                }
            }

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
                return val;

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
            return val;
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

            return val;
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

            return val;
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

            return val;
        }
    }
}