namespace Trike {
	/**
	* Draws a flowing electric pattern
	* See http://glslsandbox.com/e#18940.3
	*/
    export class MaterialVoltWaves extends MaterialMulti {
        private _waveCount: number;
        private _period: number;
        private _intensity: number;
        private _amplitude: number;

		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Volt Waves', this );

            this._intensity = 0;
            this._waveCount = 0;
            this._period = 0;
            this._amplitude = 0;

            this.waveCount = 2.0;
            this.period = 1.0;
            this.intensity = 2.0;
            this.amplitude = 0.5;

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

				void main(void )
				{
					vec2 p = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;
					vec3 c = vec3(0.0);
					float amplitude = AMPLITUDE;
					float t = timeConst * PERIOD;
					float glowT = sin(t) * 0.5 + 0.5;
					float glowFactor = mix(0.15, 0.35, glowT) * INTENSITY;

					for (float i = 0.0; i < NUM_WAVES; i++ )
					{
						c += vec3(0.02, 0.03, 0.13) * (glowFactor * abs(1.0 / sin(p.x + sin(p.y + t + i) * amplitude + i * 0.1)));
						c += vec3(0.02, 0.03, 0.13) * (glowFactor * abs(1.0 / sin(p.y + sin(p.x + t + i) * amplitude + i * 0.1)));
					}
					c *= color;
					gl_FragColor = vec4(c, 1.0);
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
        get period(): number { return this._period; }

		/**
		* Sets the period
		* @param {number} val
		*/
        set period( val: number ) {
            this.removeDefine( '#define PERIOD ' + this._period.toFixed( 3 ) );
            this._period = val;
            this.addDefine( '#define PERIOD ' + this._period.toFixed( 3 ) );
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
    }
}
