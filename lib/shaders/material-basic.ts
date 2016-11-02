namespace Trike {
	/**
	* A very simple material
	*/
    export class MaterialBasic extends MaterialMulti implements IReflectiveMaterial {
        private _map: TextureBase;
        private _uvScale: Vec2;
        private _alphaTest: number;

        // Mirror Reflection
        private _mirrorReflection: boolean;
        private _reflectionMap: RenderTarget;
        private _mirrorDistortion: number;
        private _mirrorReflectivity: number;
        private _mirrorMethod: MirrorMethod;

        // Refraction
        private _refractionDistortion: number;
        private _refractionEnabled: boolean;
        private _refractionMethod: RefractionMethod;
        private _refractionReflectivity: number;

        constructor() {
            // Call the material base
            super();

            this._map = null;
            this._alphaTest = 0;
            this._uvScale = new Vec2( 1, 1 );

            // Reflection
            this._mirrorReflection = false;
            this._reflectionMap = null;
            this._mirrorDistortion = 0.5;
            this._mirrorReflectivity = 1.0;
            this._mirrorMethod = MirrorMethod.Multiply;

            // Refraction
            this._refractionDistortion = 0.1;
            this._refractionEnabled = false;
            this._refractionReflectivity = 1.0;
            this._refractionMethod = RefractionMethod.Multiply;

            // Define the commopn uniforms of the material
            this.addUniform( new UniformVar( 'modelViewMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'projectionMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'customClipping', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'customClipPlane', Trike.UniformType.FLOAT4 ), true );

            // GBuffer specific
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'emissive', Trike.UniformType.COLOR3, new Color( 0xffffff ) ) );

            // Add the camera far uniform to the normal depth material
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'cameraFar', Trike.UniformType.FLOAT, 1000 ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'opacity', Trike.UniformType.FLOAT, 1 ) );

            // Define the default attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );

            // Create the shaders
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
				${ShaderFragments.VertParams.skinDeclarations()}

                #ifdef PASS_GBUFFER
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

				${ShaderFragments.FragParams.defaults()}
				${ShaderFragments.FragParams.clippingParams()}
				${ShaderFragments.FragParams.encodeNormal()}
				${ShaderFragments.FragParams.map()}

				#ifdef PASS_GBUFFER
				    uniform vec3 emissive;
					${ShaderFragments.FragParams.reflectionParams()}
					${ShaderFragments.FragParams.refractionParams()}
                    ${ShaderFragments.ShadowMapping.fragParams()}
				#endif

				${ShaderFragments.FragParams.vecToFloat()}

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

						// Checks the alpha test
						${ShaderFragments.FragMain.alphaTest()}

                		#ifndef USE_MAP
                			vec4 texelColor = vec4(1.0, 1.0, 1.0, 1.0);
                		#endif

						${ShaderFragments.FragMain.reflection()}
						${ShaderFragments.FragMain.refraction()}
                        ${ShaderFragments.ShadowMapping.fragMain()}

						#ifndef SHADOW_MAPPING
							float shadowAmount = 1.0;
						#endif

						// diffuse in x, specular in y, map in z, emmsive in w
                		gl_FragColor = vec4( 0.0, 0.0,
                			vec3_to_float( texelColor.xyz ),
                			vec3_to_float( emissive * shadowAmount ));

					#else
						float shininess = 0.0;
					#endif

					${ShaderFragments.Passes.fragNormDepthMain()}
					${ShaderFragments.Passes.fragShadowMain()}
				}
			`
        }

		/*
		* Gets or sets the UV scale of the texture coordinates. Higher values mean higher UV tesselation
		* @param {Vec2} val
		* @returns {Vec2}
		*/
        uvScale( val?: Vec2 ): Vec2 {
            if ( val === undefined ) return this._uvScale;

            this._uvScale = val;

            if ( this._uniforms[ 'uvScale' ] ) {
                this.setUniform( 'uvScale', this._uvScale, true );
                return this._uvScale;
            }

            return this._uvScale;
        }

		/*
		* Checks the uniforms or attributes of the material after a potentially breaking change
		*/
        protected _validate() {
            const gBuffer: PassMaterial = this.materials[ PassType.GBuffer ];

            // Check for view width and height params
            if ( this._refractionEnabled ) {
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

            // Check for model matrix
            if ( this._mirrorReflection || this.maxNumShadows() > 0 ) {
                if ( !gBuffer._uniforms[ 'modelMatrix' ] )
                    gBuffer.addUniform( new UniformVar( 'modelMatrix', Trike.UniformType.MAT4 ) );
            }
            else {
                if ( gBuffer._uniforms[ 'modelMatrix' ] )
                    gBuffer.removeUniform( 'modelMatrix' );
            }

            if ( this._refractionEnabled || this._mirrorReflection ) {
                // Dont add it if there is already one there
                if ( !gBuffer._attributes[ AttributeType.NORMAL ] ) {
                    gBuffer.addUniform( new UniformVar( 'normalMatrix', UniformType.MAT3, new Matrix3() ) );
                    gBuffer.addAttribute( new AttributeVar( 'normal', Trike.AttributeType.NORMAL ) );
                    gBuffer.addDefine( ShaderDefines.ATTR_NORMAL );
                }
            }
            else {
                // Do nothing if there nothing there
                if ( gBuffer._attributes[ AttributeType.NORMAL ] ) {
                    gBuffer.removeUniform( 'normalMatrix' );
                    gBuffer.removeAttribute( Trike.AttributeType.NORMAL );
                    gBuffer.removeDefine( ShaderDefines.ATTR_NORMAL );
                }
            }
        }

		/**
        * Gets or sets if refraction is enabled. The material must be transparent for this to work.
        * @param {boolean} val [Optional]
		* @returns {boolean}
        */
        refractionEnabled( val?: boolean ): boolean {
            if ( val === undefined ) return this._refractionEnabled;

            this._refractionEnabled = val;
            const material = this.materials[ PassType.GBuffer ];

            if ( val ) {
                material.addDefine( ShaderDefines.REFRACTION_MAP );
                material.addUniform( new UniformVar( 'gBuffer2', UniformType.TEXTURE, null ) );
                material.addUniform( new UniformVar( 'compositionPass', UniformType.TEXTURE, null ) );
                material.addUniform( new UniformVar( 'refractionDistortion', Trike.UniformType.FLOAT, this._refractionDistortion ) );
                material.addUniform( new UniformVar( 'cameraFar', Trike.UniformType.FLOAT, 0 ) );
                material.addUniform( new UniformVar( 'refractionReflectivity', Trike.UniformType.FLOAT, this._refractionReflectivity ) );
            }
            else {
                material.removeDefine( ShaderDefines.REFRACTION_MAP );
                material.removeUniform( 'gBuffer2' );
                material.removeUniform( 'compositionPass' );
                material.removeUniform( 'refractionDistortion' );
                material.removeUniform( 'cameraFar' );
                material.removeUniform( 'refractionReflectivity' );
            }

            this._validate();

            return this._refractionEnabled;
        }

		/*
		* Gets or sets the refraction combination method
		* @param {RefractionMethod} val [Optional]
		* @returns {RefractionMethod}
		*/
        refractionMethod( val?: RefractionMethod ) {
            if ( val === undefined ) return this._refractionMethod;

            this.materials[ PassType.GBuffer ].removeDefine( '#define REFRACTION_METHOD ' + this._refractionMethod.toFixed( 1 ) );
            this._refractionMethod = val;

            this.materials[ PassType.GBuffer ].addDefine( '#define REFRACTION_METHOD ' + this._refractionMethod.toFixed( 1 ) );
            return this._refractionMethod;
        }

		/*
		* Gets or sets the refractive distortion
		* @param {number} val [Optional]
		* @returns {number}
		*/
        refractionDistortion( val?: number ): number {
            if ( val === undefined ) return this._refractionDistortion;

            this._refractionDistortion = val;
            if ( this._refractionEnabled )
                this.materials[ PassType.GBuffer ].setUniform( 'refractionDistortion', val, false );

            return this._refractionDistortion;
        }

		/*
		* Gets or sets the refraction reflectivity
		* @param {number} val [Optional]
		* @returns {number}
		*/
        refractionReflectivity( val?: number ): number {
            if ( val === undefined ) return this._refractionReflectivity;

            this._refractionReflectivity = val;
            if ( this._refractionEnabled )
                this.materials[ PassType.GBuffer ].setUniform( 'refractionReflectivity', val, false );

            return this._refractionReflectivity;
        }

        /**
        * Gets or sets the texture matrix of this material for reflective textures
        * @param {Matrix4} val [Optional]
		* @returns {Matrix4}
        */
        textureMatrix( val?: Matrix4 ): Matrix4 {
            if ( val === undefined ) return this.materials[ PassType.GBuffer ]._uniforms[ 'textureMatrix' ].value;
            return this.materials[ PassType.GBuffer ].setUniform( 'textureMatrix', val, false ).value;
        }

		/**
        * Adds or removes the properties for reflection
        * @param {boolean} val [Optional]
		* @returns {boolean}
        */
        mirrorReflection( val?: boolean ): boolean {
            if ( val === undefined ) return this._mirrorReflection;

            const material = this.materials[ PassType.GBuffer ];
            this._mirrorReflection = val;

            if ( val ) {
                material.addUniform( new UniformVar( 'reflectionSampler', Trike.UniformType.TEXTURE ) );
                material.addUniform( new UniformVar( 'textureMatrix', Trike.UniformType.MAT4 ) );
                material.addUniform( new UniformVar( 'mirrorDistortion', Trike.UniformType.FLOAT, this._mirrorDistortion ) );
                material.addUniform( new UniformVar( 'mirrorReflectivity', Trike.UniformType.FLOAT, this._mirrorReflectivity ) );
                material.addDefine( ShaderDefines.REFLECTION_MAP );
            }
            else {
                material.removeUniform( 'reflectionSampler' );
                material.removeUniform( 'textureMatrix' );
                material.removeUniform( 'mirrorDistortion' );
                material.removeUniform( 'mirrorReflectivity' );
                material.removeDefine( ShaderDefines.REFLECTION_MAP );
            }

            this._validate();
            return val;
        }

		/*
		* Gets or sets the texture map of this material
		* @param {RenderTarget} val [Optional]
		* @return {RenderTarget}
		*/
        reflectionMap( val?: RenderTarget ): RenderTarget {
            if ( val === undefined ) return this._reflectionMap;

            this._reflectionMap = val;
            if ( this._mirrorReflection )
                this.materials[ PassType.GBuffer ].setUniform( 'reflectionSampler', val, true );

            return this._reflectionMap;
        }

		/*
		* Gets or sets the mirror distortion
		* @param {number} val [Optional]
		* @returns {number}
		*/
        mirrorDistortion( val?: number ) {
            if ( val === undefined ) return this._mirrorDistortion;

            this._mirrorDistortion = val;
            if ( this._mirrorReflection )
                this.materials[ PassType.GBuffer ].setUniform( 'mirrorDistortion', val, false );

            return this._mirrorDistortion;
        }

		/*
		* Gets or sets the mirror reflectivity
		* @param {number} val [Optional]
		* @returns {number}
		*/
        mirrorReflectivity( val?: number ) {
            if ( val === undefined ) return this._mirrorReflectivity;

            this._mirrorReflectivity = val;
            if ( this._mirrorReflection )
                this.materials[ PassType.GBuffer ].setUniform( 'mirrorReflectivity', val, false );

            return this._mirrorReflectivity;
        }

		/*
		* Gets or sets the mirror combination method
		* @param {MirrorMethod} val [Optional]
		* @returns {MirrorMethod}
		*/
        mirrorMethod( val?: MirrorMethod ) {
            if ( val === undefined ) return this._mirrorMethod;

            this.materials[ PassType.GBuffer ].removeDefine( '#define MIRROR_METHOD ' + this._mirrorMethod.toFixed( 1 ) );
            this._mirrorMethod = val;

            this.materials[ PassType.GBuffer ].addDefine( '#define MIRROR_METHOD ' + this._mirrorMethod.toFixed( 1 ) );
            return this._mirrorMethod;
        }

		/**
		* Creates UV data for this material if desired. This can be overwritten in sub functions, to determine the
		* conditions in which UVs exist.
		* @param {boolean} desired
		*/
        protected _setUV( desired: boolean ) {
            if ( desired ) {
                this.addAttribute( new AttributeVar( 'uv', Trike.AttributeType.UV ) );
                this.addUniform( new UniformVar( 'uvScale', Trike.UniformType.FLOAT2, this._uvScale ) );
                this.addDefine( ShaderDefines.ATTR_UV );
            }
            else {
                this.removeAttribute( Trike.AttributeType.UV );
                this.removeUniform( 'uvScale' );
                this.removeDefine( ShaderDefines.ATTR_UV );
            }
        }

		/**
		* Gets or sets the texture map of this material
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        map( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._map;

            if ( this._map && val ) {
                this._map = val;
                this.setUniform( 'map', val, true )
                return val;
            }
            else if ( !this._map && val ) {
                this._map = val;
                this._setUV( true );
                this.addUniform( new UniformVar( 'map', Trike.UniformType.TEXTURE, val ) );
                this.addDefine( ShaderDefines.USE_MAP );
            }
            else {
                this._map = null;
                this._setUV( false );
                this.removeUniform( 'map' );
                this.removeDefine( ShaderDefines.USE_MAP );
            }

            return val;
        }

		/**
		* Gets or sets the alpha test value. Alpha tests are used to discard pixels with alpha less than
		* the value set as the test. I.e. if the alpha test is 0.5, then any pixels with an
		* alpha value of less than 0.5 are discarded from the render process.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        alphaTest( val?: number ): number {
            if ( val === undefined ) return this._alphaTest;

            this.removeDefine( '#define ALPHATEST ' + this._alphaTest.toFixed( 3 ) );
            this._alphaTest = val;

            if ( val !== 0 )
                this.addDefine( '#define ALPHATEST ' + this._alphaTest.toFixed( 3 ) );

            return this._alphaTest;
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
		* Gets or sets the opacity of this material. The values are from 0 to 1.
		* @param {number} val
		*/
        opacity( val: number ): number {
            if ( val === undefined ) return this.materials[ PassType.GBuffer2 ]._uniforms[ 'opacity' ].value;

            this.materials[ PassType.GBuffer2 ].setUniform( 'opacity', val, false );
            return val;
        }
    }
}