namespace Trike {
	/**
	* An enum that describes the way we render point lights. You can either treat them as scene geometry spheres
	* that will get culled by the frustum - or as a screen quad.
	*/
    export enum POINT_LIGHT_RENDER_TYPE {
        Perspective,
        ScreenQuad
    }

	/**
	* This material draws the luminosity contributions of a point light onto its light mesh
	*/
    export class MaterialLightPoint extends MaterialMulti {
        public renderType: POINT_LIGHT_RENDER_TYPE;

        constructor( renderType: POINT_LIGHT_RENDER_TYPE = POINT_LIGHT_RENDER_TYPE.Perspective ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Lights ] = new PassMaterial( 'Point Light', this );

            this.renderType = renderType;

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'gBuffer2', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'gBuffer', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'lightColor', Trike.UniformType.COLOR3 ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'lightIntensity', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'lightPositionVS', Trike.UniformType.FLOAT3 ), true );
            this.addUniform( new UniformVar( 'lightRadius', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'translucencyIntensity', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'translucencyColor', Trike.UniformType.COLOR3, new Color( 0xffffff ) ), true );

            // Define the attribures and defines
            if ( renderType === POINT_LIGHT_RENDER_TYPE.ScreenQuad ) {
                this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );
                this.addAttribute( new AttributeVar( 'frustumCornerIndex', Trike.AttributeType.SCREEN_CORNER_INDEX ) );

                this.addDefine( ShaderDefines.ATTR_POSITION );
                this.addDefine( ShaderDefines.QUAD_LIGHTING );
                this.materials[ PassType.Lights ].addUniform( new UniformVar( 'frustumCorners', Trike.UniformType.FLOAT3_ARRAY ) );
            }
            else {
                this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );
                this.addDefine( ShaderDefines.ATTR_POSITION );

                this.addUniform( new UniformVar( 'cameraFar', Trike.UniformType.FLOAT, 1000 ) );
                this.addUniform( new UniformVar( 'modelViewMatrix', Trike.UniformType.MAT4 ) );
                this.addUniform( new UniformVar( 'projectionMatrix', Trike.UniformType.MAT4 ) );
            }

            this.addDefine( ShaderDefines.GAMA_INPUT );

            this.materials[ PassType.Lights ].blendMode = BlendMode.Additive;
            this.materials[ PassType.Lights ].cullMode = CullFormat.Front;
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

				// If we are rendering point lights as full screen quads
				#ifdef QUAD_LIGHTING

					${ShaderFragments.VertParams.frustumCorners()}

					void main()
					{
						// sphere proxy needs real position
						gl_Position = vec4( sign( position.xy ), 0.0, 1.0 );
						${ShaderFragments.VertMain.frustumCorners()}
					}

				// Rendering the point lights as sphere geometry
				#else

					uniform mat4 modelViewMatrix;
					uniform mat4 projectionMatrix;
					varying vec3 vertVS;
					varying vec4 clipPos;

					void main()
					{
						// sphere proxy needs real position
						vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
						vertVS = mvPosition.xyz;
						gl_Position = projectionMatrix * mvPosition;
						clipPos = gl_Position;
					}

				#endif
			`
        }

		/**
		* Create the fragment shader
		* @returns {string}
		*/
        getFragmentShader(): string {
            return `

				uniform float viewHeight;
				uniform float viewWidth;
				uniform float lightIntensity;

				// For getting the normalized z depth
				varying vec4 clipPos;
				varying vec3 vertVS;
				uniform float cameraFar;

				uniform sampler2D gBuffer2;
				uniform sampler2D gBuffer;

				uniform vec3 lightPositionVS;
				uniform vec3 lightColor;
				uniform float lightRadius;

				uniform float translucencyIntensity;
				uniform vec3 translucencyColor;

				#ifdef QUAD_LIGHTING
					${ShaderFragments.FragParams.frustumCorners()}
				#endif

				${ShaderFragments.FragParams.floatToVec()}
				${ShaderFragments.FragParams.vecToFloat()}
				${ShaderFragments.FragParams.decodeNormal()}

				void main()
				{

					${ShaderFragments.FragMain.quadTexCoord()}
					${ShaderFragments.FragMain.computeVertexPositionVS()}

					// bail out early when pixel outside of light sphere
				    vec3 lightVector = lightPositionVS - vertexPositionVS.xyz;
				    float distance = length( lightVector );
				    if ( distance > lightRadius ) discard;

					${ShaderFragments.FragMain.computeNormal()}
					${ShaderFragments.FragMain.unpackColorMap()}

					// compute light
				    lightVector = normalize( lightVector );

					${ShaderFragments.FragMain.computeDiffuse()}
					${ShaderFragments.FragMain.computeSpecular()}

					// combine
				    float cutoff = 0.25;
				    float denom = distance / lightRadius + 1.0;
				    float attenuation = 1.0 / ( denom * denom );
				    attenuation = ( attenuation - cutoff ) / ( 1.0 - cutoff );
				    attenuation = max( attenuation, 0.0 );

					${ShaderFragments.FragMain.computeTranslucency()}
					${ShaderFragments.FragMain.combineLighting()}
				}

			`
        }
    }
}
