namespace Trike {
	/**
	* Draws an animated flame
	* See http://glslsandbox.com/e#17263.0
	*/
    export class MaterialFlame extends MaterialMulti {
        private _noiseDepth: number;

		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Flame', this );

            this._noiseDepth = 0;
            this.noiseDepth = 3.0;

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'resolution', Trike.UniformType.FLOAT2, new Vec2( width, height ) ), true );
            this.addUniform( new UniformVar( 'offset', Trike.UniformType.FLOAT2, new Vec2( 0, 0 ) ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'period', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'size', Trike.UniformType.FLOAT, 10 ), true );
            this.addUniform( new UniformVar( 'height', Trike.UniformType.FLOAT, 3 ), true );
            this.addUniform( new UniformVar( 'noiseSize', Trike.UniformType.FLOAT, 8 ), true );
            this.addUniform( new UniformVar( 'noiseStrength', Trike.UniformType.FLOAT, 0.25 ), true );


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
				uniform float height;
				uniform float size;
				uniform float noiseSize;
				uniform float noiseStrength;
				uniform float noiseDepth;

				// Perlin noise source code from Stefan Gustavson
				// https://github.com/ashima/webgl-noise/blob/master/src/classicnoise2D.glsl

				${ShaderFragments.FragParams.saturate()}

				vec4 mod289(vec4 x)
				{
					return x - floor(x * (1.0 / 289.0)) * 289.0;
				}

				vec4 permute(vec4 x)
				{
					return mod289(((x * 34.0) + 1.0) * x);
				}

				vec4 taylorInvSqrt(vec4 r)
				{
					return 1.79284291400159 - 0.85373472095314 * r;
				}

				vec2 fade(vec2 t)
				{
					return t* t * t * (t * (t * 6.0 - 15.0) + 10.0);
				}

				// Classic Perlin noise
				float cnoise(vec2 P)
				{
					vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
					vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
					Pi = mod289(Pi); // To avoid truncation effects in permutation
					vec4 ix = Pi.xzxz;
					vec4 iy = Pi.yyww;
					vec4 fx = Pf.xzxz;
					vec4 fy = Pf.yyww;

					vec4 i = permute(permute(ix) + iy);

					vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
					vec4 gy = abs(gx) - 0.5 ;
					vec4 tx = floor(gx + 0.5);
					gx = gx - tx;

					vec2 g00 = vec2(gx.x, gy.x);
					vec2 g10 = vec2(gx.y, gy.y);
					vec2 g01 = vec2(gx.z, gy.z);
					vec2 g11 = vec2(gx.w, gy.w);

					vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
					g00 *= norm.x;
					g01 *= norm.y;
					g10 *= norm.z;
					g11 *= norm.w;

					float n00 = dot(g00, vec2(fx.x, fy.x));
					float n10 = dot(g10, vec2(fx.y, fy.y));
					float n01 = dot(g01, vec2(fx.z, fy.z));
					float n11 = dot(g11, vec2(fx.w, fy.w));

					vec2 fade_xy = fade(Pf.xy);
					vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
					float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
					return 2.3 * n_xy;
				}


				void main(void )
				{
					vec2 position = (vec2(0.5, 0.1) + offset) * resolution.xy;

					// Compute flame area
					vec2 coord;
					if (gl_FragCoord.y > position.y)
						coord = vec2(gl_FragCoord.x, position.y + (gl_FragCoord.y - position.y) / height);
					else
						coord = gl_FragCoord.xy;

					float dist = distance(position, coord) / resolution.y;

					// Compute flame noise
					vec2 noisePosition = noiseSize * (gl_FragCoord.xy - position) / resolution.y - vec2(0.0, period * timeConst);
					float noise = 0.0;
					for (int i = 0; i < NOISE_DEPTH; i++)
					noise += cnoise(noisePosition * pow(2.0, float(i)));

					gl_FragColor = vec4(mix(-size * dist, noise, noiseStrength) + vec3(2.0, 1.5, .5), 1.0);
					gl_FragColor.rgb *= color;
				}
			`
        }

		/**
		* Gets the noise depth. Ideally 3
		* @returns {number}
		*/
        get noiseDepth(): number { return this._noiseDepth; }

		/**
		* Sets the noise depth. Ideally 3
		* @param {number} val
		*/
        set noiseDepth( val: number ) {
            this.removeDefine( '#define NOISE_DEPTH ' + this._noiseDepth.toFixed( 0 ) );
            this._noiseDepth = val;
            this.addDefine( '#define NOISE_DEPTH ' + this._noiseDepth.toFixed( 0 ) );
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
		* Gets the height
		* @returns {number}
		*/
        get height(): number { return this.materials[ PassType.Texture ]._uniforms[ 'height' ].value; }

		/**
		* Sets the height
		* @param {number} val
		*/
        set height( val: number ) { this.materials[ PassType.Texture ].setUniform( 'height', val ); }

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
		* Gets the noise size
		* @returns {number}
		*/
        get noiseSize(): number { return this.materials[ PassType.Texture ]._uniforms[ 'noiseSize' ].value; }

		/**
		* Sets the noise size
		* @param {number} val
		*/
        set noiseSize( val: number ) { this.materials[ PassType.Texture ].setUniform( 'noiseSize', val ); }

		/**
		* Gets the noise strength
		* @returns {number}
		*/
        get noiseStrength(): number { return this.materials[ PassType.Texture ]._uniforms[ 'noiseStrength' ].value; }

		/**
		* Sets the noise strength
		* @param {number} val
		*/
        set noiseStrength( val: number ) { this.materials[ PassType.Texture ].setUniform( 'noiseStrength', val ); }

    }
}
