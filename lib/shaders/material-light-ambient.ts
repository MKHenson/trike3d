namespace Trike {
	/**
	* This material draws a flat ambient light onto its light mesh
	*/
    export class MaterialLightAmbient extends MaterialMulti {
        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Lights ] = new PassMaterial( 'Ambient Light', this );

            // Define the commopn uniforms of the material
            this.addUniform( new UniformVar( 'gBuffer', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'lightColor', Trike.UniformType.COLOR3 ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'limitScreenQuad', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'minMax', Trike.UniformType.FLOAT4, new Vec4( -1, -1, 1, 1 ) ), true );
            this.addUniform( new UniformVar( 'lightIntensity', Trike.UniformType.FLOAT, 1 ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );
            this.addDefine( ShaderDefines.QUAD_LIGHTING );
            this.addDefine( ShaderDefines.GAMA_INPUT );

            this.materials[ PassType.Lights ].blendMode = BlendMode.Additive;
            this.materials[ PassType.Lights ].depthWrite = false;

            // Create the shaders
            this.setShaders( this.getVertexShader(), this.getFragmentShader() );
        }

		/**
		* Create the vertex shader
		* @returns {string}
		*/
        getVertexShader(): string {
            return `

				attribute vec3 position;
				${ShaderFragments.VertParams.screenQuadBoundaries()}

				void main()
				{
				    gl_Position = vec4( sign( position.xy ), 0.0, 1.0 );
					${ShaderFragments.VertMain.checkBoundaries()}
				}

			`
        }

		/**
		* Create the fragment shader
		* @returns {string}
		*/
        getFragmentShader(): string {
            return `
				uniform sampler2D gBuffer;
				uniform vec3 lightColor;
				uniform float viewHeight;
				uniform float viewWidth;
                uniform float lightIntensity;

				${ShaderFragments.FragParams.vecToFloat()}
				${ShaderFragments.FragParams.floatToVec()}

				void main()
				{

					${ShaderFragments.FragMain.quadTexCoord()}

					vec4 gBufferSample = texture2D( gBuffer, texCoord );
					vec3 emissiveColor = float_to_vec3( abs( gBufferSample.w ) );
					vec3 textureMap = float_to_vec3( abs( gBufferSample.z ) );

					#ifdef GAMA_INPUT
                		textureMap = textureMap * textureMap;
					#endif

					gl_FragColor.xyz = lightIntensity * lightColor * emissiveColor * textureMap;
					gl_FragColor.w = 1.0;
				}

			`
        }
    }
}
