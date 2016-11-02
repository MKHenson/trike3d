namespace Trike {
	/**
	* A very simple shader that draws a texture to a screen aligned quad
	*/
    export class MaterialScreenTexture extends MaterialMulti {
        constructor( opacityFromGBuffer: boolean = false ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.ScreenQuad ] = new PassMaterial( 'Screen Texture', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'map', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );

            if ( opacityFromGBuffer ) {
                this.addDefine( '#define OPAC_MAP' );
                this.addUniform( new UniformVar( 'gBuffer2', Trike.UniformType.TEXTURE ) );
            }

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

				uniform sampler2D map;
				#ifdef OPAC_MAP
					uniform sampler2D gBuffer2;
					${ShaderFragments.FragParams.floatToVec()}
				#endif

				uniform float viewHeight;
				uniform float viewWidth;

				void main()
				{
					${ShaderFragments.FragMain.quadTexCoord()}

					// Get the depth material - do nothing if there is no Z value
					#ifdef PREMULTIPLIED_ALPHA

						#ifdef OPAC_MAP
							vec4 gBuffer2Sample = texture2D( gBuffer2, texCoord );
							vec3 freeOpacShininess = float_to_vec3( abs( gBuffer2Sample.w ) );
							float opacity = freeOpacShininess.y;
						#else
							float opacity = map.w;
						#endif

						vec4 mapSample = texture2D( map, texCoord );
						gl_FragColor.xyz = mapSample.xyz * opacity;
						gl_FragColor.w = opacity;

					#else
						gl_FragColor = texture2D( map, texCoord );
					#endif
				}
			`
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
    }
}
