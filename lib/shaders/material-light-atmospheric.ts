namespace Trike {
	/**
	* This material draws an ambient light from a generated irradience map from an atmospheric environment
	*/
    export class MaterialLightAtmospheric extends MaterialMulti {
        private _flipNormal: number;

        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this._flipNormal = -1;

            this.materials[ PassType.Lights ] = new PassMaterial( 'Atmospheric Light', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'gBuffer', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'gBuffer2', Trike.UniformType.TEXTURE ), true );
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
				#if defined(SKY_TEXTURE)
					uniform samplerCube sampler;
					uniform float flipNormal;
					uniform mat4 viewMat;
				#endif
				uniform sampler2D gBuffer2;
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
					vec4 gBuffer2Sample = texture2D( gBuffer2, texCoord );
					vec3 normal = normalize( float_to_vec3( abs( gBuffer2Sample.x ) ) * 2.0 - 1.0 );

					vec4 gBufferSample = texture2D( gBuffer, texCoord );
					vec3 emissiveColor = float_to_vec3( abs( gBufferSample.w ) );
					vec3 textureMap = float_to_vec3( abs( gBufferSample.z ) );

					#ifdef GAMA_INPUT
                		textureMap = textureMap * textureMap;
					#endif

					#if defined(SKY_TEXTURE)
						vec3 worldNormal = normalize( vec3( vec4(normal, 0.0) * viewMat ) );
						vec3 worldCoords = vec3( flipNormal * worldNormal.x, worldNormal.yz );
						vec3 irradience =  textureCube(sampler, worldCoords).rgb;
						gl_FragColor.xyz = lightIntensity * lightColor * emissiveColor * textureMap * irradience;
					#else
						gl_FragColor.xyz = lightIntensity * lightColor * emissiveColor * textureMap;
					#endif

					gl_FragColor.w = 1.0;
				}
			`
        }

        flipNormal( val?: boolean ): boolean {
            if ( val === undefined ) return ( this._flipNormal === -1 ? false : true );
            this._flipNormal = ( val ? 1 : -1 );
            if ( this._uniforms[ 'flipNormal' ] ) this.setUniform( 'flipNormal', this._flipNormal, true );
            return val;
        }

        setSky( val: boolean ) {
            if ( val ) {
                this.addUniform( new UniformVar( 'sampler', Trike.UniformType.TEXTURE_CUBE ), true );
                this.addUniform( new UniformVar( 'viewMat', Trike.UniformType.MAT4 ), true );
                this.addUniform( new UniformVar( 'flipNormal', Trike.UniformType.FLOAT, this._flipNormal ), true );
                this.addDefine( '#define SKY_TEXTURE' );
            }
            else {
                this.removeUniform( 'sampler', true );
                this.removeUniform( 'viewMat', true );
                this.removeUniform( 'flipNormal', true );
                this.removeDefine( '#define SKY_TEXTURE' );
            }

            return val;
        }
    }
}
