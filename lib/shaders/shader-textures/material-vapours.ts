namespace Trike {
	/**
	* Draws a rising vapour type of effect
	* See http://glslsandbox.com/e#17262.0
	*/
    export class MaterialVapours extends MaterialMulti {
        private _numOctaves: number;

		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Vapours', this );

            this._numOctaves = 0;

            this.numOctaves = 4.0;

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'resolution', Trike.UniformType.FLOAT2, new Vec2( width, height ) ), true );
            this.addUniform( new UniformVar( 'contrast', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'period', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'frequency', Trike.UniformType.FLOAT, 1 ), true );

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
				uniform float contrast;
				uniform float frequency;

				// by @301z
				float rand(vec2 n)
				{
					return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
				}


				float noise(vec2 n)
				{
					const vec2 d = vec2(0.0, 1.0);
					vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
					return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
				}


				float fbm(vec2 n)
				{
					float total = 0.0;
					float c = contrast;
					for (int i = 0; i < NUM_OCTAVES; i++)
					{
						total += noise(n) * c;
						n += n;
						c *= 0.5;
					}
					return total;
				}

				void main()
				{
					const vec3 c1 = vec3(0.6, 0.6, 0.6);
					const vec3 c2 = vec3(0.7, 0.7, 0.7);
					const vec3 c3 = vec3(0.8, 0.8, 0.8);
					const vec3 c4 = vec3(0.9, 0.9, 0.9);
					const vec3 c5 = vec3(0.1);
					const vec3 c6 = vec3(0.9);

					float t = timeConst * period;

					vec2 p = gl_FragCoord.xy * 8.0 / resolution.xx * frequency;
					float q = fbm(p - t * 0.1);
					vec2 r = vec2(fbm(p + q + t * 0.7 - p.x - p.y), fbm(p + q - t * 0.4));
					vec3 c = mix(c1, c2, fbm(p + r)) + mix(c3, c4, r.x) - mix(c5, c6, r.y);
					gl_FragColor = vec4(c * cos( gl_FragCoord.y / resolution.y), 1.0);
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
		* Gets the contrast
		* @returns {number}
		*/
        get contrast(): number { return this.materials[ PassType.Texture ]._uniforms[ 'contrast' ].value; }

		/**
		* Sets the contrast
		* @param {number} val
		*/
        set contrast( val: number ) { this.materials[ PassType.Texture ].setUniform( 'contrast', parseInt( val.toString() ) ); }

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
    }
}
