namespace Trike {
    export enum UVCoordinates {
        PerPoint,
        ScreenBased
    }

	/**
	* A material for rendering point clouds
	*/
    export class MaterialPointCloud extends MaterialMulti {
        private _map: TextureBase;
        private _alphaTest: number;
        private _uvScale: Vec2;
        private _bump: boolean;
        private _bumpScale: number;

        // Translucency
        private _translucencyEnabled: boolean;
        private _translucencyScale: number;
        private _translucencyDistortion: number;
        private _translucencyPower: number;

        private _uniformDepth: number;
        private _normalizedRadius: number;

        private _uvCoordinates: UVCoordinates;

        constructor() {
            // Call the material base
            super( MultiMaterialOptions.CreateDefaults );

            // Create the material for rendering the texture map
            this.materials[ PassType.PointsTextureMap ] = new PassMaterial( 'PointsTextureMap', this );
            this.materials[ PassType.PointsTextureMap ].addDefine( ShaderDefines.PASS_POINT_MAP );

            this.materials[ PassType.PointsNormalMap ] = new PassMaterial( 'PointsNormalMap', this );
            this.materials[ PassType.PointsNormalMap ].addDefine( ShaderDefines.PASS_POINT_NORMAL );

            this._map = null;
            this._alphaTest = 0;
            this._uvScale = new Vec2( 1, 1 );
            this._bump = false;
            this._bumpScale = 1;

            // Translucency
            this._translucencyEnabled = false;
            this._translucencyScale = 1;
            this._translucencyDistortion = 0.185;
            this._translucencyPower = 0.04;

            this._uniformDepth = 0.5;
            this._normalizedRadius = 0.5;

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'viewHeightHalf', Trike.UniformType.FLOAT, 512 ), true );
            this.addUniform( new UniformVar( 'particleScale', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'modelViewMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'projectionMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'flipUV', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'customClipping', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'customClipPlane', Trike.UniformType.FLOAT4 ), true );

