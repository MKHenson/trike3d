namespace Trike {
	/**
	* Draws an animated heightmap that resembles ocean noise
	*/
    export class MaterialOceanNoise extends MaterialMulti {
		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Ocean Noise', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'resolution', Trike.UniformType.FLOAT2, new Vec2( width, height ) ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'period', Trike.UniformType.FLOAT, 0.1 ), true );
            this.addUniform( new UniformVar( 'frequency', Trike.UniformType.FLOAT, 0.3 ), true );
            this.addUniform( new UniformVar( 'height', Trike.UniformType.FLOAT, 0.5 ), true );
            this.addUniform( new UniformVar( 'choppiness', Trike.UniformType.FLOAT, 1.5 ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );
            this.addAttribute( new AttributeVar( 'surface', Trike.AttributeType.SURFACE ) );

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
				attribute vec2 surface;
				varying vec2 vSurface;

				void main()
				{
					vSurface = surface;
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
				uniform vec3 color;
				uniform vec2 resolution;
				uniform float period;
				uniform float height;
				uniform float choppiness;
				uniform float frequency;
				varying vec2 vSurface;
				const int ITER_FRAGMENT = 5;

				float hash(vec2 p )
				{
					float h = dot(p, vec2(127.1, 311.7));
					return fract(sin(h) * 43758.5453123);
				}

				float noise( in vec2 p )
				{
					vec2 i = floor(p);
					vec2 f = fract(p);
					vec2 u = f * f * (3.0 - 2.0 * f);
					return -1.0 + 2.0 * mix(mix(hash(i + vec2(0.0, 0.0)),
					hash(i + vec2(1.0, 0.0)), u.x),
					mix(hash(i + vec2(0.0, 1.0)),
					hash(i + vec2(1.0, 1.0)), u.x), u.y);
				}

				// sea
				float sea_octave(vec2 uv, float choppy)
				{
					uv += noise(uv);
					vec2 wv = 1.0 - abs(sin(uv));
					vec2 swv = abs(cos(uv));
					wv = mix(wv, swv, wv);
					return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
				}


				// main
				void main(void)
				{
					vec2 uv = gl_FragCoord.xy / resolution.xy;
					uv = uv * 2.0 - 1.0;
					uv.x *= resolution.x / resolution.y;
					uv *= 1.;
					float t = timeConst + length (vSurface)/sin(length (vSurface)*1e-1) * 1.0;
					vec3 p = vec3(0.0, 3.5, t * 5.0);
					float freq = frequency * 5.0;
					float amp = height * 1.0;
					float choppy = choppiness * 2.0;
					vec2 uv2 = p.xz; uv.x *= 0.75;
					mat2 m = mat2(1.6, 1.2, -1.2, 1.6);

					float d, h = 0.0;
					for(int i = 0; i < ITER_FRAGMENT; i++)
					{
						d = sea_octave((uv + t * period) * freq, choppy);
						d += sea_octave((uv - t * period) * freq, choppy);
						h += d * amp;
						uv *= m; freq *= 1.9; amp *= 0.22;
						choppy = mix(choppy, 1.0, 0.2);
					}

					gl_FragColor = vec4(h, h, h, 1.0);
					gl_FragColor.rgb *= color;
				}
			`
        }


		/**
		* Gets the color
		* @returns {Color}
		*/
        get color(): Color { return this.materials[ PassType.Texture ]._uniforms[ 'color' ].value; }

		/**
		* Sets the color
		* @param {Color} val
		*/
        set color( val: Color ) { this.materials[ PassType.Texture ].setUniform( 'color', val ); }


        /**
		* Gets the period
		* @returns {number}
		*/
        get period(): number { return this.materials[ PassType.Texture ]._uniforms[ 'period' ].value; }

		/**
		* Sets the period
		* @param {number} val
		*/
        set period( val: number ) { this.materials[ PassType.Texture ].setUniform( 'period', val ); }


		/**
		* Gets the frequency
		* @returns {number}
		*/
        get frequency(): number { return this.materials[ PassType.Texture ]._uniforms[ 'frequency' ].value; }

		/**
		* Sets the frequency
		* @param {number} val
		*/
        set frequency( val: number ) { this.materials[ PassType.Texture ].setUniform( 'frequency', val ); }


		/**
		* Gets the height
		* @returns {number}
		*/
        get height(): number { return this.materials[ PassType.Texture ]._uniforms[ 'height' ].value; }

		/**
		* Sets the height
		* @param {number} val
		*/
        set height( val: number ) { this.materials[ PassType.Texture ].setUniform( 'height', val ); }

		/**
		* Gets the choppiness
		* @returns {number}
		*/
        get choppiness(): number { return this.materials[ PassType.Texture ]._uniforms[ 'choppiness' ].value; }

		/**
		* Sets the choppiness
		* @param {number} val
		*/
        set choppiness( val: number ) { this.materials[ PassType.Texture ].setUniform( 'choppiness', val ); }
    }
}
