namespace Trike {
	/**
	* Draws a cloud of stars
	* See http://glslsandbox.com/e#21814.0
	*/
    export class MaterialStars extends MaterialMulti {
		/**
		* Creates an instance of the shader
		*/
        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Stars', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'period', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'frequency', Trike.UniformType.FLOAT, 1 ), true );

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

				// A single iteration of Bob Jenkins' One-At-A-Time hashing algorithm.
				float Rand(vec2 co)
				{
					highp float a = 1552.9898;
					highp float b = 78.233;
					highp float c = 43758.5453;
					highp float dt= dot(co.xy, vec2(a, b));
					highp float sn= mod(dt, 3.14);
					return fract(sin(sn) * c);
				}

				void main()
				{
					float t = timeConst * period;
					vec2 uv = vSurface;
					vec2 tempVec = vec2(0.0);
					vec4 toReturn = vec4(0, 0, 0, 1);
					tempVec.x = Rand(vec2(uv.x, uv.y));
					tempVec.y = Rand(vec2(uv.y, uv.x));

					highp float PowIn = ((sin(((t + 10.0) * tempVec.x * 1.7)) * 0.5) + 0.5) * frequency;
					toReturn.xyz = max(vec3( tempVec.x * pow( tempVec.y, 10.0) * pow(PowIn, 2.0) * 1.0), vec3(0.0)) * color;

					gl_FragColor = toReturn;
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
