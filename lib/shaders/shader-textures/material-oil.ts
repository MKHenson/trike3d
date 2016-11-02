namespace Trike {
	/**
	* Draws an animated oil puddle
	* See http://glslsandbox.com/e#17589.4
	*/
    export class MaterialOil extends MaterialMulti {
		/**
		* Creates an instance of the shader
		*/
        constructor() {
            //Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Texture ] = new PassMaterial( 'Oil', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'timeConst', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'sharpness', Trike.UniformType.FLOAT, 0.5 ), true );
            this.addUniform( new UniformVar( 'color', Trike.UniformType.COLOR3, new Color( 0xffffff ), true ) );
            this.addUniform( new UniformVar( 'period', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'frequency', Trike.UniformType.FLOAT, 1 ), true );

            //Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );
            this.addAttribute( new AttributeVar( 'surface', Trike.AttributeType.SURFACE ) );

            //Any define macros
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

				uniform float timeConst;
				uniform vec3 color;
				uniform float period;
				uniform float sharpness;
				uniform float frequency;
				varying vec2 vSurface;

				#define ptpi 1385.4557313670110891409199368797 //powten(pi)
				#define pipi  36.462159607207911770990826022692 //pi pied, pi^pi
				#define picu  31.006276680299820175476315067101 //pi cubed, pi^3
				#define pepi  23.140692632779269005729086367949 //powe(pi);
				#define chpi  11.59195327552152062775175205256  //cosh(pi)
				#define shpi  11.548739357257748377977334315388 //sinh(pi)
				#define pisq  9.8696044010893586188344909998762 //pi squared, pi^2
				#define twpi  6.283185307179586476925286766559  //two pi, 2*pi
				#define pi    3.1415926535897932384626433832795 //pi
				#define ttpi  2.0943951023931954923084289221863 //pi
				#define sqpi  1.7724538509055160272981674833411 //square root of pi
				#define hfpi  1.5707963267948966192313216916398 //half pi, 1/pi
				#define cupi  1.4645918875615232630201425272638 //cube root of pi
				#define prpi  1.4396194958475906883364908049738 //pi root of pi
				#define lnpi  1.1447298858494001741434273513531 //logn(pi);
				#define trpi  1.0471975511965977461542144610932 //one third of pi, pi/3
				#define thpi  0.99627207622074994426469058001254//tanh(pi)
				#define lgpi  0.4971498726941338543512682882909 //log(pi)
				#define rcpi  0.31830988618379067153776752674503// reciprocal of pi  , 1/pi
				#define rcpipi  0.0274256931232981061195562708591 // reciprocal of pipi  , 1/pipi

				vec3 warp(vec3 v)
				{
					v = v + sin(sin(v.x) + cos(v.y)) + v;
					float a = atan(v.y, v.x) * 1. + sin(v.z / pi) * twpi;
					float r = length(v.xy) + sin(v.z / 2.) + a;
					vec3 c = vec3(sin(a) * 0.5 + 0.5, sin(a + ttpi) * 0.5 + 0.5, sin(a - ttpi) * 0.5 + 0.5);
					return (c)+(sin(r + a) * sharpness + 0.5);
				}

				void main(void )
				{
					vec2 pos = pipi * (vSurface / sqrt(length(vSurface) / pi + 1.)) * frequency;
					float t = timeConst * period + (sqrt(length(pos))) + sin(sqrt(length(pos))) * pi;
					vec3 col = vec3(0.0);
					float div = 0.0;
					for (float i= 1.; i < 9.; i += 1.)
					{
						float fac = pow(4., i) + ((length(pos) + 1.) / pi + sin(sin(t / pi) + 1. * atan(pos.y, pos.x) + pi * sin(length(pos / pisq))) * pi);
						div += i * i;
						col += warp(vec3((pos + sin(sin(t / lnpi) + 1. * atan(pos.y, pos.x) + length(pos) / pisq) / fac) + (pi / (pow(length(pos) / pi, rcpi) + 1.)), fac + (t / i) + sin((1. + length(col)) / pi)));
					}

					col = (col * col) / div;
					gl_FragColor = vec4(col * color, 1.0);
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


		/**
		* Gets the sharpness
		* @returns {number}
		*/
        get sharpness(): number { return this.materials[ PassType.Texture ]._uniforms[ 'sharpness' ].value; }

		/**
		* Sets the sharpness
		* @param {number} val
		*/
        set sharpness( val: number ) { this.materials[ PassType.Texture ].setUniform( 'sharpness', val ); }
    }
}
