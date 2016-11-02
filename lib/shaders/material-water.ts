namespace Trike {
	/**
	* A phong material shader that adds support for water functions
	*/
    export class MaterialWater extends MaterialPhong {
        private _noisePass: MaterialPass;
        private _materialPassID: number;
        private _reflections: boolean;
        private _refractions: boolean;
        private _reflectionFresnelConstant: number;
        private _reflectionFresnelPower: number;
        private _siltiness: number;

        private _noiseMap: TextureBase;

        // Noise
        private _noiseScale: number;
        private _noisePeriod: number;

        // Wave related
        private _wavesMap: TextureBase;
        private _waveSpeedU: number;
        private _waveSpeedV: number;
        private _waveNoiseRatio: number;

        constructor() {
            // Call the phong constructor
            super();

            this._reflections = false;
            this._refractions = false;
            this._reflectionFresnelConstant = 1;
            this._reflectionFresnelPower = 5;
            this._siltiness = 0.1;

            // Noise
            this._noiseMap = null;
            this._noiseScale = 50;
            this._noisePeriod = 0.1;

            // Waves
            this._wavesMap = null;
            this._waveSpeedU = 1;
            this._waveSpeedV = 1;
            this._waveNoiseRatio = 0.5;

            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'colorDeep', UniformType.COLOR3, new Color( 0x164A7D ) ) );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'colorShallow', UniformType.COLOR3, new Color( 0x51BDE8 ) ) );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'deepness', UniformType.FLOAT, 50 ) );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'density', UniformType.FLOAT, 0.1 ) );

            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'normalMatrix', UniformType.MAT3, new Matrix3() ) );
            this.materials[ PassType.GBuffer ].addDefine( ShaderDefines.ATTR_NORMAL );
            this.materials[ PassType.GBuffer ].addAttribute( new AttributeVar( 'normal', Trike.AttributeType.NORMAL ) );

            // TODO: This wont entirely work if env maps are used (will be a duplicate)
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'viewWidth', UniformType.FLOAT, 0 ) );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'viewHeight', UniformType.FLOAT, 0 ) );

            // TODO: Screenspace reflections? https://www.opengl.org/discussion_boards/showthread.php/181724-screen-space-reflections
        }

		/**
		* Create the vertex shader
		* @returns {string}
		*/
        getVertexShader(): string {
            this._materialPassID = MaterialPass.getNewPassID();

            // Create the albedo pass
            this._noisePass = new MaterialPass( 512, 512, this._materialPassID );
            this._noisePass.enabled = false;
            MaterialMulti.materialPasses.push( this._noisePass );

            // Create the noise material
            const noiseMaterial = new PassMaterial( 'Water Noise Pass', this );
            this.materials[ this._materialPassID ] = noiseMaterial;

            // Define the common uniforms of the material
            noiseMaterial.addUniform( new UniformVar( 'modelViewMatrix', Trike.UniformType.MAT4 ), true );
            noiseMaterial.addUniform( new UniformVar( 'projectionMatrix', Trike.UniformType.MAT4 ), true );
            noiseMaterial.addUniform( new UniformVar( 'customClipping', Trike.UniformType.FLOAT, 0 ), true );
            noiseMaterial.addUniform( new UniformVar( 'customClipPlane', Trike.UniformType.FLOAT4 ), true );
            noiseMaterial.addUniform( new UniformVar( 'time', Trike.UniformType.FLOAT, 0 ) );
            noiseMaterial.addDefine( '#define NOISE_PASS' );

            noiseMaterial.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );
            noiseMaterial.addDefine( ShaderDefines.ATTR_POSITION );
            if ( this.hasDefine( ShaderDefines.ATTR_UV ) ) {
                noiseMaterial.addAttribute( new AttributeVar( 'uv', Trike.AttributeType.UV ) );
                noiseMaterial.addUniform( new UniformVar( 'uvScale', Trike.UniformType.FLOAT2, this.uvScale() ) );
                noiseMaterial.addDefine( ShaderDefines.ATTR_UV );
            }

            const material = this.materials[ PassType.GBuffer ];
            material.addUniform( new UniformVar( 'gBuffer2', UniformType.TEXTURE, null ), false );
            material.addUniform( new UniformVar( 'cameraFar', UniformType.FLOAT, 0 ), false );


            return `
				// Declarations
				${ShaderFragments.VertParams.defaults()}
				${ShaderFragments.VertParams.clippingParameters()}
				${ShaderFragments.VertParams.skinDeclarations()}

				#if defined(NOISE_PASS) && defined(NOISE_MAP)
					uniform mat4 modelMatrix;
					varying vec4 vWorldPosition;
				#endif

				#if defined(PASS_GBUFFER)

					#if !defined(REFRACTION_MAP) && !defined(REFLECTION_MAP) && !(defined(PASS_SHADOW) && defined(SHADOW_TYPE_VSM))
						varying vec4 clipPos;
					#endif

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
					${ShaderFragments.VertMain.environmentMapping()}


					#if defined(NOISE_PASS) && defined(NOISE_MAP)
						vWorldPosition = modelMatrix * vec4( position, 1.0 );
					#endif

					#if defined(PASS_GBUFFER)

						#if !defined(REFRACTION_MAP)
							clipPos = gl_Position;
						#endif

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

				#if !defined(USE_ENV_MAP) && !defined(REFRACTION_MAP) && !defined(REFLECTION_MAP)
					uniform float viewHeight;
					uniform float viewWidth;
				#endif

				${ShaderFragments.FragParams.environmentMapping()}
				${ShaderFragments.FragParams.eyeRayVS()}

				#ifdef USE_SPECULARMAP
					uniform sampler2D specularMap;
				#endif

				uniform vec3 diffuse;
				uniform vec3 specular;
				uniform vec3 emissive;
				uniform vec3 colorDeep;
				uniform vec3 colorShallow;
				uniform float deepness;
				uniform float density;

				#if !defined(REFRACTION_MAP)
					uniform float cameraFar;
					uniform sampler2D gBuffer2;
				#endif

				#if !defined(REFRACTION_MAP) && !defined(REFLECTION_MAP) && !(defined(PASS_SHADOW) && defined(SHADOW_TYPE_VSM))
					varying vec4 clipPos;
				#endif

				#if defined(NOISE_MAP)
					uniform sampler2D noiseMap;
				#endif

				#if defined(REFLECTION_MAP)
					uniform float reflectionFresnelConstant;
					uniform float reflectionFresnelPower;
				#endif

				#if defined(REFRACTION_MAP)
					uniform float siltiness;
				#endif

				${ShaderFragments.LightingFunctions.fresnel()}

			#elif defined(PASS_GBUFFER2)
				uniform float shininess;
				uniform float viewWidth;
				uniform float viewHeight;

			#elif defined(NOISE_PASS)

				#if defined(WAVES)
					uniform sampler2D waveSampler;
					uniform float waveSpeedU;
					uniform float waveSpeedV;
					uniform float waveNoiseRatio;
				#endif

				#if defined(NOISE_MAP)
					uniform sampler2D noiseSampler;
					uniform float noiseScale;
					uniform float time;
					uniform float noisePeriod;
					varying vec4 vWorldPosition;

					vec4 getNoise(vec2 uv, vec2 scale, float period )
					{
						float t = time * period;
						vec2 uv0 = (uv / 103.0) + vec2(t / 17.0, t / 29.0);
						vec2 uv1 = uv / 107.0 - vec2(t / -19.0, t / 31.0);
						vec2 uv2 = uv / vec2(897.0, 983.0) + vec2(t / 101.0, t / 97.0);
						vec2 uv3 = uv / vec2(991.0, 877.0) - vec2(t / 109.0, t / -113.0);

						vec4 noise =
						(texture2D(noiseSampler, uv0 * scale * 0.01 )) +
						(texture2D(noiseSampler, uv1 * scale * 0.1 )) +
						(texture2D(noiseSampler, uv2 * scale * 0.3 )) +
						(texture2D(noiseSampler, uv3 * scale ));

						return noise* 0.5 - 1.0;
					}
				#endif

			#endif


			void main()
			{

				${ShaderFragments.FragMain.clippingTest()}

				#if defined(NOISE_PASS)

					#if defined(NOISE_MAP)
						vec4 noise = getNoise(vWorldPosition.xz, vec2(noiseScale, noiseScale), noisePeriod );
					#else
						vec4 noise = vec4(0.0);
					#endif

					#if defined(WAVES)
						vec4 waveSample = texture2D( waveSampler, ( vUv + vec2(waveSpeedU * time, waveSpeedV * time ) ) );
						noise = mix( noise, waveSample, waveNoiseRatio );
					#endif

					gl_FragColor = normalize( noise );
					gl_FragColor.w = 1.0;
					return;

				#elif defined(PASS_GBUFFER)

					float specularStrength = 1.0;

					// Get the color from the map
					${ShaderFragments.FragMain.alphaTest()}

					#ifdef USE_SPECULARMAP
						vec4 texelSpecular = texture2D( specularMap, vUv );
						specularStrength = texelSpecular.r;
					#endif

					${ShaderFragments.FragMain.environmentMapping()}

					vec2 screenUV = ( gl_FragCoord.xy / vec2(viewWidth, viewHeight) );
					vec4 gBuffer2Sample = texture2D( gBuffer2, screenUV );
					float worldDepth = gBuffer2Sample.z;
					float currentDepth = clipPos.z / cameraFar;
					vec3 normal = normalize( normalView );
					vec3 eyeDirection = eyeRayVS( viewWidth, viewHeight );

					#if defined(NOISE_MAP)
						normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd( screenUV, noiseMap, bumpScale ) );
					#endif

					#if defined(REFLECTION_MAP)
						float reflectance = fresnel(eyeDirection, normal, reflectionFresnelPower, false) * reflectionFresnelConstant;
					#else
						float reflectance = 0.0;
					#endif

					// Trying to create a factor that is higher when viewed directly on
					float topDownBias = pow( 1.0 - reflectance, 10.0 ) * 0.3;
					float fogDensity = (1.0 - exp( -(worldDepth - currentDepth) * deepness ));
					float absorption = clamp( topDownBias + fogDensity, 0.0, 1.0 );
					absorption = mix( absorption, 1.0, clamp(currentDepth * density, 0.0, 1.0) );
					vec3 waterColor = mix( colorShallow, colorDeep, absorption );


					// If refraction enabled
					#ifdef REFRACTION_MAP
						vec4 r1Distortion = vec4( normal.x * refractionDistortion, 0.0, 0.0, 0.0 );
						gBuffer2Sample = texture2D( gBuffer2, screenUV - r1Distortion.xz );
						float distortedDepth = gBuffer2Sample.z;

						// 	Makes sure the distortion of the refraction does not happen if the
						// 	object is in front of the material being drawn
						if ( distortedDepth < currentDepth )
						{
							r1Distortion.x = 0.0;
							r1Distortion.z = 0.0;
						}

						vec3 refractionSample = vec3(texture2D(compositionPass, screenUV - r1Distortion.xz ));
						refractionSample = refractionSample * refractionSample;
						float opacity = clamp( mix( absorption, siltiness, ( 1.0 - absorption ) ), 0.0, 1.0 );

						waterColor = mix( refractionSample, waterColor, opacity );
					#endif


					// If reflection enabled
					#if defined(REFLECTION_MAP)
						vec4 r2Distortion = vec4( normal.x * mirrorDistortion, 0.0, normal.z * mirrorDistortion, 0.0 );
						vec3 mirrorSample = texture2DProj(reflectionSampler, mirrorCoord + r2Distortion ).xyz;
						waterColor = mix( waterColor, mirrorSample, clamp(reflectance, 0.0, 1.0) );
					#endif

					#if !defined(USE_MAP)
						vec4 texelColor = vec4(waterColor, 1.0);
					#else
						texelColor.xyz = texelColor.xyz * waterColor;
					#endif


					${ShaderFragments.ShadowMapping.fragMain()}

					#ifndef SHADOW_MAPPING
						float shadowAmount = 1.0;
					#endif

					// diffuse color in x
					gl_FragColor.x = vec3_to_float( diffuse * shadowAmount );

					// specular color in y
					gl_FragColor.y = vec3_to_float( specular * specularStrength * shadowAmount );

					// Albedo in Z
					gl_FragColor.z = vec3_to_float( texelColor.xyz );

					// We store the emmsive in w
					gl_FragColor.w = vec3_to_float( emissive * shadowAmount );

				//	Custom normal handling
				#elif defined(PASS_GBUFFER2) && defined(CUSTOM_NORMAL)

					vec2 uvCoordinates = gl_FragCoord.xy / vec2( viewWidth, viewHeight );
					vec3 normal = normalize( normalView );

					#if defined(USE_BUMPMAP)
						normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd( uvCoordinates, bumpMap, bumpScale ) );
					#endif

					gl_FragColor.x = vec3_to_float( normal * 0.5 + 0.5 );

				#endif


				${ShaderFragments.Passes.fragNormDepthMain()}
				${ShaderFragments.Passes.fragShadowMain()}
			}
            `
        }

		/*
		* Adds or removes normal attributes to the Gbuffer pass material
		*/
        protected _validate() {
            const gBuffer = this.materials[ PassType.GBuffer ];

            if ( this.mirrorReflection() ) { // this.maxNumShadows() > 0

                if ( !gBuffer._uniforms[ 'modelMatrix' ] )
                    gBuffer.addUniform( new UniformVar( 'modelMatrix', Trike.UniformType.MAT4 ) );
            }
            else if ( gBuffer._uniforms[ 'modelMatrix' ] )
                gBuffer.removeUniform( 'modelMatrix' );

            if ( !gBuffer._uniforms[ 'gBuffer2' ] )
                gBuffer.addUniform( new UniformVar( 'gBuffer2', UniformType.TEXTURE, null ) );

            if ( !gBuffer._uniforms[ 'cameraFar' ] )
                gBuffer.addUniform( new UniformVar( 'cameraFar', UniformType.FLOAT, 0 ), false );
        }

		/**
        * Gets or sets if refraction is enabled. The material must be transparent for this to work.
        * @param {boolean} val
		* @returns {boolean}
        */
        refractionEnabled( val: boolean ): boolean {
            this.materials[ PassType.GBuffer ].removeUniform( 'cameraFar' );
            const toRet = super.refractionEnabled( val );

            if ( val !== undefined ) {
                this._refractions = val;

                if ( val ) {
                    this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'siltiness', UniformType.FLOAT, this._siltiness ) );
                    this.materials[ PassType.GBuffer ].removeUniform( 'refractionReflectivity' );
                }
                else if ( !val ) {
                    this.materials[ PassType.GBuffer ].removeUniform( 'siltiness' );
                    this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'cameraFar', UniformType.FLOAT, 0 ), false );
                }
            }

            return toRet;
        }

		/**
        * Adds or removes the properties for reflection
        * @param {boolean} val
		* @return {boolean}
        */
        mirrorReflection( val?: boolean ): boolean {
            const toRet = super.mirrorReflection( val );
            if ( val === undefined ) return toRet;

            this._reflections = val;
            const gBuffer = this.materials[ PassType.GBuffer ];

            if ( val ) {
                gBuffer.addUniform( new UniformVar( 'reflectionFresnelConstant', UniformType.FLOAT, this._reflectionFresnelConstant ) );
                gBuffer.addUniform( new UniformVar( 'reflectionFresnelPower', UniformType.FLOAT, this._reflectionFresnelPower ) );
                gBuffer.addUniform( new UniformVar( 'invProjectionMatrix', Trike.UniformType.MAT4 ) );
            }
            else {
                gBuffer.removeUniform( 'reflectionFresnelConstant' );
                gBuffer.removeUniform( 'reflectionFresnelPower' );
                gBuffer.removeUniform( 'invProjectionMatrix' );
            }

            gBuffer.removeUniform( 'mirrorReflectivity' );

            return toRet;
        }

		/*
		* Gets or sets the bumpiness scale of the bump map.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        bumpScale( val?: number ): number {
            if ( val !== undefined && this.materials[ PassType.GBuffer ]._uniforms[ 'bumpScale' ] )
                this.materials[ PassType.GBuffer ].setUniform( 'bumpScale', val, false );

            return super.bumpScale( val );
        }

		/**
		* Gets or sets the waves map
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        waveMap( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._wavesMap;

            const noisePass = this.materials[ this._materialPassID ];

            if ( val && this._wavesMap ) {
                this._wavesMap = val;
                noisePass.setUniform( 'waveSampler', val, true );
            }
            else if ( val && !this._wavesMap ) {
                this._wavesMap = val;

                noisePass.addDefine( '#define WAVES' );
                noisePass.addUniform( new UniformVar( 'waveSampler', UniformType.TEXTURE, val ) );
                noisePass.addUniform( new UniformVar( 'waveSpeedU', UniformType.FLOAT, this._waveSpeedU ) );
                noisePass.addUniform( new UniformVar( 'waveSpeedV', UniformType.FLOAT, this._waveSpeedV ) );
                noisePass.addUniform( new UniformVar( 'waveNoiseRatio', UniformType.FLOAT, this._waveNoiseRatio ) );
                this._enableNoiseMap( true );
            }
            else {
                this._wavesMap = null;
                noisePass.removeDefine( '#define WAVES' );
                noisePass.removeUniform( 'waveSampler' );
                noisePass.removeUniform( 'waveSpeedU' );
                noisePass.removeUniform( 'waveSpeedV' );
                noisePass.removeUniform( 'waveNoiseRatio' );
                this._enableNoiseMap( false );
            }

            return val;
        }

		/*
		* Gets or sets the U speed of the wave movement
		* @param {number} val [Optional]
		* @returns {number}
		*/
        waveSpeedU( val?: number ): number {
            if ( val === undefined )
                return this._waveSpeedU;

            this._waveSpeedU = val;

            if ( this._wavesMap )
                this.materials[ this._materialPassID ].setUniform( 'waveSpeedU', this._waveSpeedU, false );

            return val;
        }

		/*
		* Gets or sets the V speed of the wave movement
		* @param {number} val [Optional]
		* @returns {number}
		*/
        waveSpeedV( val?: number ): number {
            if ( val === undefined )
                return this._waveSpeedV;

            this._waveSpeedV = val;

            if ( this._wavesMap )
                this.materials[ this._materialPassID ].setUniform( 'waveSpeedV', this._waveSpeedV, false );

            return val;
        }

		/*
		* Gets or sets the wave to noise ratio. Values are from 0 to 1.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        waveNoiseRatio( val?: number ): number {
            if ( val === undefined )
                return this._waveNoiseRatio;

            this._waveNoiseRatio = val;

            if ( this._wavesMap )
                this.materials[ this._materialPassID ].setUniform( 'waveNoiseRatio', this._waveNoiseRatio, false );

            return val;
        }

		/**
		* Gets or sets the noise map
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        noiseMap( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._noiseMap;

            const noisePass = this.materials[ this._materialPassID ];

            if ( val && this._noiseMap ) {
                this._noiseMap = val;
                noisePass.setUniform( 'noiseSampler', val, true );
            }
            else if ( val && !this._noiseMap ) {
                this._noiseMap = val;

                noisePass.addUniform( new UniformVar( 'noiseSampler', Trike.UniformType.TEXTURE, val ), false );
                noisePass.addUniform( new UniformVar( 'modelMatrix', Trike.UniformType.MAT4 ), false );
                noisePass.addUniform( new UniformVar( 'noiseScale', Trike.UniformType.FLOAT, this._noiseScale ) );
                noisePass.addUniform( new UniformVar( 'noisePeriod', Trike.UniformType.FLOAT, this._noisePeriod ) );
                noisePass.addDefine( '#define NOISE_MAP' );
                this._enableNoiseMap( true );
            }
            else {
                this._noiseMap = null;
                noisePass.removeUniform( 'noiseSampler' );
                noisePass.removeUniform( 'modelMatrix' );
                noisePass.removeUniform( 'noiseScale' );
                noisePass.removeUniform( 'noisePeriod' );
                noisePass.addDefine( '#define NOISE_MAP' );


                this._enableNoiseMap( false );
            }

            return val;
        }

		/**
		* Enables or disables the noise map pass
		*/
        private _enableNoiseMap( val: boolean ) {
            if ( val ) {
                this.bumpMap( this._noisePass.renderTarget );

                this.materials[ PassType.GBuffer ].addDefine( '#define NOISE_MAP' );
                this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'noiseMap', UniformType.TEXTURE, this._noisePass.renderTarget ) );
                this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'bumpScale', UniformType.FLOAT, this.bumpScale() ) );

                this.materials[ PassType.GBuffer2 ].addDefine( '#define CUSTOM_NORMAL' );
                this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'viewWidth', UniformType.FLOAT, 0 ) );
                this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'viewHeight', UniformType.FLOAT, 0 ) );

                this.materials[ PassType.GBuffer ].addDefine( ShaderDefines.STANDARD_DERIVATIVES );
                this.materials[ PassType.GBuffer ].addDefine( ShaderDefines.BUMP_MAP );

                this._noisePass.enabled = true;
            }
            else if ( !this._noiseMap && !this._wavesMap ) {
                this._noisePass.enabled = false;

                this.materials[ PassType.GBuffer ].removeDefine( '#define NOISE_MAP' );
                this.materials[ PassType.GBuffer ].removeUniform( 'noiseMap' );
                this.materials[ PassType.GBuffer ].removeUniform( 'bumpScale' );

                this.materials[ PassType.GBuffer2 ].removeDefine( '#define CUSTOM_NORMAL' );
                this.materials[ PassType.GBuffer2 ].removeUniform( 'viewWidth' );
                this.materials[ PassType.GBuffer2 ].removeUniform( 'viewHeight' );

                this.materials[ PassType.GBuffer ].removeDefine( ShaderDefines.STANDARD_DERIVATIVES );
                this.materials[ PassType.GBuffer ].removeDefine( ShaderDefines.BUMP_MAP );

                this.bumpMap( null );
            }
        }

		/*
		* Gets or sets the reflection fresnal of the water.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        reflectionFresnelConstant( val?: number ): number {
            if ( val === undefined )
                return this._reflectionFresnelConstant;

            this._reflectionFresnelConstant = val;

            if ( this._reflections === false )
                return this._reflectionFresnelConstant;

            this._reflectionFresnelConstant = val;
            this.materials[ PassType.GBuffer ].setUniform( 'reflectionFresnelConstant', val, false );
            return this._reflectionFresnelConstant;
        }

		/*
		* Gets or sets the fresnal power of the water.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        reflectionFresnelPower( val?: number ): number {
            if ( val === undefined )
                return this._reflectionFresnelPower;

            this._reflectionFresnelPower = val;

            if ( this._reflections === false )
                return this._reflectionFresnelPower;

            this._reflectionFresnelPower = val;
            this.materials[ PassType.GBuffer ].setUniform( 'reflectionFresnelPower', val, false );
            return this._reflectionFresnelPower;
        }

		/*
		* Gets or sets the deepness of the water. Higher values mean the water is deeper looking
		* @param {number} val [Optional]
		* @returns {number}
		*/
        deepness( val?: number ): number {
            if ( val === undefined )
                return this.materials[ PassType.GBuffer ]._uniforms[ 'deepness' ].value;

            this.materials[ PassType.GBuffer ].setUniform( 'deepness', val, false );
            return val;
        }

		/*
		* Gets or sets the siltiness of the water. Higher values mean more opaque water
		* @param {number} val [Optional]
		* @returns {number}
		*/
        siltiness( val?: number ): number {
            if ( val === undefined )
                return this._siltiness;

            this._siltiness = val;

            if ( this._refractions === false )
                return this._siltiness;

            this.materials[ PassType.GBuffer ].setUniform( 'siltiness', val, false );
            return this._siltiness;
        }

		/*
		* Gets or sets the density of the water. Higher values mean more absorptive water
		* @param {number} val [Optional]
		* @returns {number}
		*/
        density( val?: number ): number {
            if ( val === undefined )
                return this.materials[ PassType.GBuffer ]._uniforms[ 'density' ].value;

            this.materials[ PassType.GBuffer ].setUniform( 'density', val, false );
            return val;
        }

		/*
		* Gets or sets the shallow water color
		* @param {Color} val [Optional]
		* @returns {Color}
		*/
        colorShallow( val?: Color ): Color {
            if ( val === undefined )
                return this.materials[ PassType.GBuffer ]._uniforms[ 'colorShallow' ].value;

            this.materials[ PassType.GBuffer ].setUniform( 'colorShallow', val, false );
            return val;
        }

		/*
		* Gets or sets the deep water color
		* @param {Color} val [Optional]
		* @returns {Color}
		*/
        colorDeep( val?: Color ): Color {
            if ( val === undefined )
                return this.materials[ PassType.GBuffer ]._uniforms[ 'colorDeep' ].value;

            this.materials[ PassType.GBuffer ].setUniform( 'colorDeep', val, false );
            return val;
        }

		/**
		* Gets or sets the noise scale
		* @param {number} val [Optional]
		* @returns {number}
		*/
        noiseScale( val?: number ): number {
            if ( val === undefined ) return this._noiseScale;

            this._noiseScale = val;

            if ( this._noiseMap )
                this.materials[ this._materialPassID ]._uniforms[ 'noiseScale' ].value = val;

            return val;
        }

		/**
		* Gets or sets the noise period
		* @param {number} val [Optional]
		* @returns {number}
		*/
        noisePeriod( val?: number ): number {
            if ( val === undefined ) return this._noisePeriod;

            this._noisePeriod = val;

            if ( this._noiseMap )
                this.materials[ this._materialPassID ]._uniforms[ 'noisePeriod' ].value = val;

            return val;
        }
    }
}