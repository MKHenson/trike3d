namespace Trike {
	/**
	* A very simple shader that takes 2 textures and blends them to a final one
	*/
    export class MaterialBlendTextures extends MaterialMulti {
        constructor( opacityFromGBuffer: boolean = false ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.ScreenQuad ] = new PassMaterial( 'Blend Textures', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'map1', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'map2', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );
            this.addDefine( '#define MULTIPLY' );

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

				uniform sampler2D map1;
				uniform sampler2D map2;
				uniform float viewHeight;
				uniform float viewWidth;

				void main()
				{
					${ShaderFragments.FragMain.quadTexCoord()}


					#if defined(ADD)
						gl_FragColor = texture2D( map1, texCoord ) + texture2D( map2, texCoord );
					#elif defined(MULTIPLY)
						gl_FragColor = texture2D( map1, texCoord ) * texture2D( map2, texCoord );
					#endif
				}
			`
        }

		/**
		* Gets or sets the first texture we are blurring
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        map1( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._uniforms[ 'map1' ].value;

            this.setUniform( 'map1', val, true );
            return val;
        }

		/**
		* Gets or sets the second texture we are blurring
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        map2( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._uniforms[ 'map2' ].value;

            this.setUniform( 'map2', val, true );
            return val;
        }
    }
}
