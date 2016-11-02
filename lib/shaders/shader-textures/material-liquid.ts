namespace Trike {
	/**
	* Draws a liquid effect that's good for water or caustics
	* See http://glslsandbox.com/e#21272.0
	*/
    export class MaterialLiquid extends MaterialMulti {
        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Liquid', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'frequency', Trike.UniformType.FLOAT, 50 ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'period', Trike.UniformType.FLOAT, 1.0 ), true );

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

				varying vec2 vSurface;
				uniform vec3 color;
				uniform float timeConst;
				uniform float frequency;
				uniform float period;


				#define MAX_ITER 16

				${ShaderFragments.FragParams.saturate()}

				void main()
				{
					vec2 sp = vSurface * frequency;//vec2(.4, .7);
					float timeC = (timeConst + sp.x) * period;
					vec2 p = sp * 6.0 - vec2(125.0);
					vec2 i = p;
					float c = 1.0;

					float inten = 0.01;

					float nor = float(MAX_ITER);

					for (int n = 0; n < MAX_ITER; n++)
					{
						float nth = float(n) / nor;
						float t = timeC / 10.0 * (1.0 - (3.0 / float(n + 1))) + ((2. + 4. * nth) * timeC * .33);
						i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
						c += 1.0 / length(vec2(p.x / (sin(i.x + t + timeC * .02) / inten), p.y / (cos(i.y + t - timeC * .021) / inten)));
					}

					c /= pow(float(MAX_ITER), 0.777);
					c = 1.5 - sqrt(c);
					gl_FragColor = vec4(vec3(c * c * c * c), 999.0) + vec4(0.0, 0.3, 0.5, 4.0);
					gl_FragColor.rgb = saturate( gl_FragColor.rgb, 0.0 ) * color;
				}
			`
        }

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
    }
}
