namespace Trike {
	/**
	* Draws a rain effect
	* See http://glslsandbox.com/e#17716.0
	*/
    export class MaterialRain extends MaterialMulti {
        private _dropDensity: number;
        private _dropThickness: number;
        private _dropLength: number;
        private _dropFallFactor: number;
        private _dropFallSpeed: number;

		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Rain', this );

            this._dropDensity = 0;
            this._dropThickness = 0;
            this._dropLength = 0;
            this._dropFallFactor = 0;
            this._dropFallSpeed = 0;

            this.dropDensity = 10.0;
            this.dropThickness = 1.0;
            this.dropLength = 1.0;
            this.dropFallFactor = 3.0;
            this.dropFallSpeed = 1.0;

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
					return fract(sin(dot(co.xy, vec2(1.9898, 40.233))) * 6.5453);
				}

				float chr(vec2 outer, vec2 inner)
				{
					vec2 seed = floor(inner * 90.0) + outer.y;
					if (rand(vec2(outer.y, 4.0)) > 0.98)
					seed += floor((timeConst + rand(vec2(outer.y, 5.0))) * 1.0);

					return float(rand(seed) > .2);
				}

				void main( void )
				{
					vec2 position = gl_FragCoord.xy / resolution.xy;
					position.y /= resolution.x / resolution.y;

					float rx = gl_FragCoord.x / DROP_THICKNESS;
					float mx = mod(gl_FragCoord.x, 10.1);
					if (mx > DROP_DENSITY)
						gl_FragColor = vec4(0);
					else
					{
						float x = floor(rx);
						float ry = gl_FragCoord.y + timeConst * rand(vec2(x, 23.0)) * 220.0 * DROP_FALL_SPEED;
						float my = mod(ry, 5.20);
						if (my > DROP_FALL_FACTOR)
							gl_FragColor = vec4(0);
						else
						{
							float y = floor(ry / DROP_LENGTH);
							float b = chr(vec2(rx, floor((ry) / 15.0)), vec2(mx, my) / 12.0);
							float col = max(mod(-y, 60.0) - 0.0, 9.0) / 49.0;
							vec3 c = col < 0.2 ? vec3(0.0, col / 10.8, 0.0) : mix(vec3(0.0, 0.0, 0.0), vec3(1.0), (col - 0.9) / 0.4);
							gl_FragColor = vec4(c * b * color, 1.0);
						}
					}
					gl_FragColor.w = 1.0;
				}
			`
        }

		/**
		* Gets the drop density. Values from 1 to 10 are good
		* @returns {number}
		*/
        get dropDensity(): number { return this._dropDensity; }

		/**
		* Sets the drop density. Values from 1 to 10 are good
		* @param {number} val
		*/
        set dropDensity( val: number ) {
            this.removeDefine( '#define DROP_DENSITY ' + this._dropDensity.toFixed( 3 ) );
            this._dropDensity = val;
            this.addDefine( '#define DROP_DENSITY ' + this._dropDensity.toFixed( 3 ) );
        }

		/**
		* Gets the drop color
		* @returns {Color}
		*/
        get color(): Color { return this.materials[ PassType.Texture ]._uniforms[ 'color' ].value; }

		/**
		* Sets the drop color
		* @param {Color} val
		*/
        set color( val: Color ) { this.materials[ PassType.Texture ].setUniform( 'color', val ); }


		/**
		* Gets the drop thickness
		* @returns {number}
		*/
        get dropThickness(): number { return this._dropThickness; }

		/**
		* Sets the drop thickness
		* @param {number} val
		*/
        set dropThickness( val: number ) {
            this.removeDefine( '#define DROP_THICKNESS ' + this._dropThickness.toFixed( 3 ) );
            this._dropThickness = val;
            this.addDefine( '#define DROP_THICKNESS ' + this._dropThickness.toFixed( 3 ) );
        }


		/**
		* Gets the drop length
		* @returns {number}
		*/
        get dropLength(): number { return this._dropLength; }

		/**
		* Sets the drop length
		* @param {number} val
		*/
        set dropLength( val: number ) {
            this.removeDefine( '#define DROP_LENGTH ' + this._dropLength.toFixed( 3 ) );
            this._dropLength = val;
            this.addDefine( '#define DROP_LENGTH ' + this._dropLength.toFixed( 3 ) );
        }


		/**
		* Gets the drop fall factor. Lower values create snow like effects
		* @returns {number}
		*/
        get dropFallFactor(): number { return this._dropFallFactor; }

		/**
		* Sets the drop fall factor. Lower values create snow like effects
		* @param {number} val
		*/
        set dropFallFactor( val: number ) {
            this.removeDefine( '#define DROP_FALL_FACTOR ' + this._dropFallFactor.toFixed( 3 ) );
            this._dropFallFactor = val;
            this.addDefine( '#define DROP_FALL_FACTOR ' + this._dropFallFactor.toFixed( 3 ) );
        }


		/**
		* Gets the drop fall speed
		* @returns {number}
		*/
        get dropFallSpeed(): number { return this._dropFallSpeed; }

		/**
		* Sets the drop fall speed
		* @param {number} val
		*/
        set dropFallSpeed( val: number ) {
            this.removeDefine( '#define DROP_FALL_SPEED ' + this._dropFallSpeed.toFixed( 3 ) );
            this._dropFallSpeed = val;
            this.addDefine( '#define DROP_FALL_SPEED ' + this._dropFallSpeed.toFixed( 3 ) );
        }
    }
}
