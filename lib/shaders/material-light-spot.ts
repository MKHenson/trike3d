namespace Trike {
	/**
	* This material draws the luminosity contributions of a spot light onto its light mesh
	*/
    export class MaterialLightSpot extends MaterialMulti {
        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Lights ] = new PassMaterial( 'Spot Light', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'lightColor', Trike.UniformType.COLOR3 ), true );
            this.addUniform( new UniformVar( 'gBuffer2', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'gBuffer', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'lightIntensity', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'lightPositionVS', Trike.UniformType.FLOAT3 ), true );
            this.addUniform( new UniformVar( 'lightDirectionVS', Trike.UniformType.FLOAT3 ), true );
            this.addUniform( new UniformVar( 'lightAngle', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'frustumCorners', Trike.UniformType.FLOAT3_ARRAY ), true );
            this.addUniform( new UniformVar( 'limitScreenQuad', Trike.UniformType.FLOAT, 0 ), true );
            this.addUniform( new UniformVar( 'minMax', Trike.UniformType.FLOAT4, new Vec4( -1, -1, 1, 1 ) ), true );
            this.addUniform( new UniformVar( 'translucencyIntensity', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'translucencyColor', Trike.UniformType.COLOR3, new Color( 0xffffff ) ), true );


            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );
            this.addAttribute( new AttributeVar( 'frustumCornerIndex', Trike.AttributeType.SCREEN_CORNER_INDEX ) );

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
				${ShaderFragments.VertParams.frustumCorners()}
				${ShaderFragments.VertParams.screenQuadBoundaries()}

				void main()
				{
				   gl_Position = vec4( sign( position.xy ), 0.0, 1.0 );
					${ShaderFragments.VertMain.frustumCorners()}
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

				uniform float viewHeight;
				uniform float viewWidth;
				uniform float lightIntensity;
				uniform sampler2D gBuffer2;
				uniform sampler2D gBuffer;

				uniform vec3 lightPositionVS;
				uniform vec3 lightDirectionVS;
				uniform vec3 lightColor;
				uniform float lightAngle;
				uniform float translucencyIntensity;
				uniform vec3 translucencyColor;

				${ShaderFragments.FragParams.frustumCorners()}
				${ShaderFragments.FragParams.floatToVec()}
				${ShaderFragments.FragParams.vecToFloat()}
				${ShaderFragments.FragParams.decodeNormal()}

				void main()
				{
					${ShaderFragments.FragMain.quadTexCoord()}
					${ShaderFragments.FragMain.computeVertexPositionVS()}
					${ShaderFragments.FragMain.computeNormal()}
					${ShaderFragments.FragMain.unpackColorMap()}

					// compute light
				    vec3 lightVector = normalize( lightPositionVS.xyz - vertexPositionVS.xyz );

				    float rho = dot( lightDirectionVS, lightVector );
				    float rhoMax = cos( lightAngle * 0.5 );

				    if ( rho <= rhoMax ) discard;

				    float theta = rhoMax + 0.0001;
				    float phi = rhoMax + 0.05;
				    float falloff = 4.0;

				    float spot = 0.0;

				    if ( rho >= phi )
				        spot = 1.0;
				    else if ( rho <= theta )
				        spot = 0.0;
				    else
				        spot = pow( ( rho - theta ) / ( phi - theta ), falloff );

					${ShaderFragments.FragMain.computeDiffuse()}

				    diffuse *= spot;

					${ShaderFragments.FragMain.computeSpecular()}

					 // combine
				    const float attenuation = 1.0;

					${ShaderFragments.FragMain.computeTranslucency()}
					${ShaderFragments.FragMain.combineLighting()}
				}
			`
        }
    }
}
