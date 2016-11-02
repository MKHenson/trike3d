namespace Trike {
	/**
	* Draws an electric circuite board
	* See http://glslsandbox.com/e#18940.3
	*/
    export class MaterialCircuit extends MaterialMulti {
		/**
		* Creates an instance of the shader
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		*/
        constructor( width: number, height: number ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Circuit', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'resolution', Trike.UniformType.FLOAT2, new Vec2( width, height ) ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'boardSpeed', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'frequency', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'intensity', Trike.UniformType.FLOAT, 5 ), true );
            this.addUniform( new UniformVar( 'period', Trike.UniformType.FLOAT, 1.0 ), true );
            this.addUniform( new UniformVar( 'boardColor', Trike.UniformType.COLOR3, new Color( 0xcccccc ), true ) );

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
			uniform vec3 boardColor;
			uniform vec2 resolution;
			uniform float period;
			uniform float frequency;
			uniform float boardSpeed;
			uniform float intensity;

			#define PI 3.1415926535897932384626433832795
			#define float2 vec2
			#define float3 vec3
			#define float4 vec4


			float2 circuit(float2 p)
			{
				p = fract(p);
				float r = 0.123;
				float v = 0.0, g = 0.0;
				r = fract(r * 9184.928);
				float cp, d;

				d = p.x;
				g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 1000.0);
				d = p.y;
				g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 1000.0);
				d = p.x - 1.0;
				g += pow(clamp(3.0 - abs(d), 0.0, 1.0), 1000.0);
				d = p.y - 1.0;
				g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 10000.0);

				const int iter = 12;
				for(int i = 0; i < iter; i ++)
				{
					cp = 0.5 + (r - 0.5) * 0.9;
					d = p.x - cp;
					g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 200.0);
					if(d > 0.0)
					{
						r = fract(r * 4829.013);
						p.x = (p.x - cp) / (1.0 - cp);
						v += 1.0;
					}
					else
					{
						r = fract(r * 1239.528);
						p.x = p.x / cp;
					}
					p = p.yx;
				}
				v /= float(iter);
				return float2(g, v);
			}

			void main()
			{
				float scale = 0.5 * frequency;

				float2 uv = gl_FragCoord.xy;
				uv /= resolution.xy;
				uv = uv * 2.0 - 1.0;
				uv.x *= resolution.x / resolution.y;
				uv= uv * scale + float2(0.0, timeConst * period * 0.1) * boardSpeed;
				float2 cid2 = floor(uv);
				float cid = (cid2.y*10.0+cid2.x)*0.1;

				float2 dg = circuit(uv);
				float d = dg.x;
				float3 col1 = (0.2-float3(max(min(d, 2.0)-1.0, 0.0)*2.0*0.25)) * float3(1.0, 1.1, 1.3) * boardColor;
				float3 col2 = float3(max(d-1.0, 0.0)*2.0*0.5) * float3(1.0, 1.2, 1.6) * color;

				float f = max(0.5-mod(uv.y-uv.x*0.3+( timeConst * period * 0.4)+(dg.y*0.4), 2.5), 0.0) * intensity;
				col2 *= f;

				gl_FragColor = vec4(col1+col2, 1.0);
			}
			`
        }


		/**
		* Gets the board color
		* @returns {Color}
		*/
        get boardColor(): Color { return this.materials[ PassType.Texture ]._uniforms[ 'boardColor' ].value; }

		/**
		* Sets the board color
		* @param {Color} val
		*/
        set boardColor( val: Color ) { this.materials[ PassType.Texture ].setUniform( 'boardColor', val ); }

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
		* Gets the intensity
		* @returns {number}
		*/
        get intensity(): number { return this.materials[ PassType.Texture ]._uniforms[ 'intensity' ].value; }

		/**
		* Sets the board speed
		* @param {number} val
		*/
        set boardSpeed( val: number ) { this.materials[ PassType.Texture ].setUniform( 'boardSpeed', val ); }

		/**
		* Gets the board speed
		* @returns {number}
		*/
        get boardSpeed(): number { return this.materials[ PassType.Texture ]._uniforms[ 'boardSpeed' ].value; }

		/**
		* Sets the intensity
		* @param {number} val
		*/
        set intensity( val: number ) { this.materials[ PassType.Texture ].setUniform( 'intensity', val ); }


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