            // GBuffer only
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'emissive', Trike.UniformType.COLOR3, new Color( 0xffffff ) ) );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'diffuse', Trike.UniformType.COLOR3, new Color( 0xffffff ) ), false );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'specular', Trike.UniformType.COLOR3, new Color( 0xffffff ) ), false );

            // Add the GBugger2 uniforms
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'opacity', Trike.UniformType.FLOAT, 1 ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'shininess', Trike.UniformType.FLOAT, 0.05 ) );

            // Set the properties for the map and normal passes
            const commonMaterials: Array<PassMaterial> = [ this.materials[ PassType.PointsTextureMap ], this.materials[ PassType.PointsNormalMap ] ];
            let commonMat: PassMaterial;
            for ( let i = 0, l = commonMaterials.length; i < l; i++ ) {
                commonMat = commonMaterials[ i ];
                commonMat.addUniform( new UniformVar( 'map', Trike.UniformType.TEXTURE, null ) );
                commonMat.addUniform( new UniformVar( 'opacity', Trike.UniformType.FLOAT, 1 ) );
                commonMat.addUniform( new UniformVar( 'gBuffer2', Trike.UniformType.TEXTURE, null ) );
                commonMat.addUniform( new UniformVar( 'cameraFar', UniformType.FLOAT ) );
                commonMat.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ) );
                commonMat.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ) );
                commonMat.addUniform( new UniformVar( 'softnessScale', Trike.UniformType.FLOAT, 40 ) );
                commonMat.addUniform( new UniformVar( 'uvScale', Trike.UniformType.FLOAT2, this._uvScale, false ) );

                commonMat.addDefine( ShaderDefines.USE_MAP );
                commonMat.blendMode = BlendMode.PremultipliedAlpha;
            }

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );
            this.addDefine( ShaderDefines.POINT_VERTS );

            // We dont use traditional normals for screen quads
            this.materials[ PassType.GBuffer2 ].removeDefine( ShaderDefines.ATTR_NORMAL );
            this.materials[ PassType.GBuffer2 ].removeAttribute( AttributeType.NORMAL );
            this.materials[ PassType.GBuffer2 ].removeUniform( 'normalMatrix' );
            this.materials[ PassType.GBuffer2 ].addDefine( ShaderDefines.FORWARD_NORMAL );

            this.addDefine( '#define GENERATE_UVS' );
            this.setShaders( this.getVertexShader(), this.getFragmentShader() );
            this.uvCoordinates( UVCoordinates.PerPoint );
        }

		/**
		* Create the vertex shader
		* @returns {string}
		*/
        getVertexShader(): string {
            return `

				${ShaderFragments.VertParams.defaults()}
				${ShaderFragments.VertParams.clippingParameters()}

				// Half the height of the canvas
				uniform float viewHeightHalf;
				uniform float particleScale;

				#if defined(ATTR_ROTATION)
					attribute float rotation;
					varying float vRotation;
				#endif

				#if defined(ATTR_ALPHA)
					attribute float alpha;
					varying float vAlpha;
				#endif

				#if defined(ATTR_SIZE)
					attribute float size;
				#endif

				#if defined(PASS_POINT_NORMAL) || defined(PASS_POINT_MAP)
					varying float vDepth;
					uniform float cameraFar;
				#endif

				#if defined(PASS_GBUFFER)
					${ShaderFragments.ShadowMapping.vertParams()}
				#endif

				void main()
				{
					vec4 mvPosition;
					mvPosition = modelViewMatrix * vec4( position, 1.0 );
					${ShaderFragments.VertMain.clipping()}
					vec4 pmvPosition = projectionMatrix * mvPosition;

					#if defined(SHADOW_MAPPING)
						vec4 worldPosition = modelMatrix *  vec4( position, 1.0 );
					#endif

					gl_Position = pmvPosition;

					#if defined(PASS_POINT_NORMAL) || defined(PASS_POINT_MAP)
						vDepth = pmvPosition.z / -cameraFar;
					#endif

					#ifdef ATTR_ROTATION
						vRotation = rotation;
					#endif

					#ifdef ATTR_ALPHA
						vAlpha = alpha;
					#endif

					#ifdef ATTR_SIZE
						gl_PointSize = 1.0 * particleScale * size * ( viewHeightHalf / length( pmvPosition.xyz ) );

						#ifdef PASS_SHADOW
							gl_PointSize = 1.0 * particleScale * size;
						#endif
					#else
						gl_PointSize = 1.0 * particleScale * ( viewHeightHalf / length( pmvPosition.xyz ) );

						#ifdef PASS_SHADOW
							gl_PointSize = 1.0 * particleScale;
						#endif

					#endif

					// Shadows
					#if defined(PASS_GBUFFER)
						${ShaderFragments.ShadowMapping.vertMain()}
					#endif

					// We need to add the pass data
					${ShaderFragments.Passes.vertNormDepthMain()}

					#if defined(PASS_POINT_NORMAL) && defined(USE_BUMPMAP)
						vViewPosition = -pmvPosition.xyz;
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

				${ShaderFragments.FragParams.defaults()}
				${ShaderFragments.FragParams.clippingParams()}
				${ShaderFragments.FragParams.map()}
				${ShaderFragments.FragParams.encodeNormal()}
				${ShaderFragments.FragParams.bumpmapFunctions()}
				${ShaderFragments.FragParams.vecToFloat()}
				${ShaderFragments.FragParams.floatToVec()}
				uniform float flipUV;

				#if !defined(SCREEN_UVS)
					uniform vec2 uvScale;
				#endif

				#if defined(ATTR_ROTATION)
					varying float vRotation;
				#endif

				#if defined(ATTR_ALPHA)
					varying float vAlpha;
				#endif

				#if defined(PASS_POINT_NORMAL) || defined(PASS_POINT_MAP) || defined(SCREEN_UVS)
					uniform float viewHeight;
					uniform float viewWidth;
				#endif

				// GBUFFER PASS
				// ************************
				#if defined(PASS_GBUFFER)

					uniform vec3 emissive;
					uniform vec3 diffuse;
					uniform vec3 specular;

					${ShaderFragments.ShadowMapping.fragParams()}

				// GBUFFER2 PASS
				// ************************
				#elif defined(PASS_GBUFFER2)

					#ifdef SCREEN_UVS
						uniform sampler2D normalMap;
					#endif

					uniform float uniformDepth;
					uniform float normalizedRadius;
					uniform float shininess;

					#if defined(USE_MAP) && defined(USE_BUMPMAP)
						uniform float particleScale;
						uniform float bumpScale;
					#endif

				// MAP & NORMAL PASS
				// ************************
				#elif defined(PASS_POINT_NORMAL) || defined(PASS_POINT_MAP)
					varying float vDepth;
					uniform float opacity;
					uniform sampler2D gBuffer2;
					uniform float softnessScale;

					#if defined(PASS_POINT_NORMAL) && defined(USE_BUMPMAP)
						uniform float particleScale;
						uniform float bumpScale;
					#endif

				#endif

				void main()
				{
					${ShaderFragments.FragMain.clippingTest()}

					// Generate the UV Coordinates
					#if defined(SCREEN_UVS)
						vec2 vUv = gl_FragCoord.xy / vec2( viewWidth, viewHeight );
					#else
						#ifdef ATTR_ROTATION
							float mid = 0.5;
							vec2 vUv = vec2( cos( vRotation ) * ( gl_PointCoord.x - mid ) + sin( vRotation ) * ( gl_PointCoord.y - mid ) + mid,
							cos( vRotation ) * ( gl_PointCoord.y - mid ) - sin( vRotation ) * ( gl_PointCoord.x - mid ) + mid);
							vUv = vUv * uvScale;
						#else
							vec2 vUv = (vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y )) * uvScale;
						#endif
					#endif

					if (flipUV === 1.0 )
					vUv = vec2( 1.0, 1.0 ) - vUv;

					${ShaderFragments.FragMain.alphaTest()}

					//	************************************************************
					//	GBUFFER PASS
					//	Draws the GBuffer material information
					//	************************************************************
					#if defined(PASS_GBUFFER)

						#ifndef USE_MAP
							vec4 texelColor = vec4(1.0, 1.0, 1.0, 1.0);
						#endif

						${ShaderFragments.ShadowMapping.fragMain()}

						#ifndef SHADOW_MAPPING
							float shadowAmount = 1.0;
						#endif

						// Diffuse color in x
						gl_FragColor.x = vec3_to_float( diffuse * shadowAmount );

						// Emmsive in w
						gl_FragColor.w = vec3_to_float( emissive * shadowAmount );

						// specular color in y
						gl_FragColor.y = vec3_to_float( specular * shadowAmount );

						// Albedo in Z
						gl_FragColor.z = vec3_to_float( texelColor.xyz );

					#endif


					// If the map or normal pass
					#if defined(PASS_POINT_MAP) || defined(PASS_POINT_NORMAL)

						float opacityStrength = opacity;
						#ifdef ATTR_ALPHA
							opacityStrength *= vAlpha;
						#endif

						// Soft particles - check the current depth, and fade out if too close to it
						// http://www.informatik.uni-oldenburg.de/~trigger/page7.html
						vec2 screenUv = gl_FragCoord.xy / vec2( viewWidth, viewHeight );
						vec4 gBuffer2Sample = texture2D( gBuffer2, screenUv );
						float bbDepth = clamp(vDepth * -1.0, 0.0, 1.0);
						float softness = 0.0;
						float targetDepth = gBuffer2Sample.z; // clamp(gBuffer2Sample.z, 0.0, 1.0);
						if ( targetDepth === 0.0 )
							softness = 1.0;
						else
						{
							if ( targetDepth < bbDepth )
								softness = 0.0;
							else
								softness = smoothstep(0.0, softnessScale, targetDepth - bbDepth );
						}

						softness = clamp( softness, 0.0, 1.0);
						opacityStrength *= softness;

					#endif

					//	************************************************************
					//	POINT MAP PASS
					//	The point map pass draws the texture to a screen quad
					//	************************************************************
					#if defined(PASS_POINT_MAP)

						#ifdef PREMULTIPLIED_ALPHA
							gl_FragColor.rgb = texelColor.rgb * texelColor.w * opacityStrength;
							gl_FragColor.w = texelColor.w * opacityStrength;
						#else
							gl_FragColor = texelColor;
							gl_FragColor.w = texelColor.w * opacityStrength;
						#endif

					//	************************************************************
					//	POINT MAP PASS
					//	The normal map pass draws the normals to a screen quad
					//	************************************************************
					#elif defined(PASS_POINT_NORMAL)

						vec3 normal = vec3( gl_PointCoord.x * 4.0 - 2.0, 2.0 - gl_PointCoord.y * 4.0, 1.0 );
						normal = normalize( normal );
						normal = normal * 0.5 + 0.5;

						#ifdef USE_BUMPMAP
							vec2 pointUv = vec2( 1.0 - gl_PointCoord.x, gl_PointCoord.y );
							vec2 pointFragDelta = ( pointUv * particleScale ) - ( pointUv * ( particleScale * 0.5 ) );
							vec3 pointFragPosition = vViewPosition +  vec3( pointFragDelta, 0.0 );
							normal = perturbNormalArb( -pointFragPosition, normalize( normal ), dHdxy_fwd( vUv, map, bumpScale ) );
						#endif

						#ifdef PREMULTIPLIED_ALPHA
							gl_FragColor.rgb = normal * texelColor.w * opacityStrength;
							gl_FragColor.w = texelColor.w * opacityStrength;
						#else
							gl_FragColor = vec4( normal, opacityStrength );
							gl_FragColor.w = texelColor.w * opacityStrength;
						#endif

					#endif

					${ShaderFragments.Passes.fragNormDepthMain()}
					${ShaderFragments.Passes.fragShadowMain()}
				}
			`
        }

		/**
		* Gets or sets the type of UV coordinates to generate for the material. They can either be created for each
		* point or from a screen quad ( used if blending is on )
		* @param {UVCoordinates} val [Optional]
		* @returns {UVCoordinates}
		*/
        uvCoordinates( val?: UVCoordinates ): UVCoordinates {
            if ( val === undefined ) return this._uvCoordinates;

            if ( this._uvCoordinates === val )
                return;

            const subMaterials: Array<PassMaterial> = [
                this.materials[ PassType.GBuffer ],
                this.materials[ PassType.GBuffer2 ],
                this.materials[ PassType.ShadowLightPass ]
            ];

            let subMat: PassMaterial;
            this._uvCoordinates = val;

            for ( let i = 0, l = subMaterials.length; i < l; i++ ) {
                subMat = subMaterials[ i ];
                if ( val === UVCoordinates.ScreenBased ) {
                    subMat.addDefine( '#define SCREEN_UVS' );
                    subMat.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ) );
                    subMat.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ) );
                    subMat.removeUniform( 'uvScale' );
                }
                else {
                    subMat.addUniform( new UniformVar( 'uvScale', Trike.UniformType.FLOAT2, this._uvScale, false ) );
                    subMat.removeDefine( '#define SCREEN_UVS' );
                    subMat.removeUniform( 'viewWidth' );
                    subMat.removeUniform( 'viewHeight' );
                }
            }

            if ( val === UVCoordinates.ScreenBased ) {
                this.depthRead = false;
                this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'uniformDepth', Trike.UniformType.FLOAT, this._uniformDepth ) );
                this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'normalizedRadius', Trike.UniformType.FLOAT, this._normalizedRadius ) );
                this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'normalMap', Trike.UniformType.TEXTURE, null ) );
                this.materials[ PassType.GBuffer2 ].removeUniform( 'cameraFar' );
            }
            else {
                this.materials[ PassType.GBuffer2 ].removeUniform( 'normalMap' );
                this.materials[ PassType.GBuffer2 ].removeUniform( 'uniformDepth' );
                this.materials[ PassType.GBuffer2 ].removeUniform( 'normalizedRadius' );
                this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'cameraFar', UniformType.FLOAT ) );
                this.depthRead = true;
            }

            this.bumpMap( this._bump );

            return val;
        }

		/*
		* Gets or sets the texture map of this material
		* @param {TextureBase} val
		* @returns {TextureBase}
		*/
        map( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._map;

            const gBuffer: MaterialMulti = this.materials[ PassType.GBuffer ];
            const gBuffer2: MaterialMulti = this.materials[ PassType.GBuffer2 ];
            const mapPass: MaterialMulti = this.materials[ PassType.PointsTextureMap ];
            const normalPass: MaterialMulti = this.materials[ PassType.PointsNormalMap ];
            const shadowPass: MaterialMulti = this.materials[ PassType.ShadowLightPass ];

            if ( this._map && val ) {
                this._map = val;
                mapPass.setUniform( 'map', val, false );
                normalPass.setUniform( 'map', val, false );
                gBuffer.setUniform( 'map', val, false );
                gBuffer2.setUniform( 'map', val, false );
                shadowPass.setUniform( 'map', val, false );
            }
            else if ( !this._map && val ) {
                this._map = val;
                mapPass.setUniform( 'map', val, false );
                normalPass.setUniform( 'map', val, false );
                gBuffer.addUniform( new UniformVar( 'map', Trike.UniformType.TEXTURE, val ) );
                gBuffer.addDefine( ShaderDefines.USE_MAP );

                gBuffer2.addUniform( new UniformVar( 'map', Trike.UniformType.TEXTURE, val ) );
                gBuffer2.addDefine( ShaderDefines.USE_MAP );

                shadowPass.addUniform( new UniformVar( 'map', Trike.UniformType.TEXTURE, val ) );
                shadowPass.addDefine( ShaderDefines.USE_MAP );
            }
            else {
                this._map = null;
                gBuffer.removeUniform( 'map' );
                gBuffer.removeDefine( ShaderDefines.USE_MAP );

                gBuffer2.removeUniform( 'map' );
                gBuffer2.removeDefine( ShaderDefines.USE_MAP );

                shadowPass.removeUniform( 'map' );
                shadowPass.removeDefine( ShaderDefines.USE_MAP );
            }

            return val;
        }

		/*
		* Gets or sets if we should apply bump mapping to the diffuse map
		* @param {boolean} val [Optional]
		* @returns {boolean}
		*/
        bumpMap( val?: boolean ) {
            if ( val === undefined ) return this._bump;

            const gBuffer2: MaterialMulti = this.materials[ PassType.GBuffer2 ];
            const normalPass: MaterialMulti = this.materials[ PassType.PointsNormalMap ];

            gBuffer2.removeUniform( 'bumpScale' );
            gBuffer2.removeDefine( ShaderDefines.STANDARD_DERIVATIVES );
            gBuffer2.removeDefine( ShaderDefines.BUMP_MAP );

            normalPass.removeUniform( 'bumpScale' );
            normalPass.removeDefine( ShaderDefines.STANDARD_DERIVATIVES );
            normalPass.removeDefine( ShaderDefines.BUMP_MAP );

            if ( val ) {
                if ( this._uvCoordinates === UVCoordinates.PerPoint ) {
                    gBuffer2.addUniform( new UniformVar( 'bumpScale', Trike.UniformType.FLOAT, this._bumpScale ) );
                    gBuffer2.addDefine( ShaderDefines.STANDARD_DERIVATIVES );
                    gBuffer2.addDefine( ShaderDefines.BUMP_MAP );
                }

                normalPass.addUniform( new UniformVar( 'bumpScale', Trike.UniformType.FLOAT, this._bumpScale ) );
                normalPass.addDefine( ShaderDefines.STANDARD_DERIVATIVES );
                normalPass.addDefine( ShaderDefines.BUMP_MAP );
            }

            this._bump = val;
            return val;
        }

		/*
		* Gets or sets the bumpiness scale of the bump map.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        bumpScale( val?: number ): number {
            if ( val === undefined ) return this._bumpScale;

            const gBuffer2: MaterialMulti = this.materials[ PassType.GBuffer2 ];
            const normalPass: MaterialMulti = this.materials[ PassType.PointsNormalMap ];

            this._bumpScale = val;
            if ( this._bump ) {
                if ( this._uvCoordinates === UVCoordinates.PerPoint )
                    gBuffer2.setUniform( 'bumpScale', val, false );

                normalPass.setUniform( 'bumpScale', val, false );
            }

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
		* Gets or sets the view space world position of the particles
		* @param {number} val [Optional]
		* @returns {number}
		*/
        uniformDepth( val?: number ): number {
            if ( val === undefined ) return this._uniformDepth;

            this._uniformDepth = val;
            if ( this._uvCoordinates === UVCoordinates.ScreenBased )
                this.materials[ PassType.GBuffer2 ].setUniform( 'uniformDepth', val, false );

            return val;
        }

		/*
		* Gets or sets the radius of the particles in normalized values (radius / (camera far - min)
		* @param {number} val [Optional]
		* @returns {number}
		*/
        normalizedRadius( val: number ) {
            if ( val === undefined ) return this._normalizedRadius;

            this._normalizedRadius = val;
            if ( this._uvCoordinates === UVCoordinates.ScreenBased )
                this.materials[ PassType.GBuffer2 ].setUniform( 'normalizedRadius', val, false );

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
		* Sets the rotation amount of the sprite in radians
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

            if ( this._uvCoordinates === UVCoordinates.PerPoint ) {
                this.materials[ PassType.GBuffer ].setUniform( 'uvScale', this._uvScale, false );
                this.materials[ PassType.GBuffer2 ].setUniform( 'uvScale', this._uvScale, false );
            }

            this.materials[ PassType.PointsTextureMap ].setUniform( 'uvScale', this._uvScale, false );
            this.materials[ PassType.PointsNormalMap ].setUniform( 'uvScale', this._uvScale, false );

            return this._uvScale;
        }

		/*
		* Gets or sets diffuse lighting color of the material
		* @param {number} val [Optional]
		* @returns {number}
		*/
        diffuse( val?: Color ): Color {
            if ( val === undefined )
                return this.materials[ PassType.GBuffer ]._uniforms[ 'diffuse' ].value;

            this.materials[ PassType.GBuffer ].setUniform( 'diffuse', val, false );
            return val;
        }

		/*
		* Gets or sets specular light colour
		* @param {number} val [Optional]
		* @returns {number}
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

        get particleSoftness(): number { return this.materials[ PassType.PointsTextureMap ]._uniforms[ 'softnessScale' ].value; }
        set particleSoftness( val: number ) {
            this.materials[ PassType.PointsTextureMap ].setUniform( 'softnessScale', val, false );
            this.materials[ PassType.PointsNormalMap ].setUniform( 'softnessScale', val, false );
        }
    }
}