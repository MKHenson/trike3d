namespace Trike {
	/**
	* Draws animated water beams
	* See http://glslsandbox.com/e#21032.0
	* Ashok Gowtham M
	* UnderWater Caustic lights
	*/
    export class MaterialWaterBeams extends MaterialMulti {
		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Water Beams', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'resolution', Trike.UniformType.FLOAT2, new Vec2( width, height ) ), true );
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
				uniform float frequency;

				// normalized sin
				float sinn(float x)
				{
					return sin(x) / 2. + .5;
				}

				float CausticPatternFn(vec2 pos)
				{
					float t = timeConst * period;
					float f = frequency;
					return (sin(pos.x * 40. + t)
					+ pow(sin(-pos.x * 130. * f + t), 1.)
					+ pow(sin(pos.x * 30. * f + t), 2.)
					+ pow(sin(pos.x * 50. * f + t), 2.)
					+ pow(sin(pos.x * 80. * f + t), 2.)
					+ pow(sin(pos.x * 90. * f + t), 2.)
					+ pow(sin(pos.x * 12. * f + t), 2.)
					+ pow(sin(pos.x * 6. * f + t), 2.)
					+ pow(sin(-pos.x * 13. * f + t), 5.))/2.;
				}

				vec2 CausticDistortDomainFn(vec2 pos)
				{
					float t = timeConst * period;
					pos.x *= (pos.y * .20 + .5);
					pos.x *= 1. + sin(t / 1.) / 10.;
					return pos;
				}

				void main(void )
				{
					vec2 pos = gl_FragCoord.xy / resolution;
					pos -= .5;
					vec2  CausticDistortedDomain = CausticDistortDomainFn(pos);
					float CausticShape = clamp(7. - length(CausticDistortedDomain.x * 20.), 0., 1.);
					float CausticPattern = CausticPatternFn(CausticDistortedDomain);
					float CausticOnFloor = 0.;
					float Caustic;
					Caustic += CausticShape * CausticPattern + 0.01;
					Caustic *= (pos.y + .5) / 4.;
					float f = length(pos + vec2(-.5, .5)) * length(pos + vec2(.5, .5)) * (1. + Caustic) / 1.;
					gl_FragColor = vec4(.1, .5, .6, 1) * (f);
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
		* Gets the period
		* @returns {number}
		*/
        get period(): number { return this.materials[ PassType.Texture ]._uniforms[ 'period' ].value; }

		/**
		* Sets the period
		* @param {number} val
		*/
        set period( val: number ) { this.materials[ PassType.Texture ].setUniform( 'period', val ); }
    }
}
