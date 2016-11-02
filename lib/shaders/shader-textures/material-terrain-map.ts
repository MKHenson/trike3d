namespace Trike {
	/**
	* Draws a terrain heightmap / color map
	* See http://glslsandbox.com/e#20586.0
	* Written by Frank Gennari
	*/
    export class MaterialTerrainMap extends MaterialMulti {
        private _numOctaves: number;

		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Terrain Map', this );

            this._numOctaves = 0;
            this.numOctaves = 8.0;

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'resolution', Trike.UniformType.FLOAT2, new Vec2( width, height ) ), true );

            this.addUniform( new UniformVar( 'colorSnow', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'colorWater', Trike.UniformType.COLOR3, new Color( 0x4174AB ), true ) );
            this.addUniform( new UniformVar( 'colorVegetation', Trike.UniformType.COLOR3, new Color( 0x7DAB41 ), true ) );
            this.addUniform( new UniformVar( 'colorDirt', Trike.UniformType.COLOR3, new Color( 0x8A724D ), true ) );
            this.addUniform( new UniformVar( 'colorRock', Trike.UniformType.COLOR3, new Color( 0x8F8F8F ), true ) );
            this.addUniform( new UniformVar( 'seed', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'waterVal', Trike.UniformType.FLOAT, 0.2 ), true );
            this.addUniform( new UniformVar( 'snowThreshhold', Trike.UniformType.FLOAT, 0.9 ), true );
            this.addUniform( new UniformVar( 'terrainScale', Trike.UniformType.FLOAT, 2.0 ), true );
            this.addUniform( new UniformVar( 'heightBias', Trike.UniformType.FLOAT, 1.0 ), true );
            this.addUniform( new UniformVar( 'heightColors', Trike.UniformType.FLOAT, 1 ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );

            this.setShaders( this.getVertexShader(), this.getFragmentShader() );

            this.depthWrite = false;
            this.depthRead = false;
        }

		/**
		* Create the vertex shader
		* @returns {string}
		*/
        getVertexShader(): string {
            return `
				attribute vec3 position;

				void main()
				{
					gl_Position = vec4( sign( position.xy ), 0.0, 1.0 );
				}
				`
        }

		/**
		* Create the fragment shader
		* @returns {string}
		*/
        getFragmentShader(): string {
            return `

				uniform float timeConst;
				uniform vec2 resolution;

				// to be changed by the user
				uniform vec3 colorSnow;
				uniform vec3 colorRock;
				uniform vec3 colorVegetation;
				uniform vec3 colorDirt;
				uniform vec3 colorWater;
				uniform float seed;
				uniform float waterVal;
				uniform float snowThreshhold;
				uniform float terrainScale;
				uniform float heightBias;
				uniform float heightColors;

				vec3 draw_terrain( in vec2 vertex );

				void main(void)
				{
					float rmin = min(resolution.x, resolution.y);
					vec2 position  = ((gl_FragCoord.xy - 0.5 * resolution.xy) / rmin);
					position.x += seed;
					position.y += seed;
					gl_FragColor = vec4(draw_terrain(position), 1.0);
				}

				// ****************** SIMPLEX NOISE ************************

				vec3 mod289(in vec3 x)
				{
					return x - floor(x * 1.0 / 289.0) * 289.0;
				}

				vec3 permute(in vec3 x)
				{
					return mod289(((x * 34.0) + 1.0) * x);
				}

				float simplex(in vec2 v)
				{
					vec4 C = vec4(
					0.211324865405187,  // (3.0 -  sqrt(3.0)) / 6.0
					0.366025403784439,  //  0.5 * (sqrt(3.0)  - 1.0)
					-0.577350269189626,	 // -1.0 + 2.0 * C.x
					0.024390243902439); //  1.0 / 41.0

					// First corner
					vec2 i  = floor(v + dot(v, C.yy));
					vec2 x0 = v - i + dot(i, C.xx);

					// Other corners
					vec2 i1 = (x0.x > x0.y) ? vec2(1, 0) : vec2(0, 1);
					vec4 x12 = x0.xyxy + C.xxzz;
					x12 = vec4(x12.xy - i1, x12.z, x12.w);

					// Permutations
					i = mod(i, vec2(289)); // Avoid truncation effects in permutation
					vec3 p = permute(permute(i.y + vec3(0, i1.y, 1)) + i.x + vec3(0, i1.x, 1));
					vec3 m = max(vec3(0.5) - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), vec3(0));
					m = m * m;
					m = m * m;

					// Gradients: 41 points uniformly over a line, mapped onto a diamond.
					// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
					vec3 x = 2.0 * fract(p * C.w) - 1.0;
					vec3 h = abs(x) - 0.5;
					vec3 ox = floor(x + 0.5);
					vec3 a0 = x - ox;

					// Normalise gradients implicitly by scaling m
					// Inlined for speed: m *= taylorInvSqrt(a0*a0 + h*h);
					m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

					// Compute final noise value at P
					vec3 g;
					g.x = a0.x * x0.x + h.x * x0.y;
					g.yz = a0.yz * x12.xz + h.yz * x12.yw;
					return 130.0 * dot(m, g);
				}


				// ****************** PROCEDURAL TERRAIN ************************

				float eval_terrain_noise_base(in vec2 npos, const in float gain, const in float lacunarity)
				{
					float val  = 0.0;
					float mag  = 1.0;
					float freq = 0.5; // lower freq for ridged noise

					for (int i = 0; i < NUM_OCTAVES; ++i)
					{
						// similar to gen_cloud_alpha_time()
						float v = simplex(freq * npos);
						v = 2.0 * v - 1.0; // map [0,1] range to [-1,1]
						v = max(0.0,(0.75 - abs(v))); // ridged noise
						val += v * mag;
						freq *= lacunarity;
						mag *= gain;
					}
					return val + heightBias;
				}

				float eval_terrain_noise(in vec2 npos)
				{
					return 0.7 * eval_terrain_noise_base(npos, 0.7, 2.0);
				}

				float eval_terrain_noise_detail(in vec2 npos)
				{
					return eval_terrain_noise_base(npos, 0.5, 1.92);
				}

				vec3 draw_terrain( in vec2 vertex )
				{
					vec2 spos    = vertex * terrainScale;
					float hval   = eval_terrain_noise(spos);
					float height = max(0.0, 1.8 * (hval - 0.7)); // can go outside the [0,1] range
					float nscale = 0.0;
					vec4 texel = vec4(1.0,1.0,1.0,1.0);

					if (heightColors === 1.0 )
					{
						if (height < waterVal)
							texel.rgb = colorWater;
						else
						{
							// Earthlike planet
							nscale = 1.0;
							float height_ws = (height - waterVal) / (1.0 - waterVal); // rescale to [0,1] above water

							if (height_ws < 0.1) { texel.rgb = colorDirt; } // low ground
							else if (height_ws < 0.4) { texel.rgb = mix(colorDirt, colorVegetation, 3.3333 * (height_ws - 0.1)); }
							else if (height_ws < 0.5) { texel.rgb = colorVegetation; } // medium ground
							else if (height_ws < 1.0) { texel.rgb = mix(colorVegetation, colorRock, 2.0 * (height_ws - 0.5)); }
							else { texel.rgb = colorRock; } // high ground
							if (waterVal > 0.0)
							{
								// handle water
								if (height < waterVal + 0.07)
								{
									// close to water line (can have a little water even if water === 0)
									float val = (height - waterVal) / 0.07;
									texel.rgb = mix(colorWater, texel.rgb, val);
									nscale = val * val; // faster falloff
								}
								else if (height_ws > 1.0)
								{
									float sv = 0.5 + 0.5 * clamp(20.0 * (1.0 - snowThreshhold), 0.0, 1.0);
									float mv = eval_terrain_noise_detail(32.0 * spos) * sv * sqrt(height_ws - 1.0);
									float mag= 0.5 * clamp((1.5 * mv * mv - 0.25), 0.0, 1.0);
									texel = mix(texel, vec4(colorSnow, 1), mag); // blend in some snow on peaks
								}
							}
						}
					}
					else
						return vec3(height, height, height);

					return texel.rgb;
				}
			`
        }


		/**
		* Gets the color of snow
		* @returns {Color}
		*/
        get colorSnow(): Color { return this.materials[ PassType.Texture ]._uniforms[ 'colorSnow' ].value; }

		/**
		* Sets the color of snow
		* @param {Color} val
		*/
        set colorSnow( val: Color ) { this.materials[ PassType.Texture ].setUniform( 'colorSnow', val ); }

		/**
		* Gets the color of water
		* @returns {Color}
		*/
        get colorWater(): Color { return this.materials[ PassType.Texture ]._uniforms[ 'colorWater' ].value; }

		/**
		* Sets the color of water
		* @param {Color} val
		*/
        set colorWater( val: Color ) { this.materials[ PassType.Texture ].setUniform( 'colorWater', val ); }

		/**
		* Gets the color of rock
		* @returns {Color}
		*/
        get colorRock(): Color { return this.materials[ PassType.Texture ]._uniforms[ 'colorRock' ].value; }

		/**
		* Sets the color of rock
		* @param {Color} val
		*/
        set colorRock( val: Color ) { this.materials[ PassType.Texture ].setUniform( 'colorRock', val ); }

		/**
		* Gets the color of dirt
		* @returns {Color}
		*/
        get colorDirt(): Color { return this.materials[ PassType.Texture ]._uniforms[ 'colorDirt' ].value; }

		/**
		* Sets the color of dirt
		* @param {Color} val
		*/
        set colorDirt( val: Color ) { this.materials[ PassType.Texture ].setUniform( 'colorDirt', val ); }

		/**
		* Gets the color of vegetation
		* @returns {Color}
		*/
        get colorVegetation(): Color { return this.materials[ PassType.Texture ]._uniforms[ 'colorVegetation' ].value; }

		/**
		* Sets the color of vegetation
		* @param {Color} val
		*/
        set colorVegetation( val: Color ) { this.materials[ PassType.Texture ].setUniform( 'colorVegetation', val ); }



		/**
		* Gets the seed
		* @returns {number}
		*/
        get seed(): number { return this.materials[ PassType.Texture ]._uniforms[ 'seed' ].value; }

		/**
		* Sets the seed
		* @param {number} val
		*/
        set seed( val: number ) { this.materials[ PassType.Texture ].setUniform( 'seed', val ); }

		/**
		* Gets the snow threshold
		* @returns {number}
		*/
        get snowThreshhold(): number { return this.materials[ PassType.Texture ]._uniforms[ 'snowThreshhold' ].value; }

		/**
		* Sets the snow threshold
		* @param {number} val
		*/
        set snowThreshhold( val: number ) { this.materials[ PassType.Texture ].setUniform( 'snowThreshhold', val ); }

        /**
		* Gets the water rise value
		* @returns {number}
		*/
        get waterVal(): number { return this.materials[ PassType.Texture ]._uniforms[ 'waterVal' ].value; }

		/**
		* Sets the water rise value
		* @param {number} val
		*/
        set waterVal( val: number ) { this.materials[ PassType.Texture ].setUniform( 'waterVal', val ); }

		/**
		* Gets the number of octaves to use.
		* @returns {number}
		*/
        get numOctaves(): number { return this._numOctaves; }

		/**
		* Sets the number of octaves to use.
		* @param {number} val
		*/
        set numOctaves( val: number ) {
            this.removeDefine( '#define NUM_OCTAVES ' + this._numOctaves.toFixed( 0 ) );
            this._numOctaves = val;
            this.addDefine( '#define NUM_OCTAVES ' + this._numOctaves.toFixed( 0 ) );
        }

		/**
		* Gets the terrain scale
		* @returns {number}
		*/
        get terrainScale(): number { return this._uniforms[ 'terrainScale' ].value; }

		/**
		* Sets the terrain scale
		* @param {number} val
		*/
        set terrainScale( val: number ) { this.materials[ PassType.Texture ].setUniform( 'terrainScale', val ); }

		/**
		* Gets the terrain bias
		* @returns {number}
		*/
        get heightBias(): number { return this.materials[ PassType.Texture ]._uniforms[ 'heightBias' ].value; }

		/**
		* Sets the terrain height bias
		* @param {number} val
		*/
        set heightBias( val: number ) { this.materials[ PassType.Texture ].setUniform( 'heightBias', val ); }

		/**
		* Gets if the colors are drawn or simply the height map
		* @returns {boolean}
		*/
        get heightColors(): boolean { return ( this._uniforms[ 'heightColors' ].value === 1 ? true : false ); }

		/**
		* Sets if the colors are drawn or simply the height map
		* @param {boolean} val
		*/
        set heightColors( val: boolean ) { this.materials[ PassType.Texture ].setUniform( 'heightColors', ( val ? 1 : 0 ) ); }
    }
}
