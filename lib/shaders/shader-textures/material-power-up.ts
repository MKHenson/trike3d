namespace Trike {
	/**
	* White glowing beams that look like a power up
	* See http://glslsandbox.com/e#17459.0
	* KSHIRO51
	*/
    export class MaterialPowerUp extends MaterialMulti {
        private _glowStrength: number;

		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Power up', this );

            this._glowStrength = 0;

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );

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
				uniform float timeConst;
				uniform vec3 color;

				void main(void)
				{
					float c = 0.0;
					c += GLOW_STRENGTH / clamp(length(vSurface), 0.15, 1.0);
					c += 0.015 / (length(vSurface));
					c += 0.005 / (length(vSurface + vec2(+sin(timeConst * 2.0), 0.0) * 0.5)); //derecha
					c += 0.005 / (length(vSurface + vec2(0.0, -sin(timeConst * 2.0)) * 0.5)); //arriba
					c += 0.005 / (length(vSurface + vec2(sin(timeConst * 2.0), 0.0) * 0.5)); //izquierda
					c += 0.005 / (length(vSurface + vec2(0.0, sin(timeConst * 2.0)) * 0.5)); //abajo
					c += 0.013 / (length(vSurface.x - vSurface.y));
					c += 0.013 / (length(vSurface.x + vSurface.y));
					c += 0.020 / (length(vSurface + vec2(-sin(timeConst * 2.0), -sin(timeConst * 2.0)) * 0.5)); //izquierda abajo
					c += 0.020 / (length(vSurface + vec2(sin(timeConst * 2.0), -sin(timeConst * 2.0)) * 0.5)); //derecha abajo
					c += 0.010 / (length(vSurface + vec2(sin(timeConst * 2.0), sin(timeConst * 2.0)) * 0.5)); //derecha arriba
					c += 0.010 / (length(vSurface + vec2(-sin(timeConst * 2.0), sin(timeConst * 2.0)) * 0.5)); //izquierda arriba
					gl_FragColor =  vec4(color * vec3(c, c, c) * vec3(0.8, 0.75, 1.0), 1.0);
				}
			`
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
		* Gets the glow strength of the beam
		* @returns {number}
		*/
        get glowStrength(): number { return this._glowStrength; }

		/**
		* Sets the glow strength of the beam
		* @param {number} val
		*/
        set glowStrength( val: number ) {
            this.removeDefine( '#define GLOW_STRENGTH ' + this._glowStrength.toFixed( 3 ) );
            this._glowStrength = val;
            this.addDefine( '#define GLOW_STRENGTH ' + this._glowStrength.toFixed( 3 ) );
        }
    }
}
