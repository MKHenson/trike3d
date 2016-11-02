namespace Trike {
	/**
	* Draws a cell like material
	*/
    export class MaterialCells extends MaterialMulti {
		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Cells', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'resolution', Trike.UniformType.FLOAT2, new Vec2( width, height ) ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'frequency', Trike.UniformType.FLOAT, 10 ), true );
            this.addUniform( new UniformVar( 'period', Trike.UniformType.FLOAT, 1.0 ), true );


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
				uniform float period;
				uniform float frequency;

				// animated voronoi texture
				// thank you internet for this random function
				vec2 rand22(in vec2 p)
				{
					return fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));
				}

				// i just faked the vec3 version frin the one above by adding random numbers, no idea if it's 'correct'
				vec3 rand33(in vec3 p)
				{
					return fract(vec3(sin(p.x * 591.32 + p.y * 154.077 + p.z * 712.223), cos(p.x * 391.32 + p.y * 49.077 + p.z * 401.326), cos(p.x * 1010.22 + p.y * 27.311 + p.z * 131.44)));
				}

				float dst(vec3 r)
				{
					// return max(abs(r.x), abs(r.y));
					return length(r);
				}

				vec3 voronoi(in vec3 x)
				{
					vec3 n = floor(x); // grid cell id
					vec3 f = fract(x); // grid internal position
					vec3 mg; // shortest distance...
					vec3 mr; // ..and second shortest distance
					float md = 5.0, md2 = 1.0;
					for(int j = -1; j <= 1; j ++)
					{
						for(int i = -1; i <= 1; i ++)
						{
							for(int k = -1; k <= 1; k ++)
							{
								vec3 g = vec3(float(i), float(j), float(k)); // cell id
								vec3 o = rand33(n + g); // offset to edge point
								vec3 r = g + o - f;

								float d = dst(r); // distance to the edge

								if(d < md)
								{
									md2 = md; md = d;
									mr = r; mg = g;
								}
								else if(d < md2)
								{
									md2 = d;
								}
							}
						}
					}
					return vec3((n + mg).xy, md);
				}

				void main(void )
				{
					vec2 position = (gl_FragCoord.xy / resolution.xy);
					gl_FragColor = vec4(vec3(voronoi(vec3(position * frequency, timeConst * period )).z), 1.0);
					gl_FragColor.rgb = (vec3(1.0, 1.0, 1.0) - gl_FragColor.rgb) * color;
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
    }
}
