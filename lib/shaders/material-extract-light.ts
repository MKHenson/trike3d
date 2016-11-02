namespace Trike {
	/**
	* Extracts or highlights luminescent areas of a texture
	*/
    export class MaterialExtractLight extends MaterialMulti {
        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.ScreenQuad ] = new PassMaterial( 'Material Extract Light', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'map', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'contrast', Trike.UniformType.FLOAT, 6.2 ), true );
            this.addUniform( new UniformVar( 'brightness', Trike.UniformType.FLOAT, 0.5 ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );
            this.setShaders( this.getVertexShader(), this.getFragmentShader() );
            this.depthWrite = false;
            this.depthRead = false;
        }

		/**
		* Gets or sets the contrast of the shader
		* @param {number} val [Optional]
		* @returns {number}
		*/
        contrast( val?: number ): number {
            if ( val === undefined ) return this._uniforms[ 'contrast' ].value;

            this.setUniform( 'contrast', val, true );
            return val;
        }

		/**
		* Gets or sets the max brightness of the shader
		* @param {number} val [Optional]
		* @returns {number}
		*/
        brightness( val?: number ): number {
            if ( val === undefined ) return this._uniforms[ 'brightness' ].value;

            this.setUniform( 'brightness', val, true );
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
				uniform float viewHeight;
				uniform float viewWidth;
                uniform float brightness;
				uniform float contrast;

				void main()
				{

					${ShaderFragments.FragMain.quadTexCoord()}

                	gl_FragColor = texture2D( map, texCoord );

                	vec3 inColor = gl_FragColor.xyz;
                	inColor = inColor * inColor;
                	inColor *= brightness;
                	vec3 outColor;
                	vec3 x = max( vec3( 0.0 ), inColor - 0.004 );
                	outColor = ( x * ( contrast * x + 0.5 ) ) / ( x * ( contrast * x + 1.7 ) + 0.06 );
					gl_FragColor.rgb = outColor;
				}

			`
        }
    }
}
