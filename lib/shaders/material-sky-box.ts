namespace Trike {
	/**
	* A very simple material that samples a sky cube texture
	*/
    export class MaterialSkybox extends MaterialMulti {
        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Skybox ] = new PassMaterial( 'Skybox', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'modelViewMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'projectionMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'brightness', Trike.UniformType.FLOAT, 0 ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );

            this.setShaders( this.getVertexShader(), this.getFragmentShader() );

            this.cullMode = CullFormat.Front;
        }

		/**
		* Create the vertex shader
		* @returns {string}
		*/
        getVertexShader(): string {
            return `
			${ShaderFragments.VertParams.defaults()}

			#ifdef USE_TEXTURE
				varying vec3 vWorldPosition;
				uniform mat4 modelMatrix;
			#endif

			void main()
			{
				#ifdef USE_TEXTURE
					vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
					vWorldPosition = worldPosition.xyz;
				#endif
				${ShaderFragments.VertMain.defaults()}
			}
			`
        }

		/**
		* Create the fragment shader
		* @returns {string}
		*/
        getFragmentShader(): string {
            return `
			#ifdef USE_TEXTURE
				uniform samplerCube skybox;
				varying vec3 vWorldPosition;
			#endif

			uniform float brightness;

			void main()
			{
				#ifdef USE_TEXTURE
					float flipNormal = ( -1.0 + 2.0 * float( gl_FrontFacing ) );
					vec3 skyCoords = vec3( flipNormal * vWorldPosition.x, vWorldPosition.yz );
					gl_FragColor = textureCube( skybox, skyCoords );
					gl_FragColor.rgb *= brightness;
				#else
					gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 );
				#endif
			}
			`
        }
    }
}