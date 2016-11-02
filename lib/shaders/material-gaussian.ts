namespace Trike {
	/**
	* A very simple shader that draws a texture to a screen aligned quad
	*/
    export class MaterialGaussian extends MaterialMulti {
        private _photometricExponent: number;

        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this._photometricExponent = 0.1;
            this.materials[ PassType.ScreenQuad ] = new PassMaterial( 'Screen Texture', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'map', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'blurriness', Trike.UniformType.FLOAT, 1 ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );
            this.setShaders( this.getVertexShader(), this.getFragmentShader() );
            this.depthWrite = false;
            this.depthRead = false;

            this.setDirection( true );
        }

		/**
		* Gets or sets the photometric exponent of the shader. Only applies if in CBF mode
		* @param {number} val [Optional]
		* @returns {number}
		*/
        photometricExponent( val?: number ): number {
            if ( val === undefined ) return this._photometricExponent;

            this._photometricExponent = val;
            if ( this._uniforms[ 'photometricExponent' ] )
                this.setUniform( 'photometricExponent', val, true );

            return val;
        }

		/**
		* Cross Bilateral filter
		* https://bitbucket.org/sinbad/ogre/src/79c37025a057c6aa00d6a444e08a406c147a6d62/Samples/Media/materials/scripts/SSAO/CrossBilateralFilterYFP.glsl?at=v1-9
		*/
        crossBilateralFilter( val?: boolean ): boolean {
            if ( val === undefined ) return this.hasDefine( '#define CBF' );

            this.removeDefine( '#define CBF' );
            this.removeUniform( 'gBuffer2' );
            this.removeUniform( 'photometricExponent' );

            if ( val ) {
                this.addDefine( '#define CBF' );
                this.addUniform( new UniformVar( 'gBuffer2', UniformType.TEXTURE ) );
                this.addUniform( new UniformVar( 'photometricExponent', UniformType.FLOAT, this._photometricExponent ) );
            }

            return val;
        }

		/**
		* Gets or sets the texture we are blurring
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        map( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._uniforms[ 'map' ].value;

            this.setUniform( 'map', val, true );
            return val;
        }

		/**
		* Gets or sets which blur direction this material is employing
		* @param {boolean} horizontal If true, this will be a horizontal blur otherwise it will be vertical
		*/
        setDirection( horizontal: boolean ) {
            this.removeDefine( '#define BLUR_X' );
            this.removeDefine( '#define BLUR_Y' );

            if ( horizontal )
                this.addDefine( '#define BLUR_X' );
            else
                this.addDefine( '#define BLUR_Y' );
        }

		/**
		* Gets or sets the blurriness of the shader
		* @param {number} val [Optional]
		* @returns {number}
		*/
        blurriness( val?: number ): number {
            if ( val === undefined ) return this._uniforms[ 'blurriness' ].value;

            this.setUniform( 'blurriness', val, true );
            return val;
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

				uniform sampler2D map;
				#ifdef CBF
					uniform sampler2D gBuffer2;
					uniform float photometricExponent;
				#endif
				uniform float viewHeight;
				uniform float viewWidth;
                uniform float blurriness;

				void main()
				{
					${ShaderFragments.FragMain.quadTexCoord()}

                	vec4 sum = vec4(0.0);

					#ifdef CBF

						const float kernelWidth = 13.0;
						float sigma = ( kernelWidth - 1.0 ) / 6.0; // make the kernel span 6 sigma
						float fragmentDepth = texture2D( gBuffer2, texCoord ).z;
						float weights = 0.0;
						float blurred = 0.0;

						#ifdef BLUR_X

							float stepX = blurriness / viewWidth;
							for ( float i = -(kernelWidth - 1.0) / 2.0; i < (kernelWidth - 1.0) / 2.0; i++ )
							{
								float geometricWeight = exp( -pow( i, 2.0 ) / ( 2.0 * pow( sigma, 2.0 ) ) );
								float sampleDepth = texture2D( gBuffer2, vec2( texCoord.x - i * stepX, texCoord.y ) ).z;
								float photometricWeight = 1.0 / pow( ( 1.0 + abs( fragmentDepth - sampleDepth ) ), photometricExponent );

								weights += (geometricWeight * photometricWeight);
								blurred += texture2D(map, vec2(texCoord.x - i * stepX, texCoord.y)).r * geometricWeight * photometricWeight;
							}

						#else

							float stepY = blurriness / viewHeight;
							for ( float i = -(kernelWidth - 1.0) / 2.0; i < (kernelWidth - 1.0) / 2.0; i++ )
							{
								float geometricWeight = exp( -pow( i, 2.0 ) / ( 2.0 * pow( sigma, 2.0 ) ) );
								float sampleDepth = texture2D( gBuffer2, vec2( texCoord.x, texCoord.y - i * stepY ) ).z;
								float photometricWeight = 1.0 / pow( ( 1.0 + abs( fragmentDepth - sampleDepth ) ), photometricExponent );

								weights += (geometricWeight * photometricWeight);
								blurred += texture2D(map, vec2(texCoord.x, texCoord.y - i * stepY )).r * geometricWeight * photometricWeight;
							}

						#endif

							blurred /= weights;
							gl_FragColor = vec4( blurred, blurred, blurred, 1.0 );

					#else
                		#ifdef BLUR_X
                			float blur  = (blurriness / viewWidth);
							float texX = texCoord.x;
                			float texY = texCoord.y;

							// blur in y (horizontal)
							// take nine samples, with the distance blur between them
							sum += texture2D(map, vec2(texX - 4.0 * blur,	texY)) * 0.05;
                			sum += texture2D(map, vec2(texX - 3.0 * blur,	texY)) * 0.09;
                			sum += texture2D(map, vec2(texX - 2.0 * blur,	texY)) * 0.12;
                			sum += texture2D(map, vec2(texX - blur,			texY)) * 0.15;

                			sum += texture2D(map, vec2(texX,				texY)) * 0.16;

                			sum += texture2D(map, vec2(texX + blur,			texY)) * 0.15;
                			sum += texture2D(map, vec2(texX + 2.0 * blur,	texY)) * 0.12;
                			sum += texture2D(map, vec2(texX + 3.0 * blur,	texY)) * 0.09;
                			sum += texture2D(map, vec2(texX + 4.0 * blur,	texY)) * 0.05;
                			gl_FragColor = sum;

                		#else

                			float blur  = (blurriness / viewHeight);
                			float texX = texCoord.x;
                			float texY = texCoord.y;

							// blur in y (vertical)
							// take nine samples, with the distance blur between them
                			sum += texture2D(map, vec2(texX, texY - 4.0 * blur )) * 0.05;
							sum += texture2D(map, vec2(texX, texY - 3.0 * blur )) * 0.09;
							sum += texture2D(map, vec2(texX, texY - 2.0 * blur )) * 0.12;
							sum += texture2D(map, vec2(texX, texY - blur )) * 0.15;

							sum += texture2D(map, vec2(texX, texY)) * 0.16;

							sum += texture2D(map, vec2(texX, texY + blur )) * 0.15;
							sum += texture2D(map, vec2(texX, texY + 2.0 * blur )) * 0.12;
							sum += texture2D(map, vec2(texX, texY + 3.0 * blur )) * 0.09;
							sum += texture2D(map, vec2(texX, texY + 4.0 * blur )) * 0.05;

							gl_FragColor = sum;

                		#endif
					#endif
				}
			`
        }
    }
}
