namespace Trike {
    export enum TechnoType {
        Circuit,
        Organic
    }

	/**
	* Draws a matrix / electric effect
	* See http://glslsandbox.com/e#18217.0
	*/
    export class MaterialTechno extends MaterialMulti {
        private _intensity: number;
        private _numOctaves: number;
        private _bluriness: number;
        private _frequency: number;
        private _type: TechnoType;

		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Techno', this );

            this._intensity = 0;
            this._numOctaves = 0;
            this._bluriness = 0;
            this._frequency = 0;
            this._type = TechnoType.Circuit;

            this.intensity = 0.6;
            this.numOctaves = 3.0;
            this.bluriness = 0.3;
            this.frequency = 3.0;


            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'resolution', Trike.UniformType.FLOAT2, new Vec2( width, height ) ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );

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
				uniform vec3 color;
				uniform vec2 resolution;

				// rotate position around axis
				vec2 rotate(vec2 p, float a)
				{
					return vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));
				}

				// 1D random numbers
				float rand(float n)
				{
					return fract(sin(n) * 43758.5453123);
				}

				// 2D random numbers
				vec2 rand2(in vec2 p)
				{
					#ifdef CIRCUIT
						return fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));
					#else
						return fract(vec2(sin(p.x * 274.32 + p.y * 454.077 + timeConst), cos(p.x * 191.32 + p.y * 490.077 + timeConst)));
					#endif
				}

				// 1D noise
				float noise1(float p)
				{
					float fl = floor(p);
					float fc = fract(p);
					return mix(rand(fl), rand(fl + 1.0), fc);
				}

				// voronoi distance noise, based on iq's articles
				float voronoi(in vec2 x)
				{
					vec2 p = floor(x);
					vec2 f = fract(x);

					vec2 res = vec2(9.0);
					for(int j = -1; j <= 1; j ++)
					{
						for(int i = -1; i <= 1; i ++)
						{
							vec2 b = vec2(i, j);
							vec2 r = vec2(b) - f + rand2(p + b);

							// chebyshev distance, one of many ways to do this
							float d = max(abs(r.x), abs(r.y));

							if(d < res.x)
							{
								res.y = res.x;
								res.x = d;
							}
							else if(d < res.y)
							{
								res.y = d;
							}
						}
					}
					return res.y - res.x;
				}

				float flicker = noise1(timeConst * 1.0) * 0.8 + 0.;

				void main(void)
				{
					vec2 uv = gl_FragCoord.xy / resolution.xy;
					uv = (uv - 0.5) * 2.0;
					vec2 suv = uv;
					uv.x *= resolution.x / resolution.y;
					float v = 0.0;
					uv = rotate(uv, sin(0.0 * 0.3) * 1.0);

					// add some noise octaves
					float a = INTENSITY, f = 1.0;

					for (int i = 0; i < NUM_OCTAVES; i++) // 4 octaves also look nice, its getting a bit slow though
					{
						float v1 = voronoi(uv * f + 5.0);
						float v2 = 0.0;

						// make the moving electrons-effect for higher octaves
						if (i > 0)
						{
							// of course everything based on voronoi
							v2 = voronoi(uv * f * 0.5 + 50.0 + timeConst);

							float va = 0.0, vb = 0.0;
							va = 1.0 - smoothstep(0.0, 0.11, v1);
							#ifdef CIRCUIT
							vb = 1.0 - smoothstep(0.0, 0.09, v2);
							#else
							vb = 1.0 - smoothstep(0.0, 0.98, v2);
							#endif

							v += a * pow(va * (0.5 + vb), 2.0);
						}

						// make sharp edges
						v1 = 1.0 - smoothstep(0.0, BLURINESS, v1);

						// noise is used as intensity map
						v2 = a * (noise1(v1 * 5.5 + 0.1));

						// octave 0's intensity changes a bit
						if (i === 0)
							v += v2 * flicker;
						else
							v += v2;

						f *= FREQUENCY;
						a *= 0.7;
					}

					// slight vignetting
					v *= exp(-0.6 * length(suv)) * 1.2;

					// old blueish color set
					vec3 cexp = vec3(1.0, 1.0, 1.0);
					cexp *= 1.3;

					vec3 col = vec3(pow(v, cexp.x), pow(v, cexp.y), pow(v, cexp.z)) * 2.0;
					col *= color;

					gl_FragColor = vec4(col, 1.0);
				}
			`
        }


		/**
		* Gets the drop color
		* @returns {Color}
		*/
        get color(): Color { return this.materials[ PassType.Texture ]._uniforms[ 'color' ].value; }

		/**
		* Sets the drop color
		* @param {Color} val
		*/
        set color( val: Color ) { this.materials[ PassType.Texture ].setUniform( 'color', val ); }


		/**
		* Gets the frequency
		* @returns {TechnoType}
		*/
        get type(): TechnoType { return this._type; }

		/**
		* Sets the frequency
		* @param {TechnoType} val
		*/
        set type( val: TechnoType ) {
            this.removeDefine( '#define CIRCUIT' );
            this._type = val;
            if ( val === TechnoType.Circuit )
                this.addDefine( '#define CIRCUIT' );
        }


		/**
		* Gets the frequency
		* @returns {number}
		*/
        get frequency(): number { return this._frequency; }

		/**
		* Sets the frequency
		* @param {number} val
		*/
        set frequency( val: number ) {
            this.removeDefine( '#define FREQUENCY ' + this._frequency.toFixed( 3 ) );
            this._frequency = val;
            this.addDefine( '#define FREQUENCY ' + this._frequency.toFixed( 3 ) );
        }


		/**
		* Gets the bluriness
		* @returns {number}
		*/
        get bluriness(): number { return this._bluriness; }

		/**
		* Sets the bluriness
		* @param {number} val
		*/
        set bluriness( val: number ) {
            this.removeDefine( '#define BLURINESS ' + this._bluriness.toFixed( 3 ) );
            this._bluriness = val;
            this.addDefine( '#define BLURINESS ' + this._bluriness.toFixed( 3 ) );
        }


		/**
		* Gets the number of octaves to use. Should not go over 4. Ideally 3
		* @returns {number}
		*/
        get numOctaves(): number { return this._numOctaves; }

		/**
		* Sets the number of octaves to use. Should not go over 4. Ideally 3
		* @param {number} val
		*/
        set numOctaves( val: number ) {
            this.removeDefine( '#define NUM_OCTAVES ' + this._numOctaves.toFixed( 0 ) );
            this._numOctaves = val;
            this.addDefine( '#define NUM_OCTAVES ' + this._numOctaves.toFixed( 0 ) );
        }


		/**
		* Gets the intensity of the techno lines
		* @returns {number}
		*/
        get intensity(): number { return this._intensity; }

		/**
		* Sets the intensity of the techno lines
		* @param {number} val
		*/
        set intensity( val: number ) {
            this.removeDefine( '#define INTENSITY ' + this._intensity.toFixed( 3 ) );
            this._intensity = val;
            this.addDefine( '#define INTENSITY ' + this._intensity.toFixed( 3 ) );
        }
    }
}
