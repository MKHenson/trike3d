namespace Trike {
	/**
	* Draws an thundery cloud effect
	* See http://glslsandbox.com/e#17838.0
	*/
    export class MaterialThunder extends MaterialMulti {
		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Thunder', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'resolution', Trike.UniformType.FLOAT2, new Vec2( width, height ) ), true );
            this.addUniform( new UniformVar( 'contrast', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'period', Trike.UniformType.FLOAT, 1 ), true );
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
				uniform float contrast;
				uniform float intensity;



				float length2(vec2 p)
				{
					return dot(p, p);
				}

				float noise(vec2 p)
				{
					return fract(sin(fract(sin(p.x) * (4313.13311)) + p.y) * 3131.0011);
				}

				float worley(vec2 p)
				{
					float d = 1e30;
					vec2 tp;
					tp = floor(p) + vec2(-1.0, -1.0);
					d = min(d, length2(p - tp - vec2(noise(tp))));
					tp = floor(p) + vec2(0.0, -1.0);
					d = min(d, length2(p - tp - vec2(noise(tp))));
					tp = floor(p) + vec2(1.0, -1.0);
					d = min(d, length2(p - tp - vec2(noise(tp))));

					tp = floor(p) + vec2(-1.0, 0.0);
					d = min(d, length2(p - tp - vec2(noise(tp))));
					tp = floor(p) + vec2(0.0, 0.0);
					d = min(d, length2(p - tp - vec2(noise(tp))));
					tp = floor(p) + vec2(1.0, 0.0);
					d = min(d, length2(p - tp - vec2(noise(tp))));

					tp = floor(p) + vec2(-1.0, 1.0);
					d = min(d, length2(p - tp - vec2(noise(tp))));
					tp = floor(p) + vec2(0.0, 1.0);
					d = min(d, length2(p - tp - vec2(noise(tp))));
					tp = floor(p) + vec2(1.0, 1.0);
					d = min(d, length2(p - tp - vec2(noise(tp))));
					return 3.* exp(-4. * abs(2. * d - 1.));
				}

				float fworley(vec2 p)
				{
					float t = timeConst * period;
					return pow(
					pow(worley(p - t * 1.0), 2.) *
					worley(p * 2. + 1.3 + t * .5) *
					worley(p * 4. + 2.3 + t * -.25) *
					worley(p * 8. + 3.3 + t * .125) *
					worley(p * 32. + 4.3 + t * .125) *
					sqrt(worley(p * 64. + 5.3 + t * -.00625)) *
					pow(worley(p * -128. + 7.3), 1.0 / 4.0), 0.225 * contrast);
				}

				void main()
				{
					vec2 uv = gl_FragCoord.xy / resolution.xy;
					float t = fworley(uv * resolution.xy / 2800.) * intensity;
					t *= exp(-length2(abs(2. * uv - 1.)));
					float r = length(abs(2. * uv - 1.) * resolution.xy);
					gl_FragColor = vec4(t * vec3(1.0 * t, 1.0 * t, 2.0 * t) * color, 1.0);
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
		* Gets the contrast
		* @returns {number}
		*/
        get contrast(): number { return this.materials[ PassType.Texture ]._uniforms[ 'contrast' ].value; }

		/**
		* Sets the contrast
		* @param {number} val
		*/
        set contrast( val: number ) { this.materials[ PassType.Texture ].setUniform( 'contrast', parseInt( val.toString() ) ); }
    }
}
