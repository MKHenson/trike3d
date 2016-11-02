namespace Trike {
	/**
	* Draws a lightning bolt
	* See http://glslsandbox.com/e#17334.0
	*/
    export class MaterialLightning extends MaterialMulti {
		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Lightning', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'resolution', Trike.UniformType.FLOAT2, new Vec2( width, height ) ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'period', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'spread', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'intensity', Trike.UniformType.FLOAT, 1 ), true );

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
				uniform vec3 color;
				uniform float period;
				uniform float spread;
				uniform float intensity;
				float s = 0.0;  // fix glitch noise

				${ShaderFragments.FragParams.saturate()}

				void line(vec2 a , vec2 b, float size )
				{
					vec2 pos = gl_FragCoord.xy / resolution;
					float aspect = resolution.x / resolution.y;
					vec2 lab = a - b, la = pos - a, lb = pos - b;
					lab.x *= aspect; la.x *= aspect; lb.x *= aspect;
					float d = (length(la) + length(lb) - length(lab) + 1e-6)
					* min(length(la), length(lb));
					s = max(size - pow(d * 4.3e8, 0.07), s);
				}


				float rand(vec2 co)
				{
					return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
				}

				float rand2(vec2 p)
				{
					mediump vec2 seed = floor(p * timeConst * period * resolution);
					mediump float rnd1 = fract(cos(seed.x * 8.3e-3 + seed.y) * 4.7e5);
					return rnd1;
				}

				void split(vec2 a , vec2 b)
				{
					for (int j = 1 ; j < 6 ; ++j )
					{
						vec2 t = a;
						vec2 d = (b - a) / float(15);
						for (int i = 1 ; i < 15 ; ++i )
						{
							vec2 v = a + d * float(i);
							if(15-i === j * 2)
							d+=(rand(vec2(float(j), float(j)) + v) - 0.5) * rand(v) * 0.025 * spread;

							v += (rand(v) - 0.5) * d.y;
							line(t, v, float(j) * 0.25 * intensity + 2.0);
							t = v;
						}
					}
				}

				void main(void )
				{
					split ( vec2(0.5,1.0), vec2( 0.5 , 0.0 ) + ( vec2( 1.0, 1.0 ) * rand2(vec2(1.1, 1.2)) * 0.0001 ));
					gl_FragColor = vec4(s - .2, s - 1., s, 1.0);
					gl_FragColor.rgb = saturate( gl_FragColor.rgb, 0.0 ) * color;
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
		* Gets the intensity
		* @returns {number}
		*/
        get intensity(): number { return this.materials[ PassType.Texture ]._uniforms[ 'intensity' ].value; }

		/**
		* Sets the intensity
		* @param {number} val
		*/
        set intensity( val: number ) { this.materials[ PassType.Texture ].setUniform( 'intensity', val ); }

		/**
		* Gets the spread
		* @returns {number}
		*/
        get spread(): number { return this.materials[ PassType.Texture ]._uniforms[ 'spread' ].value; }

		/**
		* Sets the spread
		* @param {number} val
		*/
        set spread( val: number ) { this.materials[ PassType.Texture ].setUniform( 'spread', val ); }
    }
}
