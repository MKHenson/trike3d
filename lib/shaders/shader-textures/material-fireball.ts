namespace Trike {
	/**
	* Draws an animated fireball
	* See http://glslsandbox.com/e#21032.0
	*/
    export class MaterialFireball extends MaterialMulti {
		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Fireball', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'resolution', Trike.UniformType.FLOAT2, new Vec2( width, height ) ), true );
            this.addUniform( new UniformVar( 'offset', Trike.UniformType.FLOAT2, new Vec2( 0, 0 ) ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'period', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'size', Trike.UniformType.FLOAT2, new Vec2( 1, 1 ) ), true );
            this.addUniform( new UniformVar( 'coarseness', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'granularity', Trike.UniformType.FLOAT, 16 ), true );
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
                uniform vec2 offset;
                uniform vec3 color;
                uniform float period;
                uniform vec2 size;
                uniform float coarseness;
                uniform float granularity;
                uniform float intensity;

                ${ShaderFragments.FragParams.saturate()}

                float snoise(vec3 uv, float res)
				{
					const vec3 s = vec3(1e0, 1e2, 1e3);

					uv *= res;

					vec3 uv0 = floor(mod(uv, res)) * s;
					vec3 uv1 = floor(mod(uv + vec3(1.), res)) * s;

					vec3 f = fract(uv); f = f * f * (3.0 - 2.0 * f);

					vec4 v = vec4(uv0.x + uv0.y + uv0.z, uv1.x + uv0.y + uv0.z,
					uv0.x + uv1.y + uv0.z, uv1.x + uv1.y + uv0.z);

					vec4 r = fract(sin(v * 1e-1) * 1e3);
					float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

					r = fract(sin((v + uv1.z - uv0.z) * 1e-1) * 1e3);
					float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

					return mix(r0, r1, f.z) * 2. - 1.;
				}

				void main(void )
				{
					vec2 p = -.5 + gl_FragCoord.xy / resolution.xy;
                	p += offset; // offset
					p.x *= resolution.x / resolution.y;
                	p *= 1.0 / size;
					float c = 3.0 - (3. * length(2. * p));

					vec3 coord = vec3(atan(p.x, p.y) / 6.2832 + .5, length(p) * .4, .5);

					for(int i = 1; i <= 7; i++)
					{
						float power = pow(2.0, float(i));
						c += (1.5 * coarseness / power) * snoise(coord + vec3(0., -timeConst * period * .05, timeConst * period * .01), power * granularity);
					}
					gl_FragColor = vec4(c, pow(max(c, 0.), 2.) * 0.4, pow(max(c, 0.), 3.) * 0.15, 1.0);
                	gl_FragColor.xyz *= color * intensity;
				}
			`
        }



		/**
		* Gets the offset
		* @returns {Color}
		*/
        get offset(): Vec2 { return this.materials[ PassType.Texture ]._uniforms[ 'offset' ].value; }

		/**
		* Sets the offset
		* @param {Color} val
		*/
        set offset( val: Vec2 ) { this.materials[ PassType.Texture ].setUniform( 'offset', val ); }

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
		* Gets the size
		* @returns {Vec2}
		*/
        get size(): Vec2 { return this.materials[ PassType.Texture ]._uniforms[ 'size' ].value; }

		/**
		* Sets the size
		* @param {Vec2} val
		*/
        set size( val: Vec2 ) { this.materials[ PassType.Texture ].setUniform( 'size', val ); }

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
		* Gets the coarseness
		* @returns {number}
		*/
        get coarseness(): number { return this.materials[ PassType.Texture ]._uniforms[ 'coarseness' ].value; }

		/**
		* Sets the coarseness
		* @param {number} val
		*/
        set coarseness( val: number ) { this.materials[ PassType.Texture ].setUniform( 'coarseness', val ); }

		/**
		* Gets the granularity
		* @returns {number}
		*/
        get granularity(): number { return this.materials[ PassType.Texture ]._uniforms[ 'granularity' ].value; }

		/**
		* Sets the granularity
		* @param {number} val
		*/
        set granularity( val: number ) { this.materials[ PassType.Texture ].setUniform( 'granularity', parseInt( val.toString() ) ); }
    }
}
