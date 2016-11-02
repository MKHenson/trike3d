namespace Trike {
	/**
	* Draws cluters of light orbs
	* See http://glslsandbox.com/e#17172.0
	*/
    export class MaterialOrbs extends MaterialMulti {
        private _numOrbs: number;

		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Orbs', this );

            this._numOrbs = 0;
            this.numOrbs = 4;

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 50 ), true );
            this.addUniform( new UniformVar( 'resolution', Trike.UniformType.FLOAT2, new Vec2( width, height ) ), true );

            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'period', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'frequency', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'glow', Trike.UniformType.FLOAT, 2 ), true );
            this.addUniform( new UniformVar( 'size', Trike.UniformType.FLOAT, 0.3 ), true );
            this.addUniform( new UniformVar( 'contrast', Trike.UniformType.FLOAT, 1 ), true );

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
				uniform float glow;
				uniform float size;
				uniform float contrast;

				float rand(vec2 co)
				{
					return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
				}

				float makePoint(float x, float y, float fx, float fy, float sx, float sy, float t)
				{
					float xx= x + sin(.1 * t * fx) * sx * 1.3;
					float yy= y + cos(.1 * t * fy) * sy * 1.3;
					return (size + 0.3 * sin(t * fx)) / sqrt(xx * xx + yy * yy);
				}

				void main(void )
				{
					vec2 p= (gl_FragCoord.xy / resolution.x) * 2.0 - vec2(1.0, resolution.y / resolution.x);

					p = p * 20.0;
					float x= p.x;
					float y= p.y;
					float a;

					for (float i = 0.0; i < NUM_ORBS; i++ )
					a = a + makePoint(x, y, frequency + rand(vec2(i)), frequency + rand(vec2(i + 3.0)), 9.9 + rand(vec2(i + 7.0)), 9.3 + rand(vec2((i + 11.0))) * 0.1, timeConst * period);

					vec3 a1= vec3(a * .02, a * .015, a * .008);
					gl_FragColor = vec4(a1.x, a1.y, a1.z, 1.0);
					gl_FragColor = smoothstep(0.98 * (1.0 / glow), 1.05, a) * vec4(1.0) + vec4(vec3(a) * (1.0 - contrast), 1.0);
					gl_FragColor.rgb *= color;
				}
			`
        }

		/**
		* Gets the number of orbs
		* @returns {TechnoType}
		*/
        get numOrbs(): number { return this._numOrbs; }

		/**
		* Sets the number of orbs
		* @param {TechnoType} val
		*/
        set numOrbs( val: number ) {
            this.removeDefine( '#define NUM_ORBS ' + this._numOrbs.toFixed( 3 ) );
            this._numOrbs = val;
            this.addDefine( '#define NUM_ORBS ' + this._numOrbs.toFixed( 3 ) );
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
		* Gets the glow
		* @returns {number}
		*/
        get glow(): number { return this.materials[ PassType.Texture ]._uniforms[ 'glow' ].value; }

		/**
		* Sets the glow
		* @param {number} val
		*/
        set glow( val: number ) { this.materials[ PassType.Texture ].setUniform( 'glow', val ); }

		/**
		* Gets the size
		* @returns {number}
		*/
        get size(): number { return this.materials[ PassType.Texture ]._uniforms[ 'size' ].value; }

		/**
		* Sets the size
		* @param {number} val
		*/
        set size( val: number ) { this.materials[ PassType.Texture ].setUniform( 'size', val ); }

		/**
		* Gets the contrast
		* @returns {number}
		*/
        get contrast(): number { return this.materials[ PassType.Texture ]._uniforms[ 'contrast' ].value; }

		/**
		* Sets the contrast
		* @param {number} val
		*/
        set contrast( val: number ) { this.materials[ PassType.Texture ].setUniform( 'contrast', val ); }
    }
}
