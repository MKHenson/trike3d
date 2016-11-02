namespace Trike {
	/**
	* Draws a matrix / electric effect
	* See http://glslsandbox.com/e#16402.0
	*/
    export class MaterialSinWaves extends MaterialMulti {
        private _waveCount: number;
        private _frequency: number;
        private _amplitude: number;
        private _intensity: number;

		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Sin Waves', this );

            this._intensity = 0;
            this._amplitude = 0;
            this._waveCount = 0;
            this._frequency = 0;

            this.amplitude = 0.055;
            this.waveCount = 7.0;
            this.frequency = 2.0;
            this.intensity = 3.0;

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

				float rand(vec2 co)
				{
					return fract(sin(dot(co.xy, vec2(12.98, 78.233))) * 43758.5453);
				}

				${ShaderFragments.FragParams.saturate()}

				void main(void )
				{
					vec2 pos = gl_FragCoord.xy / resolution.xy;
					vec2 uPos = pos;
					uPos.y -= 0.5;

					vec3 c = vec3(0.0);
					float vertColor = 0.0;
					const float k = NUM_WAVES;
					for(float i = 1.0; i < k; ++i )
					{
						float t = timeConst * FREQUENCY;

						uPos.y += sin(uPos.x * exp(i) - t) * AMPLITUDE;
						float fTemp = abs(1.0 / (80.0 * k) / uPos.y);
						vertColor += fTemp;
						c += vec3(fTemp * (i * INTENSITY), 0.0, cos(vertColor) * sin(fTemp));
					}

					vec4 color_final = vec4( saturate(c, 0.0), 1.0);
					gl_FragColor = color_final;
					float ft = fract(timeConst);
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
		* Gets the amplitude
		* @returns {number}
		*/
        get amplitude(): number { return this._amplitude; }

		/**
		* Sets the amplitude
		* @param {number} val
		*/
        set amplitude( val: number ) {
            this.removeDefine( '#define AMPLITUDE ' + this._amplitude.toFixed( 3 ) );
            this._amplitude = val;
            this.addDefine( '#define AMPLITUDE ' + this._amplitude.toFixed( 3 ) );
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
		* Gets the number of waves
		* @returns {number}
		*/
        get waveCount(): number { return this._waveCount; }

		/**
		* Sets the number of waves
		* @param {number} val
		*/
        set waveCount( val: number ) {
            this.removeDefine( '#define NUM_WAVES ' + this._waveCount.toFixed( 1 ) );
            this._waveCount = val;
            this.addDefine( '#define NUM_WAVES ' + this._waveCount.toFixed( 1 ) );
        }

		/**
		* Gets the intensity
		* @returns {number}
		*/
        get intensity(): number { return this._intensity; }

		/**
		* Sets the intensity
		* @param {number} val
		*/
        set intensity( val: number ) {
            this.removeDefine( '#define INTENSITY ' + this._intensity.toFixed( 3 ) );
            this._intensity = val;
            this.addDefine( '#define INTENSITY ' + this._intensity.toFixed( 3 ) );
        }
    }
}
