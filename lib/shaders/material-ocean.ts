namespace Trike {
	/**
	*
	*/
    export class MaterialOcean extends MaterialMulti implements IGridMaterial, IReflectiveMaterial {
        private _heightfield: Texture;
        private _bumpMap: TextureBase;

        private _alphaTest: number;

        // Terrain texture scales
        private _tileScale: number;

        private _tileResolution: number;
        private _altitude: number;
        private _heightOffset: number;
        private _worldScale: number;
        private _prevWidth: number;
        private _prevHeight: number;

        // Height based colours
        private _topColor: Color;
        private _bottomColor: Color;

        // Bump mapping variables
        private _bumpMapping: boolean;
        private _bumpDistance: number;

        // Translucency
        private _translucencyEnabled: boolean;
        private _translucencyScale: number;
        private _translucencyDistortion: number;
        private _translucencyPower: number;

        // Reflection
        private _mirrorReflection: boolean;
        private _reflectionMap: RenderTarget;
        private _mirrorDistortion: number;

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
                this.materials[ PassType.EditorPass ] = new PassMaterial( 'EditorPass', this );

            this._mirrorReflection = false;
            this._reflectionMap = null;
            this._mirrorDistortion = 10;

            this._alphaTest = 0;
            this._tileScale = 1;
            this._altitude = altitude;
            this._heightOffset = 0;
            this._prevWidth = 0;
            this._prevHeight = 0;
            this._worldScale = worldScale;
            this._bumpMapping = false;

            // Height based colours
            this._topColor = new Color( 0xFFFFFF );
            this._bottomColor = new Color( 0x4F483B );

            this._bumpDistance = 0.03;
            this._translucencyEnabled = false;
            this._translucencyScale = 1;
            this._translucencyDistortion = 0.185;
            this._translucencyPower = 0.04;

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

            // GBufffer only
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'diffuse', Trike.UniformType.COLOR3, new Color( 0x96762C ) ) );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'specular', Trike.UniformType.COLOR3, new Color( 0xffffff ) ) );
            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'emissive', Trike.UniformType.COLOR3, new Color( 0x000000 ) ) );

            // Add the camera far uniform to the normal depth material
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'cameraFar', Trike.UniformType.FLOAT, 1000 ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'shininess', Trike.UniformType.FLOAT, 0.05 ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'opacity', Trike.UniformType.FLOAT, 1 ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'topColor', UniformType.COLOR3, this._topColor ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'bottomColor', UniformType.COLOR3, this._bottomColor ) );

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

            this.setShaders( this.getVertexShader(), this.getFragmentShader() );
            this.heightmap = null;
            this.transparent = true;
        }

		/**
		* Create the vertex shader
		* @returns {string}
		*/
        getVertexShader(): string {
            return [

                ShaderFragments.VertParams.defaults(),
                ShaderFragments.VertParams.clippingParameters(),

                '#ifdef USE_HEIGHTFIELD',
                '    uniform sampler2D heightfield;',
                '#endif',

                // Used when sampling the heightfield. Higher values mean vaster terrain
                'uniform float worldScale;',

                // Used to amplify the height
                'uniform float altitude;',

                // Used to offset the terrain vertically
                'uniform float heightOffset;',

                // Used for the tile positioning
                'uniform vec3 camPosition;',

                'uniform vec2 tileScale;',
                'uniform vec2 uTileOffset;',
                'uniform float uScale;',
                'uniform int uEdgeMorph;',

                'varying vec2 vUv;',
                'varying float vHeight;',


                '#ifdef USE_HEIGHTFIELD \n',

                // catmull works by specifying 4 control points p0, p1, p2, p3 and a weight. The function is used to calculate a point n between p1 and p2 based
                // on the weight. The weight is normalized, so if it's a value of 0 then the return value will be p1 and if its 1 it will return p2.
                '	float catmullRom( float p0, float p1, float p2, float p3, float weight ) {',
                '		float weight2 = weight * weight;',
                '		return 0.5 * (',
                '			p0 * weight * ( ( 2.0 - weight ) * weight - 1.0 ) +',
                '			p1 * ( weight2 * ( 3.0 * weight - 5.0 ) + 2.0 ) +',
                '			p2 * weight * ( ( 4.0 - 3.0 * weight ) * weight + 1.0 ) +',
                '			p3 * ( weight - 1.0 ) * weight2 );',
                '	}',

                // Performs a horizontal catmulrom operation at a given V value.
                '	float textureCubicU( sampler2D samp, vec2 uv00, float texel, float offsetV, float frac ) {',
                '		return catmullRom(',
                '			texture2DLod( samp, uv00 + vec2( -texel, offsetV ), 0.0 ).r,',
                '			texture2DLod( samp, uv00 + vec2( 0.0, offsetV ), 0.0 ).r,',
                '			texture2DLod( samp, uv00 + vec2( texel, offsetV ), 0.0 ).r,',
                '			texture2DLod( samp, uv00 + vec2( texel * 2.0, offsetV ), 0.0 ).r,',
                '		frac );',
                '	}',

                // Samples a texture using a bicubic sampling algorithm. This essentially queries neighbouring
                // pixels to get an average value.
                '	float textureBicubic( sampler2D samp, vec2 uv00, vec2 texel, vec2 frac ) {',
                '		return catmullRom(',
                '			textureCubicU( samp, uv00, texel.x, -texel.y, frac.x ),',
                '			textureCubicU( samp, uv00, texel.x, 0.0, frac.x ),',
                '			textureCubicU( samp, uv00, texel.x, texel.y, frac.x ),',
                '			textureCubicU( samp, uv00, texel.x, texel.y * 2.0, frac.x ),',
                '		frac.y );',
                '	}\n',

                '#endif',

                // Gets the  UV coordinates based on the world X Z position
                'vec2 worldToMapSpace( vec2 worldPosition ) {',
                '	return ( worldPosition / worldScale + 0.5 );',
                '}',


                // Gets the height at a location p (world space)
                'float getHeight( vec3 worldPosition )',
                '{',
                '	#ifdef USE_HEIGHTFIELD',

                '		vec2 heightUv = worldToMapSpace(worldPosition.xz);',
                '		vec2 tHeightSize = vec2( HEIGHTFIELD_SIZE_X, HEIGHTFIELD_SIZE_Y );',

                // If we increase the smoothness factor, the terrain becomes a lot smoother.
                // This is because it has the effect of shrinking the texture size and increaing
                // the texel size. Which means when we do sampling the samples are from farther away - making
                // it smoother. However this means the terrain looks less like the original heightmap and so
                // terrain picking goes a bit off.
                '		float smoothness = 1.1;',
                '		tHeightSize /= smoothness;',

                // The size of each texel
                '		vec2 texel = vec2( 1.0 / tHeightSize );',

                // Find the top-left texel we need to sample.
                '		vec2 heightUv00 = ( floor( heightUv * tHeightSize ) ) / tHeightSize;',

                // Determine the fraction across the 4-texel quad we need to compute.
                '		vec2 frac = vec2( heightUv - heightUv00 ) * tHeightSize;',

                '		float coarseHeight = textureBicubic( heightfield, heightUv00, texel, frac );',
                '		return altitude * coarseHeight + heightOffset;',
                '	#else',
                '		return 0.0;',
                '	#endif',
                '}',

                // Gets the normal at a location p
                'vec3 getNormal( vec3 pos, float morphFactor ) ',
                '{',
                // Get 2 vectors perpendicular to the unperturbed normal, and create at point at each (relative to position)
                '	float delta = ( morphFactor + 1.0 ) * uScale / TILE_RESOLUTION;',
                '	vec3 dA = delta * normalize( cross( normal.yzx, normal ));',
                '	vec3 dB = delta * normalize( cross( normal, dA ));',
                '	vec3 p = pos;',
                '	vec3 pA = pos + dA;',
                '	vec3 pB = pos + dB;',

                // Now get the height at those points
                '	float h = getHeight(pos);',
                '	float hA = getHeight(pA);',
                '	float hB = getHeight(pB);',

                // Update the points with their correct heights and calculate true normal
                '	p += normal * h;',
                '	pA += normal * hA;',
                '	pB += normal * hB;',
                '	return normalize( cross( pA - p, pB - p ) );',
                '}',


                // This essentially checks to see which morph edge this tile represents. Because
                // its a bitwise operation you can check for multipe enums. I.e. if a tile was tagged as EGDE_MORPH_LEFT | EGDE_MORPH_TOP, this
                // function will return true if its checked against EGDE_MORPH_LEFT or EGDE_MORPH_TOP, but nothing else.
                'bool edgePresent( int edge )',
                '{',
                '	int e = uEdgeMorph / edge;',
                '	return 2 * ( e / 2 ) !== e;',
                '}',


                // At the edges of tiles, morph the vertices if they are joining onto a higher layer.
                // The closer a vertex is to the edge, the higher the value returned will be. If the tile has an uEdgeMorph
                // of EGDE_MORPH_LEFT, and its x value is 0 then then the value returned will be 1. If the
                // value of x was === MORPH_REGION (which is the max distance from the edge before morphing) then it would be 0.
                // This function tells you how much the vertex needs to morph. Vertices away from the edge will return 0, but those
                // closer to edges will be higher.
                'float calculateMorph( vec3 p ) ',
                '{',
                '	float morphFactor = 0.0;',

                '	if ( edgePresent( EGDE_MORPH_TOP ) && p.z >= 1.0 - MORPH_REGION )',
                '	{',
                '		float m = 1.0 - clamp( ( 1.0 - p.z ) / MORPH_REGION, 0.0, 1.0 );',
                '		morphFactor = max( m, morphFactor );',
                '	}',
                '	if ( edgePresent( EGDE_MORPH_LEFT ) && p.x <= MORPH_REGION )',
                '	{',
                '		float m = 1.0 - clamp( p.x / MORPH_REGION, 0.0, 1.0 );',
                '		morphFactor = max( m, morphFactor );',
                '	}',
                '	if ( edgePresent( EGDE_MORPH_BOTTOM ) && p.z <= MORPH_REGION )',
                '	{',
                '		float m = 1.0 - clamp( p.z / MORPH_REGION, 0.0, 1.0 );',
                '		morphFactor = max( m, morphFactor );',
                '	}',
                '	if ( edgePresent( EGDE_MORPH_RIGHT ) && p.x >= 1.0 - MORPH_REGION )',
                '	{',
                '		float m = 1.0 - clamp( ( 1.0 - p.x ) / MORPH_REGION, 0.0, 1.0 );',
                '		morphFactor = max( m, morphFactor );',
                '	}',

                '	return morphFactor;',
                '}',

                'void main()',
                '{',
                '	vec3 pos;',

                // Morph factor tells us how close we are to next level.
                // 0.0 is this level
                // 1.0 is next level
                '	float morphFactor = calculateMorph(position);',

                // Move into correct place by scaling the vert based on the scale and offset of the tile
                // Remember that the geometry for each tile is no larger than 1 unit wide and deep
                '	pos = uScale * position + vec3(uTileOffset.x, 0.0, uTileOffset.y) + vec3(camPosition.x, 0.0, camPosition.z);',

                // Snap to grid
                '	float grid = uScale / TILE_RESOLUTION;',
                '	pos = floor( pos / grid ) * grid;',

                // Morph between zoom layers
                '	if ( morphFactor > 0.0 )',
                '	{',
                // Get position that we would have if we were on higher level grid
                '		grid = 2.0 * grid;',
                '		vec3 position2 = floor( pos / grid ) * grid;',

                // Linearly interpolate the two, depending on morph factor
                '		pos = mix( pos, position2, morphFactor );',
                '	}',


                // Get height and calculate normal
                '	pos = pos + normal * getHeight( pos );',

                // For reflection clipping
                '	vEyePosition = modelViewMatrix * vec4( pos, 1.0 );',

                '	gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );',

                '	vUv = worldToMapSpace(pos.xz) * tileScale;',
                '	vHeight = pos.y;',

                // We need to add the pass data
                '	#ifdef PASS_GBUFFER2',
                '		normalView = normalMatrix * getNormal( pos, morphFactor );',
                '		vNormal = normal;',
                '		#ifdef USE_BUMPMAP',
                '			vec4 mvPosition;',
                '			mvPosition = modelViewMatrix * vec4( pos, 1.0 );',
                '			vViewPosition = -mvPosition.xyz;',
                '		#endif',
                '		clipPos = gl_Position;',
                '	#endif',

                '	#ifdef REFLECTION_MAP',
                '		mirrorCoord = textureMatrix * vec4( pos, 1.0 );',
                '	#endif',
                '}'

            ].join( '\n' );
        }

		/**
		* Create the fragment shader
		* @returns {string}
		*/
        getFragmentShader(): string {
            return [

                // Declarations
                ShaderFragments.FragParams.defaults(),
                ShaderFragments.FragParams.clippingParams(),
                ShaderFragments.FragParams.map(),
                ShaderFragments.FragParams.bumpmapUniforms(),
                ShaderFragments.FragParams.bumpmapFunctions(),
                ShaderFragments.FragParams.vecToFloat(),
                ShaderFragments.FragParams.encodeNormal(),

                '	#ifdef USE_BUMPMAP',
                '		uniform float bumpDistance;',
                '	#endif',

                '#ifdef PASS_GBUFFER',
                ShaderFragments.FragParams.environmentMapping(),
                '	uniform vec3 diffuse;',
                '	uniform vec3 specular;',
                '	uniform vec3 emissive;',
                '#endif',

                // Used when sampling the heightfield. Higher values mean vaster terrain
                'uniform float worldScale;',
                'varying vec2 vUv;',
                'varying float vHeight;',

                '#ifdef USE_HEIGHTFIELD ',
                '	#ifdef PASS_GBUFFER2',
                '		uniform sampler2D heightfield;',
                '	#endif',
                '#endif\n\n',


                'vec2 worldToMapSpace( vec2 worldPosition ) {',
                '	return ( worldPosition / worldScale + 0.5 );',
                '}',

                '#ifdef PASS_GBUFFER2',
                '	uniform vec3 topColor;',
                '	uniform vec3 bottomColor;',
                '	uniform float shininess;',
                '#endif',

                'void main()',
                '{',

                ShaderFragments.FragMain.clippingTest(),

                '	#ifdef PASS_GBUFFER \n',

                '		gl_FragColor = vec4( diffuse, 1.0 );',
                '		float specularStrength = 1.0;',

                //		diffuse color in x
                '		gl_FragColor.x = vec3_to_float( gl_FragColor.xyz );',

                //		specular color in y
                '		gl_FragColor.y = vec3_to_float( specular * specularStrength );',

                //		translucency stored in z
                ShaderFragments.FragMain.packTranslucency(),

                //		We store the emmsive in w
                '		gl_FragColor.w = vec3_to_float( emissive );',

                '	#endif',


                '	#ifdef PASS_GBUFFER2',

                '		vec4 texelColor = vec4( 1.0,  1.0,  1.0, 1.0 );',
                '		gl_FragColor = vec4( texelColor );',

                '		' + ShaderFragments.FragMain.alphaTest(),

                '		vec3 normal = normalize( normalView );',

                //		Colors
                '		vec3 heightColors = bottomColor;',
                '		heightColors = mix( heightColors, topColor, smoothstep( 0.0, 10.0, vHeight ) );',
                '		texelColor.rgb *= heightColors;',


                //		Get the depth from 0 to 1
                '		float normalizedDepth = clipPos.z / cameraFar;',

                '		#ifdef USE_BUMPMAP',

                '			if ( normalizedDepth < bumpDistance )',
                '			{ ',
                '				vec3 detailNormal = vec3(0.0, 1.0, 0.0);',

                '				#ifdef TERRAIN_TEX_BASE',
                '					detailNormal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd( uvTiledBase, tDiffuseBase, tileScale ) ) * (4.0 - ( tvSplat.x + tvSplat.y + tvSplat.z + tvSplat.w ) );',
                '				#endif',

                '				detailNormal = normalize( detailNormal );',

                '				float bumpLerp = normalizedDepth / bumpDistance;',
                '				normal = mix( detailNormal, normal, bumpLerp );',
                '			} ',

                '			if ( normalizedDepth > rockDistance )',
                '				normal =  mix( perturbNormalArb( -vViewPosition, normal, dHdxy_fwd( repeatOverlayRock * vUv, bumpMap, rockScale ) ), normal, (1.0 - normalizedDepth) / ( 1.0 - rockDistance ) );',

                '		#endif',

                //		Normal in XYZ
                '		gl_FragColor.x = vec3_to_float( normal * 0.5 + 0.5 );',

                //		Map in Y
                '		gl_FragColor.y = vec3_to_float( texelColor.xyz );',

                //		Reflection map...
                '		#ifdef REFLECTION_MAP',

                '			vec3 worldToEye = cameraPosition - vEyePosition.xyz;',
                '			vec3 eyeDirection = normalize(worldToEye);',

                '			vec4 distortion = vec4( normal.x / mirrorDistortion, 0.0, normal.z / mirrorDistortion, 0.0 );',


                '			float theta1 = max(dot(eyeDirection, normal), 0.0);',
                '			float rf0 = 0.02;',
                '			float reflectance = rf0 + (1.0 - rf0) * pow((1.0 - theta1), 5.0);',
                '			vec3 mirrorSample = texture2DProj(reflectionSampler, mirrorCoord + distortion).xyz;',
                '			gl_FragColor.y = vec3_to_float( mix( texelColor.xyz, mirrorSample, reflectance ) );',

                '		#endif',


                //		Depth in Z
                '		gl_FragColor.z = normalizedDepth;',

                //		FREE, Opacity, shininess
                '		gl_FragColor.w = vec3_to_float( vec3( 0.0, opacity, shininess ) );',

                '	#endif',

                '}'

            ].join( '\n' );
        }

		/*
		* Gets or sets the texture map of this material
		* @param {Texture} val
		* @returns {Texture}
		*/
        heightmap( val?: Texture ): Texture {
            if ( val === undefined ) return this._heightfield;

            this.removeDefine( '#define HEIGHTFIELD_SIZE_X ' + this._prevWidth.toFixed( 1 ) );
            this.removeDefine( '#define HEIGHTFIELD_SIZE_Y ' + this._prevHeight.toFixed( 1 ) );

            if ( this._heightfield && val ) {
                this._heightfield = val;
                this.setUniform( 'heightfield', val, true );

                this._prevWidth = val.width;
                this._prevHeight = val.height;
                this.addDefine( '#define HEIGHTFIELD_SIZE_X ' + this._prevWidth.toFixed( 1 ) );
                this.addDefine( '#define HEIGHTFIELD_SIZE_Y ' + this._prevHeight.toFixed( 1 ) );
                return val;
            }
            if ( !this._heightfield && val ) {
                this._heightfield = val;
                this.addUniform( new UniformVar( 'heightfield', Trike.UniformType.TEXTURE, val ) );
                this.addDefine( ShaderDefines.USE_HEIGHTFIELD );

                this._prevWidth = val.width;
                this._prevHeight = val.height;
                this.addDefine( '#define HEIGHTFIELD_SIZE_X ' + this._prevWidth.toFixed( 1 ) );
                this.addDefine( '#define HEIGHTFIELD_SIZE_Y ' + this._prevHeight.toFixed( 1 ) );

                this.addUniform( new UniformVar( 'altitude', Trike.UniformType.FLOAT, this._altitude ) );
                this.addUniform( new UniformVar( 'heightOffset', Trike.UniformType.FLOAT, this._heightOffset ) );
            }
            else {
                this._heightfield = null;
                this.removeUniform( 'heightfield' );
                this.removeUniform( 'altitude' );
                this.removeUniform( 'heightOffset' );
                this.removeDefine( ShaderDefines.USE_HEIGHTFIELD );
            }

            return val;
        }

		/*
		* Gets or sets the texture matrix of this material for reflective textures
		* @param {Matrix4}  val
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

            if ( val ) {
                material.addUniform( new UniformVar( 'reflectionSampler', Trike.UniformType.TEXTURE ) );
                material.addUniform( new UniformVar( 'textureMatrix', Trike.UniformType.MAT4 ) );
                material.addUniform( new UniformVar( 'mirrorDistortion', Trike.UniformType.FLOAT, this._mirrorDistortion ) );
                material.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 0 ) );
                material.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 0 ) );
                material.addUniform( new UniformVar( 'invProjectionMatrix', Trike.UniformType.MAT4 ) );
                material.addDefine( ShaderDefines.REFLECTION_MAP );
            }
            else {
                material.removeUniform( 'reflectionSampler' );
                material.removeUniform( 'viewWidth' );
                material.removeUniform( 'viewHeight' );
                material.removeUniform( 'textureMatrix' );
                material.removeUniform( 'mirrorDistortion' );
                material.removeUniform( 'invProjectionMatrix' );
                material.removeDefine( ShaderDefines.REFLECTION_MAP );
            }
        }

		/**
        * Gets or sets the texture map of this material
        * @param {RenderTarget} val [Optional]
		* @returns {RenderTarget}
        */
        reflectionMap( val?: RenderTarget ): RenderTarget {
            if ( val === undefined ) return this._reflectionMap;

            const material = this.materials[ PassType.GBuffer ];

            if ( this._reflectionMap && val ) {
                this._reflectionMap = val;
                material.setUniform( 'reflectionSampler', val, true );
            }
            else if ( !this._reflectionMap && val ) {
                this._reflectionMap = val;
                this.mirrorReflection( true );
            }
            else {
                this._reflectionMap = null;
                this.mirrorReflection( false );
            }

            return this._reflectionMap;
        }

		/*
		* Gets or sets the mirror distortion
		* @param {number} val [Optional]
		* @returns {number}
		*/
        mirrorDistortion( val?: number ): number {
            if ( val === undefined ) return this._mirrorDistortion;

            this._mirrorDistortion = val;
            if ( this._reflectionMap )
                this.materials[ PassType.GBuffer ].setUniform( 'mirrorDistortion', val, false );

            return this._mirrorDistortion;
        }

		/**
		* Gets the top color multiplier. This affects the highest altitude only if heightColors is true.
		* Tweak this with heightColorsMin, heightColorsMid and heightColorsMaxAltitude variables.
		* @returns {Color} val
		*/
        get topColor(): Color { return this._topColor; }

		/**
		* Sets the top color multiplier. This affects the highest altitude only if heightColors is true.
		* Tweak this with heightColorsMin, heightColorsMid and heightColorsMaxAltitude variables.
		* @param {Color} val
		*/
        set topColor( val: Color ) {
            this._topColor = val;
            const material = this.materials[ PassType.GBuffer2 ];
            material.setUniform( 'topColor', val, false );
        }

		/**
		* Gets the bottom color multiplier. This affects the highest altitude only if heightColors is true.
		* Tweak this with heightColorsMin, heightColorsMid and heightColorsMaxAltitude variables.
		* @returns {Color} val
		*/
        get bottomColor(): Color { return this._bottomColor; }

		/**
		* Sets the bottom color multiplier. This affects the highest altitude only if heightColors is true.
		* Tweak this with heightColorsMin, heightColorsMid and heightColorsMaxAltitude variables.
		* @param {Color} val
		*/
        set bottomColor( val: Color ) {
            this._bottomColor = val;
            const material = this.materials[ PassType.GBuffer2 ];
            material.setUniform( 'bottomColor', val, false );
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