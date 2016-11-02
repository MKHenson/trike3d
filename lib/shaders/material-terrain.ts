namespace Trike {
    export type TerrainMaterialEvents = 'texture_changed';

    export interface ITerrainMaterialEvent {
        type: TerrainTextureType;
    }

	/**
	* The MaterialTerrain is a special material used exclusively on terrains. Its based on Geo Clipmapping, and was inspired by the links below
	* http://www.pheelicks.com/2014/03/rendering-large-terrains/
	* http://www.gamasutra.com/blogs/JasmineKent/20130904/199521/WebGL_Terrain_Rendering_in_Trigger_Rally__Part_1.php
	* https://github.com/CodeArtemis/TriggerRally/blob/unified/server/public/scripts/client/terrain.coffee
	*/
    export class MaterialTerrain extends MaterialMulti implements IGridMaterial {
        private _bumpMap: TextureBase;
        private _heightfield: TextureBase;
        private _alphaTest: number;

        // Terrain texture scales
        private _tileScaleBase: Vec2;
        private _tileScaleDiff1: Vec2;
        private _tileScaleDiff2: Vec2;
        private _tileScaleDiff3: Vec2;
        private _tileScaleDiff4: Vec2;
        private _tileScaleRock: Vec2;
        private _tileResolution: number;
        private _altitude: number;
        private _heightOffset: number;
        private _worldScale: number;
        private _prevWidth: number;
        private _prevHeight: number;

        // Height based colours
        private _heightBasedColors: boolean;
        private _topColor: Color;
        private _midColor: Color;
        private _bottomColor: Color;
        private _heightColorsMinAltitude: number;
        private _heightColorsMidAltitude: number;
        private _heightColorsMaxAltitude: number;

        // Terrain brush
        private _brushMode: boolean;
        private _ring_border_width: number;
        private _ring_color: Color;
        private _ring_center: Vec3;
        private _ring_radius: number;
        private _ring_falloff: number;

        // Bump mapping variables
        private _bumpMapping: boolean;
        private _tileScale: number;
        private _bumpDistance: number;
        private _rockDistance: number;
        private _rockScale: number;

        // Translucency
        private _translucencyEnabled: boolean;
        private _translucencyScale: number;
        private _translucencyDistortion: number;
        private _translucencyPower: number;

        private _textureEvent: ITerrainMaterialEvent;
        private _albedoPass: MaterialPass;
        private _numDiffuseTextures: number;

		/**
		* Creates an instance of the terrain material
		* @param {number} tileResolution The resolution of the planes used in the terrain
		* @param {number} altitude Specified how high/low the terrain will go. Default is 200.
		* @param {number} worldScale Defines how wide and deep the heightfield texture must be sampled. Higher values mean more vast terrain. Default is 1024.
		*/
        constructor( tileResolution: number, altitude: number = 200, worldScale: number = 1024, editorMode: boolean = true ) {
            // Call the material base
            super();

            if ( editorMode )
                this.materials[ PassType.EditorPass ] = new PassMaterial( 'Terrain Editor Pass', this );

            this.materials[ PassType.TerrainAlbedo ] = new PassMaterial( 'Terrain Albedo Pass', this );

            this._albedoPass = new MaterialPass( 512, 512, PassType.TerrainAlbedo );
            this._albedoPass.enabled = false;
            MaterialMulti.materialPasses.push( this._albedoPass );

            this._bumpMap = null;
            this._heightfield = null;
            this._alphaTest = 0;
            this._tileScale = 0.2;
            this._rockScale = 50;
            this._altitude = altitude;
            this._heightOffset = 0;
            this._prevWidth = 0;
            this._prevHeight = 0;
            this._worldScale = worldScale;
            this._bumpMapping = false;
            this._numDiffuseTextures = 0;

            // Height based colours
            this._heightBasedColors = false;
            this._topColor = new Color( 0xFFFFFF );
            this._midColor = new Color( 0x7A7662 );
            this._bottomColor = new Color( 0x4F483B );
            this._heightColorsMinAltitude = 0;
            this._heightColorsMidAltitude = altitude / 2;
            this._heightColorsMaxAltitude = altitude;

            // Brush related
            this._brushMode = false;
            this._ring_border_width = 0.8;
            this._ring_color = new Color( 0xFFFFFF );
            this._ring_center = new Vec3();
            this._ring_radius = 5.0;
            this._ring_falloff = 1.0;
            this._bumpDistance = 0.03;
            this._rockDistance = 0;

            // Terrain textures
            this._tileScaleRock = new Vec2( 1, 1 );
            this._tileScaleBase = new Vec2( 1, 1 );
            this._tileScaleDiff1 = new Vec2( 1, 1 );
            this._tileScaleDiff2 = new Vec2( 1, 1 );
            this._tileScaleDiff3 = new Vec2( 1, 1 );
            this._tileScaleDiff4 = new Vec2( 1, 1 );

            // Translucency
            this._translucencyEnabled = false;
            this._translucencyScale = 1;
            this._translucencyDistortion = 0.185;
            this._translucencyPower = 0.04;

            this._textureEvent = { type: TerrainTextureType.Colors };

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'modelViewMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'projectionMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'worldScale', Trike.UniformType.FLOAT, worldScale ), true );
            this.addUniform( new UniformVar( 'uTileOffset', Trike.UniformType.FLOAT2, new Vec2() ), true );
            this.addUniform( new UniformVar( 'camPosition', Trike.UniformType.FLOAT3, new Vec3() ), true );
            this.addUniform( new UniformVar( 'uTileOffset', Trike.UniformType.FLOAT2, new Vec2() ), true );
            this.addUniform( new UniformVar( 'uScale', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'uEdgeMorph', Trike.UniformType.INT, 0 ), true );
            this.addUniform( new UniformVar( 'customClipping', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'customClipPlane', Trike.UniformType.FLOAT4 ), true );

            // Albedo Pass
            this.materials[ PassType.TerrainAlbedo ].addDefine( '#define ALBEDO_PASS' );

            // GBufffer only
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'diffuse', Trike.UniformType.COLOR3, new Color( 0x96762C ) ) );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'specular', Trike.UniformType.COLOR3, new Color( 0xffffff ) ) );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'emissive', Trike.UniformType.COLOR3, new Color( 0x000000 ) ) );

            // Add the camera far uniform to the normal depth material
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'cameraFar', Trike.UniformType.FLOAT, 1000 ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'shininess', Trike.UniformType.FLOAT, 0.05 ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'opacity', Trike.UniformType.FLOAT, 1 ) );

            // Remove model matrix from shadow as its not used
            this.materials[ PassType.ShadowLightPass ].removeUniform( 'modelMatrix' );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );
            this.addAttribute( new AttributeVar( 'normal', Trike.AttributeType.NORMAL ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );
            this.addDefine( ShaderDefines.ATTR_NORMAL );
            this.addDefine( ShaderDefines.STANDARD_DERIVATIVES );

            this._tileResolution = tileResolution;
            this.tileResolution( tileResolution );

            this.addDefine( '#define EGDE_MORPH_TOP 1' );
            this.addDefine( '#define EGDE_MORPH_LEFT 2' );
            this.addDefine( '#define EGDE_MORPH_BOTTOM 4' );
            this.addDefine( '#define EGDE_MORPH_RIGHT 8' );
            this.addDefine( '#define MORPH_REGION 0.3' );

            if ( editorMode )
                this.materials[ PassType.EditorPass ].addDefine( ShaderDefines.EDITOR_PASS );

            this.setShaders( this.getVertexShader(), this.getFragmentShader() );

            this.heightmap( null );
            this.heightColors( true );
            this.bumpMapping( true );
        }

		/**
		* Cleans up all references
		*/
        dispose() {
            MaterialMulti.materialPasses.splice( MaterialMulti.materialPasses.indexOf( this._albedoPass ), 1 );

            super.dispose();

            this._heightfield = null;
            this._bumpMap = null;
            this._tileScaleBase = null;
            this._tileScaleDiff1 = null;
            this._tileScaleDiff2 = null;
            this._tileScaleDiff3 = null;
            this._tileScaleDiff4 = null;
            this._tileScaleRock = null;
            this._topColor = null;
            this._midColor = null;
            this._bottomColor = null;
            this._ring_color = null;
            this._ring_center = null;
            this._textureEvent = null;
            this._albedoPass = null;
        }

		/**
		* Create the vertex shader
		* @returns {string}
		*/
        getVertexShader(): string {
            return `

				${ShaderFragments.VertParams.defaults()}
				${ShaderFragments.VertParams.clippingParameters()}

				#ifdef USE_HEIGHTFIELD
					uniform sampler2D heightfield;
				#endif

				// Used when sampling the heightfield. Higher values mean vaster terrain
				uniform float worldScale;

				// Used to amplify the height
				uniform float altitude;

				// Used to offset the terrain vertically
				uniform float heightOffset;

				// Used for the tile positioning
				uniform vec3 camPosition;
				uniform vec2 uTileOffset;
				uniform float uScale;
				uniform int uEdgeMorph;

				varying vec2 vUv;

				#ifdef BRUSHMODE
					varying vec4 vPosition;
				#endif

				#ifdef PASS_GBUFFER
					${ShaderFragments.ShadowMapping.vertParams()}
					#ifdef HEIGHT_COLORS
						varying float height;
					#endif
				#endif

				#ifdef USE_HEIGHTFIELD

					// catmull works by specifying 4 control points p0, p1, p2, p3 and a weight. The function is used to calculate a point n between p1 and p2 based
					// on the weight. The weight is normalized, so if it's a value of 0 then the return value will be p1 and if its 1 it will return p2.
					float catmullRom( float p0, float p1, float p2, float p3, float weight )
					{
						float weight2 = weight * weight;
						return 0.5 * (
						p0 * weight * ( ( 2.0 - weight ) * weight - 1.0 ) +
						p1 * ( weight2 * ( 3.0 * weight - 5.0 ) + 2.0 ) +
						p2 * weight * ( ( 4.0 - 3.0 * weight ) * weight + 1.0 ) +
						p3 * ( weight - 1.0 ) * weight2 );
					}

					// Performs a horizontal catmulrom operation at a given V value.
					float textureCubicU( sampler2D samp, vec2 uv00, float texel, float offsetV, float frac )
					{
						return catmullRom(
						texture2DLod( samp, uv00 + vec2( -texel, offsetV ), 0.0 ).r,
						texture2DLod( samp, uv00 + vec2( 0.0, offsetV ), 0.0 ).r,
						texture2DLod( samp, uv00 + vec2( texel, offsetV ), 0.0 ).r,
						texture2DLod( samp, uv00 + vec2( texel * 2.0, offsetV ), 0.0 ).r,
						frac );
					}

					// Samples a texture using a bicubic sampling algorithm. This essentially queries neighbouring
					// pixels to get an average value.
					float textureBicubic( sampler2D samp, vec2 uv00, vec2 texel, vec2 frac )
					{
						return catmullRom(
						textureCubicU( samp, uv00, texel.x, -texel.y, frac.x ),
						textureCubicU( samp, uv00, texel.x, 0.0, frac.x ),
						textureCubicU( samp, uv00, texel.x, texel.y, frac.x ),
						textureCubicU( samp, uv00, texel.x, texel.y * 2.0, frac.x ),
						frac.y );
					}

				#endif

				// Gets the  UV coordinates based on the world X Z position
				vec2 worldToMapSpace( vec2 worldPosition )
				{
					return ( worldPosition / worldScale + 0.5 );
				}


				// Gets the height at a location p (world space)
				float getHeight( vec3 worldPosition )
				{
					#ifdef USE_HEIGHTFIELD

						vec2 heightUv = worldToMapSpace(worldPosition.xz);
						vec2 tHeightSize = vec2( HEIGHTFIELD_SIZE_X, HEIGHTFIELD_SIZE_Y );

						// If we increase the smoothness factor, the terrain becomes a lot smoother.
						// This is because it has the effect of shrinking the texture size and increaing
						// the texel size. Which means when we do sampling the samples are from farther away - making
						// it smoother. However this means the terrain looks less like the original heightmap and so
						// terrain picking goes a bit off.
						float smoothness = 1.1;
						tHeightSize /= smoothness;

						// The size of each texel
						vec2 texel = vec2( 1.0 / tHeightSize );

						// Find the top-left texel we need to sample.
						vec2 heightUv00 = ( floor( heightUv * tHeightSize ) ) / tHeightSize;

						// Determine the fraction across the 4-texel quad we need to compute.
						vec2 frac = vec2( heightUv - heightUv00 ) * tHeightSize;

						float coarseHeight = textureBicubic( heightfield, heightUv00, texel, frac );
						//'		float coarseHeight = texture2D( heightfield, heightUv ).r;
						return altitude * coarseHeight + heightOffset;
					#else
						return 0.0;
					#endif
				}

				// Gets the normal at a location p
				vec3 getNormal( vec3 pos, float morphFactor )
				{
					// Get 2 vectors perpendicular to the unperturbed normal, and create at point at each (relative to position)
					float delta = ( morphFactor + 1.0 ) * uScale / TILE_RESOLUTION;
					vec3 dA = delta * normalize( cross( normal.yzx, normal ));
					vec3 dB = delta * normalize( cross( normal, dA ));
					vec3 p = pos;
					vec3 pA = pos + dA;
					vec3 pB = pos + dB;

					// Now get the height at those points
					float h = getHeight(pos);
					float hA = getHeight(pA);
					float hB = getHeight(pB);

					// Update the points with their correct heights and calculate true normal
					p += normal * h;
					pA += normal * hA;
					pB += normal * hB;
					return normalize( cross( pA - p, pB - p ) );
				}


				// This essentially checks to see which morph edge this tile represents. Because
				// its a bitwise operation you can check for multipe enums. I.e. if a tile was tagged as EGDE_MORPH_LEFT | EGDE_MORPH_TOP, this
				// function will return true if its checked against EGDE_MORPH_LEFT or EGDE_MORPH_TOP, but nothing else.
				bool edgePresent( int edge )
				{
					int e = uEdgeMorph / edge;
					return 2 * ( e / 2 ) !== e;
				}


				// At the edges of tiles, morph the vertices if they are joining onto a higher layer.
				// The closer a vertex is to the edge, the higher the value returned will be. If the tile has an uEdgeMorph
				// of EGDE_MORPH_LEFT, and its x value is 0 then then the value returned will be 1. If the
				// value of x was === MORPH_REGION (which is the max distance from the edge before morphing) then it would be 0.
				// This function tells you how much the vertex needs to morph. Vertices away from the edge will return 0, but those
				// closer to edges will be higher.
				float calculateMorph( vec3 p )
				{
					float morphFactor = 0.0;

					if ( edgePresent( EGDE_MORPH_TOP ) && p.z >= 1.0 - MORPH_REGION )
					{
						float m = 1.0 - clamp( ( 1.0 - p.z ) / MORPH_REGION, 0.0, 1.0 );
						morphFactor = max( m, morphFactor );
					}
					if ( edgePresent( EGDE_MORPH_LEFT ) && p.x <= MORPH_REGION )
					{
						float m = 1.0 - clamp( p.x / MORPH_REGION, 0.0, 1.0 );
						morphFactor = max( m, morphFactor );
					}
					if ( edgePresent( EGDE_MORPH_BOTTOM ) && p.z <= MORPH_REGION )
					{
						float m = 1.0 - clamp( p.z / MORPH_REGION, 0.0, 1.0 );
						morphFactor = max( m, morphFactor );
					}
					if ( edgePresent( EGDE_MORPH_RIGHT ) && p.x >= 1.0 - MORPH_REGION )
					{
						float m = 1.0 - clamp( ( 1.0 - p.x ) / MORPH_REGION, 0.0, 1.0 );
						morphFactor = max( m, morphFactor );
					}

					return morphFactor;
				}

				void main()
				{
					vec3 pos;

					// Morph factor tells us how close we are to next level.
					// 0.0 is this level
					// 1.0 is next level
					float morphFactor = calculateMorph(position);

					// Move into correct place by scaling the vert based on the scale and offset of the tile
					// Remember that the geometry for each tile is no larger than 1 unit wide and deep
					pos = uScale * position + vec3(uTileOffset.x, 0.0, uTileOffset.y) + vec3(camPosition.x, 0.0, camPosition.z);

					// Snap to grid
					float grid = uScale / TILE_RESOLUTION;
					pos = floor( pos / grid ) * grid;

					// Morph between zoom layers
					if ( morphFactor > 0.0 )
					{
						// Get position that we would have if we were on higher level grid
						grid = 2.0 * grid;
						vec3 position2 = floor( pos / grid ) * grid;

						// Linearly interpolate the two, depending on morph factor
						pos = mix( pos, position2, morphFactor );
					}


					// Get height and calculate normal
					pos = pos + normal * getHeight( pos );

					// For reflection clipping
					vEyePosition = modelViewMatrix * vec4( pos, 1.0 );

					gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );

					vUv = worldToMapSpace(pos.xz);
					#ifdef BRUSHMODE
						vPosition = vec4( pos, 1.0 );
					#endif

					#if defined(SHADOW_MAPPING) || defined(PASS_SHADOW)
						vec4 worldPosition = vec4( pos, 1.0 );
					#endif

					#ifdef PASS_GBUFFER
						#ifdef HEIGHT_COLORS
							height = pos.y;
						#endif
						${ShaderFragments.ShadowMapping.vertMain()}
					#endif

					// We need to add the pass data
					#ifdef PASS_GBUFFER2
						normalView = normalMatrix * getNormal( pos, morphFactor );
						vNormal = normal;
                        vec4 mvPosition;
						mvPosition = modelViewMatrix * vec4( pos, 1.0 );
						#ifdef USE_BUMPMAP
							vViewPosition = -mvPosition.xyz;
						#endif
						vDepth = mvPosition.z / -cameraFar;
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

				// Declarations
				${ShaderFragments.FragParams.defaults()}
				${ShaderFragments.FragParams.clippingParams()}
				${ShaderFragments.FragParams.map()}
				${ShaderFragments.FragParams.bumpmapUniforms()}
				${ShaderFragments.FragParams.bumpmapFunctions()}
				${ShaderFragments.FragParams.vecToFloat()}
				${ShaderFragments.FragParams.encodeNormal()}

				#ifdef USE_BUMPMAP
					uniform float bumpDistance;
					uniform float rockDistance;
					uniform float rockScale;
					uniform vec2 repeatOverlayRock;
				#endif

				#ifdef ALBEDO_PASS

					#ifdef TERRAIN_TEX_BASE
						uniform vec2 repeatOverlayBase;
						uniform sampler2D tDiffuseBase;
					#endif

					#ifdef TERRAIN_TEX_SPLAT
						uniform sampler2D tSplat;
					#endif

					#ifdef TERRAIN_TEX_DIFF1
						uniform vec2 repeatOverlay1;
						uniform sampler2D tDiffuse1;
					#endif

					#ifdef TERRAIN_TEX_DIFF2
						uniform vec2 repeatOverlay2;
						uniform sampler2D tDiffuse2;
					#endif

					#ifdef TERRAIN_TEX_DIFF3
						uniform vec2 repeatOverlay3;
						uniform sampler2D tDiffuse3;
					#endif

					#ifdef TERRAIN_TEX_DIFF4
						uniform vec2 repeatOverlay4;
						uniform sampler2D tDiffuse4;
					#endif
				#endif


				#ifdef PASS_GBUFFER

					${ShaderFragments.FragParams.environmentMapping()}
					${ShaderFragments.ShadowMapping.fragParams()}

					#ifdef USE_SPECULARMAP
						uniform sampler2D specularMap;
					#endif
					uniform vec3 diffuse;
					uniform vec3 specular;
					uniform vec3 emissive;



					#ifdef HEIGHT_COLORS
						uniform vec3 topColor;
						uniform vec3 bottomColor;
						uniform vec3 midColor;
						uniform float heightColorsMinAltitude;
						uniform float heightColorsMidAltitude;
						uniform float heightColorsMaxAltitude;
						varying float height;
					#endif

					#ifdef TERRAIN_TEX_COLORS
						uniform sampler2D tColourMap;
					#endif

					#ifdef TERRAIN_TEX_LIGHTMAP
						uniform sampler2D tLightmap;
					#endif

				#endif

				// Used when sampling the heightfield. Higher values mean vaster terrain
				uniform float worldScale;
				varying vec2 vUv;

				#ifdef EDITOR_PASS
					#ifdef BRUSHMODE
						varying vec4 vPosition;
						uniform float ring_border_width;
						uniform vec3 ring_color;
						uniform vec3 ring_center;
						uniform float ring_radius;
						uniform float ring_falloff;
					#endif
				#endif

				#ifdef USE_HEIGHTFIELD
					#ifdef PASS_GBUFFER2
						uniform sampler2D heightfield;
					#endif
				#endif


				vec2 worldToMapSpace( vec2 worldPosition )
				{
					return ( worldPosition / worldScale + 0.5 );
				}

				#ifdef PASS_GBUFFER2
					uniform float shininess;
				#endif

				#if (defined(DIFFUSE_MAPS)) || (defined(PASS_GBUFFER2) && defined(USE_BUMPMAP))
					uniform sampler2D tDiffuseMaps;
					uniform float viewWidth;
					uniform float viewHeight;
				#endif

				void main()
				{
					${ShaderFragments.FragMain.clippingTest()}

					#if (defined(DIFFUSE_MAPS)) || (defined(PASS_GBUFFER2) && defined(USE_BUMPMAP))
						vec2 uvCoordinates = gl_FragCoord.xy / vec2( viewWidth, viewHeight );
					#endif

					#ifdef PASS_GBUFFER

						float specularStrength = 1.0;

						#ifdef USE_SPECULARMAP
							vec4 texelSpecular = texture2D( specularMap, vUv );
							specularStrength = texelSpecular.r;
						#endif

						// Albedo in Z
						#ifdef DIFFUSE_MAPS
							vec4 texelColor = texture2D( tDiffuseMaps, uvCoordinates );
						#else
							vec4 texelColor = vec4( 1.0,  1.0,  1.0, 1.0 );
						#endif

						#ifdef TERRAIN_TEX_COLORS
							texelColor *= texture2D( tColourMap, vUv );
						#endif

						#ifdef TERRAIN_TEX_LIGHTMAP
							texelColor *= texture2D( tLightmap, vUv );
						#endif

						// Height based colours
						#ifdef HEIGHT_COLORS
							vec3 heightColors = bottomColor;
							heightColors = mix( heightColors, midColor, smoothstep( heightColorsMinAltitude, heightColorsMidAltitude, height ) );
							heightColors = mix( heightColors, topColor, smoothstep( heightColorsMidAltitude, heightColorsMaxAltitude, height ) );
							texelColor.rgb *= heightColors;
						#endif

						${ShaderFragments.ShadowMapping.fragMain()}

						#ifndef SHADOW_MAPPING
							float shadowAmount = 1.0;
						#endif

						// Diffuse color in x
						gl_FragColor.x = vec3_to_float( diffuse * shadowAmount );

						// Specular color in y
						gl_FragColor.y = vec3_to_float( specular * specularStrength * shadowAmount );

						// Albedo in z
						gl_FragColor.z = vec3_to_float( texelColor.xyz );

						// Emmsive in w
						gl_FragColor.w = vec3_to_float( emissive * shadowAmount );

					#endif


					//	Draw the ring and grid on the terrain for when we are editing it.
					#ifdef EDITOR_PASS
						#ifdef BRUSHMODE
							float alpha = 0.0;
							float distance = sqrt((vPosition.x - ring_center.x) * (vPosition.x - ring_center.x) + (vPosition.z - ring_center.z) * (vPosition.z - ring_center.z));
							if (distance < ring_radius + ring_border_width / 2.0 && distance > ring_radius - ring_border_width / 2.0)
								alpha = 1.0;


							// 	Grid overlay
							float gridDist = ring_radius * ring_falloff - ring_border_width / 2.0;
							if (distance < gridDist )
							{
								float tiles = 1.0 / 300.0;
								if (mod(vUv.x * worldScale, tiles) < .03 || mod(vUv.y * worldScale, tiles) < .03)
									alpha = alpha * ( 1.0 - distance / gridDist );
							}

							gl_FragColor = vec4( ring_color, alpha );
							gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
						#endif
					#endif


					#ifdef ALBEDO_PASS
						#ifdef TERRAIN_TEX_BASE
							vec2 uvTiledBase = repeatOverlayBase * vUv;
							vec4 tvDifBase = texture2D( tDiffuseBase, uvTiledBase );
							vec4 texelColor = vec4( tvDifBase.r, tvDifBase.g, tvDifBase.b, 1.0 );
						#else
							vec4 texelColor = vec4( 1.0,  1.0,  1.0, 1.0 );
						#endif

						#ifdef TERRAIN_TEX_DIFF1
							vec2 uvTiled1 = repeatOverlay1 * vUv;
							vec4 tvDif1 = texture2D( tDiffuse1, uvTiled1 );
						#endif

						#ifdef TERRAIN_TEX_DIFF2
							vec2 uvTiled2 = repeatOverlay2 * vUv;
							vec4 tvDif2 = texture2D( tDiffuse2, uvTiled2 );
						#endif

						#ifdef TERRAIN_TEX_DIFF3
							vec2 uvTiled3 = repeatOverlay3 * vUv;
							vec4 tvDif3 = texture2D( tDiffuse3, uvTiled3 );
						#endif

						#ifdef TERRAIN_TEX_DIFF4
							vec2 uvTiled4 = repeatOverlay4 * vUv;
							vec4 tvDif4 = texture2D( tDiffuse4, uvTiled4 );
						#endif

						// Blend the 4 textures base
						#ifdef TERRAIN_TEX_SPLAT
							vec4 tvSplat = texture2D( tSplat, vUv );
						#else
							vec4 tvSplat = vec4( 0.0, 0.0, 0.0, 0.0 );
						#endif
						#ifdef TERRAIN_TEX_DIFF1
							texelColor = mix( texelColor, tvDif1, tvSplat.x );
						#endif
						#ifdef TERRAIN_TEX_DIFF2
							texelColor = mix( texelColor, tvDif2, tvSplat.y );
						#endif
						#ifdef TERRAIN_TEX_DIFF3
							texelColor = mix( texelColor, tvDif3, tvSplat.z );
						#endif
						#ifdef TERRAIN_TEX_DIFF4
							texelColor = mix( texelColor, tvDif4, tvSplat.w );
						#endif

						gl_FragColor = texelColor;
					#endif

					#ifdef PASS_GBUFFER2

						vec3 normal = normalize( normalView );

						// Get the depth from 0 to 1
						float normalizedDepth = vDepth;

						#ifdef USE_BUMPMAP
							vec3 detailNormal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd(uvCoordinates, tDiffuseMaps, bumpScale));
							if ( normalizedDepth < bumpDistance )
							{
								float bumpLerp = normalizedDepth / bumpDistance;
								normal = mix( detailNormal, normal, bumpLerp );
							}

							if ( normalizedDepth > rockDistance )
								normal =  mix( perturbNormalArb( -vViewPosition, normal, dHdxy_fwd( repeatOverlayRock * vUv, bumpMap, rockScale ) ), normal, (1.0 - normalizedDepth) / ( 1.0 - rockDistance ) );
						#endif

						// Normal in XYZ
						gl_FragColor.x = vec3_to_float( normal * 0.5 + 0.5 );

						// Translucency in Y
						${ShaderFragments.FragMain.packTranslucency()}

						// Depth in Z
						gl_FragColor.z = normalizedDepth;

						// FREE, Opacity, shininess
						gl_FragColor.w = vec3_to_float( vec3( 0.0, opacity, shininess ) );

					#endif

					${ShaderFragments.Passes.fragShadowMain()}
				}
			`
        }

		/*
		* Checks the uniforms or attributes of the material after a potentially breaking change
		*/
        protected _validate() {
            if ( this.materials[ PassType.GBuffer ]._uniforms[ 'modelMatrix' ] )
                this.materials[ PassType.GBuffer ].removeUniform( 'modelMatrix', false );
        }

        protected setTextureUniform( texUniform: string, tileUniform: string, val: TextureBase, tile: Vec2, define: ShaderDefines, textureType: TerrainTextureType, passType: PassType ) {
            const material: MaterialMulti = this.materials[ passType ];
            const curTexture = material._uniforms[ texUniform ];

            if ( curTexture && val )
                material.setUniform( texUniform, val, true );

            else if ( !curTexture && val ) {
                material.addUniform( new UniformVar( texUniform, UniformType.TEXTURE, val ) );

                if ( tileUniform )
                    material.addUniform( new UniformVar( tileUniform, UniformType.FLOAT2, tile ) );

                if ( define )
                    material.addDefine( define );

                if ( passType === PassType.TerrainAlbedo && this._numDiffuseTextures === 0 ) {
                    this._albedoPass.enabled = true;
                    this.materials[ PassType.GBuffer ].addDefine( '#define DIFFUSE_MAPS' );
                    this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'tDiffuseMaps', UniformType.TEXTURE, this._albedoPass.renderTarget ) );
                    this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'viewWidth', UniformType.FLOAT, 0 ) );
                    this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'viewHeight', UniformType.FLOAT, 0 ) );

                    if ( this._bumpMapping ) {
                        this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'tDiffuseMaps', UniformType.TEXTURE, this._albedoPass.renderTarget ) );
                        this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'viewWidth', UniformType.FLOAT, 0 ) );
                        this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'viewHeight', UniformType.FLOAT, 0 ) );
                    }
                }

                if ( passType === PassType.TerrainAlbedo )
                    this._numDiffuseTextures++;
            }
            else {
                material.removeUniform( texUniform );
                if ( tileUniform )
                    material.removeUniform( tileUniform );

                if ( define )
                    material.removeDefine( define );

                if ( curTexture && passType === PassType.TerrainAlbedo )
                    this._numDiffuseTextures--;

                if ( passType === PassType.TerrainAlbedo && this._numDiffuseTextures === 0 ) {
                    this._albedoPass.enabled = false;
                    this.materials[ PassType.GBuffer ].removeDefine( '#define DIFFUSE_MAPS' );
                    this.materials[ PassType.GBuffer ].removeUniform( 'tDiffuseMaps' );
                    this.materials[ PassType.GBuffer ].removeUniform( 'viewWidth' );
                    this.materials[ PassType.GBuffer ].removeUniform( 'viewHeight' );

                    if ( this._bumpMapping ) {
                        this.materials[ PassType.GBuffer2 ].removeUniform( 'tDiffuseMaps' );
                        this.materials[ PassType.GBuffer2 ].removeUniform( 'viewWidth' );
                        this.materials[ PassType.GBuffer2 ].removeUniform( 'viewHeight' );
                    }
                }
            }

            this._textureEvent.type = textureType;
            this.emit<TerrainMaterialEvents, ITerrainMaterialEvent>( 'texture_changed', this._textureEvent );
        }

		/**
		* Gets or sets the base diffuse texture
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        textureBase( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this.materials[ PassType.TerrainAlbedo ]._uniforms[ 'tDiffuseBase' ].value
            this.setTextureUniform( 'tDiffuseBase', 'repeatOverlayBase', val, this._tileScaleBase, ShaderDefines.TERRAIN_TEX_BASE, TerrainTextureType.Base, PassType.TerrainAlbedo );
            return val;
        }

		/**
		* Gets or sets the base diffuse texture 1
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        textureDiffuse1( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this.materials[ PassType.TerrainAlbedo ]._uniforms[ 'tDiffuse1' ].value;
            this.setTextureUniform( 'tDiffuse1', 'repeatOverlay1', val, this._tileScaleDiff1, ShaderDefines.TERRAIN_TEX_DIFF1, TerrainTextureType.Diffuse1, PassType.TerrainAlbedo );
            return val;
        }

		/**
		* Gets or sets the base diffuse texture 2
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        textureDiffuse2( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this.materials[ PassType.TerrainAlbedo ]._uniforms[ 'tDiffuse2' ].value;
            this.setTextureUniform( 'tDiffuse2', 'repeatOverlay2', val, this._tileScaleDiff2, ShaderDefines.TERRAIN_TEX_DIFF2, TerrainTextureType.Diffuse2, PassType.TerrainAlbedo );
            return val;
        }

		/**
		* Gets or sets the base diffuse texture 3
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        textureDiffuse3( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this.materials[ PassType.TerrainAlbedo ]._uniforms[ 'tDiffuse3' ].value;
            this.setTextureUniform( 'tDiffuse3', 'repeatOverlay3', val, this._tileScaleDiff3, ShaderDefines.TERRAIN_TEX_DIFF3, TerrainTextureType.Diffuse3, PassType.TerrainAlbedo );
            return val;
        }

		/**
		* Gets or sets the base diffuse texture 4
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        textureDiffuse4( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this.materials[ PassType.TerrainAlbedo ]._uniforms[ 'tDiffuse4' ].value;
            this.setTextureUniform( 'tDiffuse4', 'repeatOverlay4', val, this._tileScaleDiff4, ShaderDefines.TERRAIN_TEX_DIFF4, TerrainTextureType.Diffuse4, PassType.TerrainAlbedo );
            return val;
        }

		/**
		* Gets or sets the base splat texture
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        textureSplat( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this.materials[ PassType.TerrainAlbedo ]._uniforms[ 'tSplat' ].value;
            this.setTextureUniform( 'tSplat', null, val, null, ShaderDefines.TERRAIN_TEX_SPLAT, TerrainTextureType.Splat, PassType.TerrainAlbedo );
            return val;
        }

		/**
		* Gets or sets the specular texture
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        textureSpecular( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this.materials[ PassType.GBuffer ]._uniforms[ 'specularMap' ].value;
            this.setTextureUniform( 'specularMap', null, val, null, ShaderDefines.SPECULAR_MAP, TerrainTextureType.Specular, PassType.GBuffer );
            return val;
        }

		/**
		* Gets or sets the lightmap texture
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        textureLightmap( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this.materials[ PassType.GBuffer ]._uniforms[ 'tLightmap' ].value;
            this.setTextureUniform( 'tLightmap', null, val, null, ShaderDefines.TERRAIN_TEX_LIGHTMAP, TerrainTextureType.Lightmap, PassType.GBuffer );
            return val;
        }

		/**
		* Gets or sets the color map texture
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        textureColors( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this.materials[ PassType.GBuffer ]._uniforms[ 'tColourMap' ].value;

            this.setTextureUniform( 'tColourMap', null, val, null, ShaderDefines.TERRAIN_TEX_COLORS, TerrainTextureType.Colors, PassType.GBuffer );

            return val;
        }

		/**
		* Gets or sets the distant rock texture
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        textureRockmap( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this.materials[ PassType.TerrainAlbedo ]._uniforms[ 'bumpMap' ].value;

            this._bumpMap = val;
            this.setTextureUniform( 'bumpMap', 'repeatOverlayRock', val, this._tileScaleRock, null, TerrainTextureType.Rocks, PassType.GBuffer2 );

            return val;
        }

		/**
		* Gets or sets a heightmap texture
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        heightmap( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._uniforms[ 'heightfield' ].value;

            const material: MaterialMulti = this;
            const curTexture: UniformVar = this._uniforms[ 'heightfield' ];
            this._heightfield = val;

            material.removeDefine( '#define HEIGHTFIELD_SIZE_X ' + this._prevWidth.toFixed( 1 ) );
            material.removeDefine( '#define HEIGHTFIELD_SIZE_Y ' + this._prevHeight.toFixed( 1 ) );

            // If we have a texture already - then just update the uniform
            if ( curTexture && val ) {
                this._prevWidth = val.width;
                this._prevHeight = val.height;
                material.addDefine( '#define HEIGHTFIELD_SIZE_X ' + this._prevWidth.toFixed( 1 ) );
                material.addDefine( '#define HEIGHTFIELD_SIZE_Y ' + this._prevHeight.toFixed( 1 ) );

                material.setUniform( 'heightfield', val, true );
                this.emit<TerrainMaterialEvents, ITerrainMaterialEvent>( 'texture_changed', this._textureEvent );
                return;
            }
            // No texture currently, but adding a new one
            else if ( !curTexture && val ) {
                this._prevWidth = val.width;
                this._prevHeight = val.height;
                material.addDefine( '#define HEIGHTFIELD_SIZE_X ' + this._prevWidth.toFixed( 1 ) );
                material.addDefine( '#define HEIGHTFIELD_SIZE_Y ' + this._prevHeight.toFixed( 1 ) );


                material.addUniform( new UniformVar( 'heightfield', Trike.UniformType.TEXTURE, val ) );
                material.addUniform( new UniformVar( 'altitude', Trike.UniformType.FLOAT, this._altitude ) );
                material.addUniform( new UniformVar( 'heightOffset', Trike.UniformType.FLOAT, this._heightOffset ) );
                material.addDefine( ShaderDefines.USE_HEIGHTFIELD );
            }
            else {
                this.removeDefine( '#define HEIGHTFIELD_SIZE_X ' + this._prevWidth.toFixed( 1 ) );
                this.removeDefine( '#define HEIGHTFIELD_SIZE_Y ' + this._prevHeight.toFixed( 1 ) );

                material.removeUniform( 'heightfield' );
                material.removeUniform( 'altitude' );
                material.removeUniform( 'heightOffset' );
                material.removeDefine( ShaderDefines.USE_HEIGHTFIELD );
            }

            this._textureEvent.type = TerrainTextureType.Heightmap;
            this.emit<TerrainMaterialEvents, ITerrainMaterialEvent>( 'texture_changed', this._textureEvent );

            return val;
        }

		/**
		* Gets or sets if the terrain adds height based colours to the final pixel contribution.
		* @param {boolean} val [Optional]
		* @returns {boolean}
		*/
        heightColors( val?: boolean ): boolean {
            if ( val === undefined ) return this._heightBasedColors;

            if ( this._heightBasedColors === val )
                return;

            const material = this.materials[ PassType.GBuffer ];

            this._heightBasedColors = val;
            if ( val ) {
                material.addUniform( new UniformVar( 'topColor', UniformType.COLOR3, this._topColor ) );
                material.addUniform( new UniformVar( 'bottomColor', UniformType.COLOR3, this._bottomColor ) );
                material.addUniform( new UniformVar( 'midColor', UniformType.COLOR3, this._midColor ) );
                material.addUniform( new UniformVar( 'heightColorsMinAltitude', UniformType.FLOAT, this._heightColorsMinAltitude ) );
                material.addUniform( new UniformVar( 'heightColorsMidAltitude', UniformType.FLOAT, this._heightColorsMidAltitude ) );
                material.addUniform( new UniformVar( 'heightColorsMaxAltitude', UniformType.FLOAT, this._heightColorsMaxAltitude ) );
                material.addDefine( '#define HEIGHT_COLORS' );
            }
            else {
                material.removeUniform( 'topColor' );
                material.removeUniform( 'bottomColor' );
                material.removeUniform( 'midColor' );
                material.removeUniform( 'heightColorsMaxAltitude' );
                material.removeUniform( 'heightColorsMidAltitude' );
                material.removeUniform( 'heightColorsMinAltitude' );
                material.removeDefine( '#define HEIGHT_COLORS' );
            }

            return val;
        }

		/**
		* Gets or sets the top color multiplier. This affects the highest altitude only if heightColors is true.
		* Tweak this with heightColorsMin, heightColorsMid and heightColorsMaxAltitude variables.
		* @param {Color} val [Optional]
		* @returns {Color}
		*/
        topColor( val?: Color ): Color {
            if ( val === undefined ) return this._topColor;

            this._topColor = val;
            if ( !this._heightBasedColors )
                return;

            const material = this.materials[ PassType.GBuffer ];
            material.setUniform( 'topColor', val, false );

            return val;
        }

		/**
		* Gets or sets the mid color multiplier. This affects the highest altitude only if heightColors is true.
		* Tweak this with heightColorsMin, heightColorsMid and heightColorsMaxAltitude variables.
		* @param {Color} val [Optional]
		* @returns {Color}
		*/
        midColor( val?: Color ): Color {
            if ( val === undefined ) return this._midColor;

            this._midColor = val;
            if ( !this._heightBasedColors )
                return;

            const material = this.materials[ PassType.GBuffer ];
            material.setUniform( 'midColor', val, false );

            return val;
        }

		/**
		* Gets or sets the bottom color multiplier. This affects the highest altitude only if heightColors is true.
		* Tweak this with heightColorsMin, heightColorsMid and heightColorsMaxAltitude variables.
		* @param {Color} val [Optional]
		* @returns {Color}
		*/
        bottomColor( val?: Color ): Color {
            if ( val === undefined ) return this._bottomColor;

            this._bottomColor = val;
            if ( !this._heightBasedColors )
                return;

            const material = this.materials[ PassType.GBuffer ];
            material.setUniform( 'bottomColor', val, false );

            return val;
        }

		/**
		* Gets or sets the lower altitude of the height colour multiplier.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        heightColorsMinAltitude( val?: number ): number {
            if ( val === undefined ) return this._heightColorsMinAltitude;

            this._heightColorsMinAltitude = val;
            if ( !this._heightBasedColors )
                return;

            const material = this.materials[ PassType.GBuffer ];
            material.setUniform( 'heightColorsMinAltitude', val, false );

            return val;
        }

		/**
		* Gets or sets the mid altitude of the height colour multiplier.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        heightColorsMidAltitude( val?: number ): number {
            if ( val === undefined ) return this._heightColorsMidAltitude;

            this._heightColorsMidAltitude = val;
            if ( !this._heightBasedColors )
                return;

            const material = this.materials[ PassType.GBuffer ];
            material.setUniform( 'heightColorsMidAltitude', val, false );

            return val;
        }

		/**
		* Gets or sets the max altitude of the height colour multiplier.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        heightColorsMaxAltitude( val?: number ): number {
            if ( val === undefined ) return this._heightColorsMaxAltitude;

            this._heightColorsMaxAltitude = val;
            if ( !this._heightBasedColors )
                return;

            const material = this.materials[ PassType.GBuffer ];
            material.setUniform( 'heightColorsMaxAltitude', val, false );

            return val;
        }

		/**
		* Gets or sets how far we need to calculate bumpmapping on the terrain. The values are from 0 to 1.
		* @param {number} val
		* @returns {number}
		*/
        bumpDistance( val?: number ): number {
            if ( val === undefined ) return this._bumpDistance;

            this._bumpDistance = val;

            if ( !this._bumpMapping )
                return;

            // We set this on the normal depth as the color pass ignores it
            const normDepth: MaterialMulti = this.materials[ PassType.GBuffer2 ];
            normDepth.setUniform( 'bumpDistance', val, true );

            return val;
        }

		/**
		* Gets or sets how far we need to calculate the rock map bumpmapping on the terrain.
		* The values are from 0 to 1, typically 0 means the rock map gets gradually bumpier to the distance right in front of the camera.
		* If the value is 0.5, then the rock bumps only start to appear half way from the camera view distance.
		* @param {number} val
		* @returns {number}
		*/
        rockDistance( val?: number ): number {
            if ( val === undefined ) return this._rockDistance;

            this._rockDistance = val;

            if ( !this._bumpMapping )
                return;

            // We set this on the normal depth as the color pass ignores it
            const normDepth: MaterialMulti = this.materials[ PassType.GBuffer2 ];
            normDepth.setUniform( 'rockDistance', val, true );

            return val;
        }

		/**
		* Gets or sets if the bump mapping is turned on
		* @param {boolean} val
		* @returns {boolean}
		*/
        bumpMapping( val?: boolean ): boolean {
            if ( val === undefined ) return this._bumpMapping;

            // We set this on the normal depth as the color pass ignores it
            const normDepth: MaterialMulti = this.materials[ PassType.GBuffer2 ];

            this._bumpMapping = val;


            if ( val ) {
                normDepth.addUniform( new UniformVar( 'bumpMap', Trike.UniformType.TEXTURE, this._bumpMap ) );
                normDepth.addUniform( new UniformVar( 'bumpScale', Trike.UniformType.FLOAT, this._tileScale ) );
                normDepth.addUniform( new UniformVar( 'rockScale', Trike.UniformType.FLOAT, this._rockScale ) );
                normDepth.addUniform( new UniformVar( 'bumpDistance', Trike.UniformType.FLOAT, this._bumpDistance ) );
                normDepth.addUniform( new UniformVar( 'rockDistance', Trike.UniformType.FLOAT, this._rockDistance ) );
                normDepth.addUniform( new UniformVar( 'repeatOverlayRock', Trike.UniformType.FLOAT2, this._tileScaleRock ) );

                normDepth.addDefine( ShaderDefines.BUMP_MAP );

                if ( this._numDiffuseTextures > 0 ) {
                    normDepth.addUniform( new UniformVar( 'tDiffuseMaps', UniformType.TEXTURE, this._albedoPass.renderTarget ) );
                    normDepth.addUniform( new UniformVar( 'viewWidth', UniformType.FLOAT, 0 ) );
                    normDepth.addUniform( new UniformVar( 'viewHeight', UniformType.FLOAT, 0 ) );
                }
            }
            else {
                normDepth.removeUniform( 'bumpMap' );
                normDepth.removeUniform( 'bumpScale' );
                normDepth.removeUniform( 'rockScale' );
                normDepth.removeUniform( 'bumpDistance' );
                normDepth.removeUniform( 'rockDistance' );
                normDepth.removeUniform( 'repeatOverlayRock' );
                normDepth.removeDefine( ShaderDefines.BUMP_MAP );

                if ( this._numDiffuseTextures > 0 ) {
                    normDepth.removeUniform( 'tDiffuseMaps' );
                    normDepth.removeUniform( 'viewWidth' );
                    normDepth.removeUniform( 'viewHeight' );
                }
            }

            return val;
        }

		/**
		* Gets or sets the bump scale of the texture tiles. Higher values mean the terrain textures are very bumpy. Typically between 0 and 1, but can be more or less.
		* @param {number} val
		* @returns {number}
		*/
        tileScale( val?: number ): number {
            if ( val === undefined ) return this._tileScale;

            // We set this on the normal depth as the color pass ignores it
            const normDepth: MaterialMulti = this.materials[ PassType.GBuffer2 ];
            this._tileScale = val;

            if ( !this._bumpMapping )
                return;

            normDepth.setUniform( 'bumpScale', val, false );

            return val;
        }

		/**
		* Gets or sets the bump scale of the rock map. Higher values mean the terrain is very bumpy. Typically between 0 and 1, but can be more or less.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        rockScale( val?: number ): number {
            if ( val === undefined ) return this._rockScale;

            // We set this on the normal depth as the color pass ignores it
            const normDepth: MaterialMulti = this.materials[ PassType.GBuffer2 ];
            this._rockScale = val;

            if ( !this._bumpMapping )
                return;


            normDepth.setUniform( 'rockScale', val, false );

            return val;
        }

		/*
		* Gets or sets diffuse lighting color of the material
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
		* Gets or sets emissive light colour
		* @param {Color} val [Optional]
		* @returns {Color}
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
            if ( val === undefined ) return this.materials[ PassType.GBuffer2 ]._uniforms[ 'shininess' ].value;
            this.materials[ PassType.GBuffer2 ].setUniform( 'shininess', val, false );
            return val;
        }

		/**
		* Gets or sets the altitude multiplier
		* @param {number} val [Optional]
		* @returns {number}
		*/
        altitude( val?: number ): number {
            if ( val === undefined ) return this._altitude;

            this._altitude = val;
            if ( this._heightfield )
                this.setUniform( 'altitude', val, true );

            return val;
        }

		/**
		* Gets or sets the height offset multiplier
		* @param {number} val [Optional]
		* @returns {number}
		*/
        heightOffset( val?: number ): number {
            if ( val === undefined ) return this._heightOffset;

            this._heightOffset = val;
            if ( this._heightfield )
                this.setUniform( 'heightOffset', val, true );

            return val;
        }

		/**
		* Gets or sets how wide and deep the heightfield texture must be sampled. Higher values mean more vast terrain.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        worldScale( val?: number ): number {
            if ( val === undefined ) return this._worldScale;

            this._worldScale = val;
            if ( this._worldScale )
                this.setUniform( 'worldScale', val, true );

            return val;
        }

		/**
		* Gets or sets the resolution of the tiles. This must be the same as the terrain's resolution
		* @param {number} val [Optional]
		* @returns {number}
		*/
        tileResolution( val?: number ): number {
            if ( val === undefined ) return this._tileResolution;

            this.removeDefine( '#define TILE_RESOLUTION ' + this._tileResolution.toFixed( 1 ) );
            this._tileResolution = val;
            this.addDefine( '#define TILE_RESOLUTION ' + val.toFixed( 1 ) );

            return val;
        }

		/**
		* Gets or sets if the terrain brush mode is on. Brush mode will draw a circular brush on the terrain. This can be useful for editors
		* @returns {boolean} val
		* @returns {boolean} val
		*/
        brushMode( val?: boolean ): boolean {
            if ( val === undefined ) return this._brushMode;

            if ( this._brushMode === val )
                return;

            this._brushMode = val;

            if ( val ) {
                this.materials[ PassType.EditorPass ].addDefine( ShaderDefines.BRUSHMODE );
                this.materials[ PassType.EditorPass ].addUniform( new UniformVar( 'ring_border_width', Trike.UniformType.FLOAT, this._ring_border_width ) );
                this.materials[ PassType.EditorPass ].addUniform( new UniformVar( 'ring_color', Trike.UniformType.COLOR3, this._ring_color ) );
                this.materials[ PassType.EditorPass ].addUniform( new UniformVar( 'ring_center', Trike.UniformType.FLOAT3, this._ring_center ) );
                this.materials[ PassType.EditorPass ].addUniform( new UniformVar( 'ring_radius', Trike.UniformType.FLOAT, this._ring_radius ) );
                this.materials[ PassType.EditorPass ].addUniform( new UniformVar( 'ring_falloff', Trike.UniformType.FLOAT, this._ring_falloff ) );
            }
            else {
                this.materials[ PassType.EditorPass ].removeDefine( ShaderDefines.BRUSHMODE );
                this.materials[ PassType.EditorPass ].removeUniform( 'ring_border_width' );
                this.materials[ PassType.EditorPass ].removeUniform( 'ring_color' );
                this.materials[ PassType.EditorPass ].removeUniform( 'ring_center' );
                this.materials[ PassType.EditorPass ].removeUniform( 'ring_radius' );
                this.materials[ PassType.EditorPass ].removeUniform( 'ring_falloff' );
            }

            return val;
        }

		/**
		* Gets or sets the width of the outer ring border
		* @param {number} val [Optional]
		* @returns {number}
		*/
        ring_border_width( val?: number ): number {
            if ( val === undefined ) return this._ring_border_width;

            this._ring_border_width = val;
            if ( !this._brushMode )
                return;

            this.materials[ PassType.EditorPass ].setUniform( 'ring_border_width', val, false );

            return val;
        }

		/**
		* Gets or sets the ring color. Only valid if in brush mode.
		* @param {Color} val
		* @returns {Color} val
		*/
        ring_color( val?: Color ): Color {
            if ( val === undefined ) return this._ring_color;

            this._ring_color = val;
            if ( !this._brushMode )
                return;

            this.materials[ PassType.EditorPass ].setUniform( 'ring_color', val, false );

            return val;
        }

		/**
		* Gets or sets the ring center (world space). Only valid if in brush mode. Only visible if brush mode is true.
		* @param {Vec3} val
		* @returns {Vec3}
		*/
        ring_center( val?: Vec3 ): Vec3 {
            if ( val === undefined ) return this._ring_center;

            this._ring_center = val;
            if ( !this._brushMode )
                return;

            this.materials[ PassType.EditorPass ].setUniform( 'ring_center', val, false );

            return val;
        }

		/**
		* Gets or sets the ring outer radius. Only valid if in brush mode. Only visible if brush mode is true.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        ring_radius( val?: number ): number {
            if ( val === undefined ) return this._ring_radius;

            this._ring_radius = val;
            if ( !this._brushMode )
                return;

            this.materials[ PassType.EditorPass ].setUniform( 'ring_radius', val, false );

            return val;
        }

		/**
		* Gets or sets the ring falloff value. A value of 1 means the falloff is the same size as the ring_radius.
		* Only visible if brush mode is true.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        ring_falloff( val?: number ): number {
            if ( val === undefined ) return this._ring_falloff;

            this._ring_falloff = val;
            if ( !this._brushMode )
                return;

            this.materials[ PassType.EditorPass ].setUniform( 'ring_falloff', val, false );

            return val;
        }

		/**
		* Gets or sets the UV scale of the rock bump texture
		* @param {Vec2} [Optional]
		* @returns {Vec2}
		*/
        tileScaleRock( val?: Vec2 ): Vec2 {
            if ( val === undefined ) return this._tileScaleRock;

            this._tileScaleRock = val;
            const material = this.materials[ PassType.GBuffer2 ];
            if ( material._uniforms[ 'repeatOverlayRock' ] )
                material.setUniform( 'repeatOverlayRock', val, true );

            return val;
        }

		/**
		* Gets or sets the UV scale of the base texture
		* @param {Vec2} [Optional]
		* @returns {Vec2}
		*/
        tileScaleBase( val?: Vec2 ): Vec2 {
            if ( val === undefined ) return this._tileScaleBase;

            this._tileScaleBase = val;
            const material = this.materials[ PassType.TerrainAlbedo ];
            if ( material._uniforms[ 'repeatOverlayBase' ] )
                material.setUniform( 'repeatOverlayBase', val, true );

            return val;
        }

		/**
		* Gets or sets the UV scale of the first texture
		* @param {Vec2} [Optional]
		* @returns {Vec2}
		*/
        tileScaleDiff1( val?: Vec2 ): Vec2 {
            if ( val === undefined ) return this._tileScaleDiff1;

            this._tileScaleDiff1 = val;
            const material = this.materials[ PassType.TerrainAlbedo ];
            if ( material._uniforms[ 'repeatOverlay1' ] )
                material.setUniform( 'repeatOverlay1', val, true );

            return val;
        }

		/**
		* Gets or sets the UV scale of the second texture
		* @param {Vec2} [Optional]
		* @returns {Vec2}
		*/
        tileScaleDiff2( val?: Vec2 ): Vec2 {
            if ( val === undefined ) return this._tileScaleDiff2;

            this._tileScaleDiff2 = val;
            const material = this.materials[ PassType.TerrainAlbedo ];
            if ( material._uniforms[ 'repeatOverlay2' ] )
                material.setUniform( 'repeatOverlay2', val, true );

            return val;
        }

		/**
		* Gets or sets the UV scale of the third texture
		* @param {Vec2} [Optional]
		* @returns {Vec2}
		*/
        tileScaleDiff3( val?: Vec2 ): Vec2 {
            if ( val === undefined ) return this._tileScaleDiff3;

            this._tileScaleDiff3 = val;
            const material = this.materials[ PassType.TerrainAlbedo ];
            if ( material._uniforms[ 'repeatOverlay3' ] )
                material.setUniform( 'repeatOverlay3', val, true );

            return val;
        }

		/**
		* Gets or sets the UV scale of the fourth texture
		* @param {Vec2} [Optional]
		* @returns {Vec2}
		*/
        tileScaleDiff4( val?: Vec2 ): Vec2 {
            if ( val === undefined ) return this._tileScaleDiff4;

            this._tileScaleDiff4 = val;
            const material = this.materials[ PassType.TerrainAlbedo ];
            if ( material._uniforms[ 'repeatOverlay4' ] )
                material.setUniform( 'repeatOverlay4', val, true );

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
    }
}