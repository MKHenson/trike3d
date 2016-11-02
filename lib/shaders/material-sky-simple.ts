namespace Trike {
	/**
	* A material for rendering skyboxes. A skybox material can optionally represent both day and night cycles.
	* You can use cube textures for both day and night as well as colors and mix them using the ratio function.
	*/
    export class MaterialSkySimple extends MaterialMulti {
        public uniformUpdated: boolean;

        constructor( dayColor: Color, nightColor: Color ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Albedo ] = new PassMaterial( 'Simple Skybox', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'modelViewMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'projectionMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'modelMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'ratio', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'dayColor', Trike.UniformType.COLOR3, dayColor ), true );
            this.addUniform( new UniformVar( 'nightColor', Trike.UniformType.COLOR3, nightColor ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );
            this.addDefine( ShaderDefines.GAMA_INPUT );

            this.uniformUpdated = true;

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

			varying vec3 vWorldPosition;
			uniform mat4 modelMatrix;

			void main()
			{
				vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
				vWorldPosition = worldPosition.xyz;
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
			// Custom declarations
			uniform float ratio;

			#ifdef DAY_MAP
				uniform samplerCube daySampler;
				uniform vec4 quatDay;
			#endif

			#ifdef NIGHT_MAP
				uniform samplerCube nightSampler;
				uniform vec4 quatNight;
			#endif

			varying vec3 vWorldPosition;

			// Textures
			uniform vec3 nightColor;
			uniform vec3 dayColor;

			// Horizon fog haze
			#ifdef FOG
				uniform float fogMin;
				uniform float fogMax;
				uniform vec3 fogColor;
			#endif

			void main()
			{
				float flipNormal = ( -1.0 + 2.0 * float( gl_FrontFacing ) );
				vec3 eyedir = normalize( vec3( flipNormal * vWorldPosition.x, vWorldPosition.yz ) );
				eyedir = ( eyedir + 1.0 ) * 0.5;

				#ifdef DAY_MAP
					vec3 cubeNormDay = vec3( flipNormal * vWorldPosition.x, vWorldPosition.yz );
					// Rotatet the normal using a quaternian
					cubeNormDay = cubeNormDay + 2.0 * cross( cross( cubeNormDay, quatDay.xyz ) + quatDay.w * cubeNormDay, quatDay.xyz );
				#endif

				#ifdef NIGHT_MAP
					vec3 cubeNormNight = vec3( flipNormal * vWorldPosition.x, vWorldPosition.yz );
					// Rotate the normal using a quaternian
					cubeNormNight = cubeNormNight + 2.0 * cross( cross( cubeNormNight, quatNight.xyz ) + quatNight.w * cubeNormNight, quatNight.xyz );
				#endif

				#ifdef DAY_MAP
					vec4 finalDayColor = textureCube( daySampler, cubeNormDay );
					#if defined(GAMA_INPUT)
						finalDayColor.xyz = finalDayColor.xyz * finalDayColor.xyz;
					#endif
					finalDayColor.xyz = finalDayColor.xyz * dayColor.xyz;
				#else
					vec4 finalDayColor = vec4( dayColor.xyz, 1.0 );
				#endif

				#ifdef NIGHT_MAP
					vec4 finalNightColor = textureCube( nightSampler, cubeNormNight );
					#if defined(GAMA_INPUT)
						finalNightColor.xyz = finalNightColor.xyz * finalNightColor.xyz;
					#endif
					finalNightColor.xyz = finalNightColor.xyz * nightColor.xyz;
				#else
					vec4 finalNightColor = vec4( nightColor.xyz, 1.0 );
				#endif

				//	Add the texture
				#if defined(ALPHA_MIX)
					gl_FragColor.xyz = mix( finalDayColor, finalNightColor, finalDayColor.a * ratio ).xyz;
				#else
					gl_FragColor.xyz = mix( finalDayColor, finalNightColor, ratio ).xyz;
				#endif

				//	Fog
				#ifdef FOG

					float yPosition = eyedir.y;
					vec3 fColor = fogColor * fogColor;
					float fogAmount = ( 1.0 - smoothstep( fogMin, fogMax, yPosition) );
					vec3 finalColour = mix( gl_FragColor.xyz, fColor, fogAmount );

					gl_FragColor.xyz = finalColour;

				#endif
				gl_FragColor.w = 1.0;
			}
			`
        }
    }
}