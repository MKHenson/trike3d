namespace Trike {
	/**
	* Convolves a texture
	* See for more:
	* http://codeflow.org/entries/2011/apr/18/advanced-webgl-part-3-irradiance-environment-map/
	*/
    export class MaterialConvolver extends MaterialMulti {
        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.ScreenQuad ] = new PassMaterial( 'Convolver', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'sampler', Trike.UniformType.TEXTURE_CUBE ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'specularity', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'invViewRot', Trike.UniformType.MAT4 ), true );

            // Different from the standard uniform as it uses a different camera
            this.addUniform( new UniformVar( 'invProjMatrix', Trike.UniformType.MAT4 ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );

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
                }`
        }

		/**
		* Create the fragment shader
		* @returns {string}
		*/
        getFragmentShader(): string {
            return `
				uniform samplerCube sampler;
				uniform float viewHeight;
				uniform float viewWidth;
				uniform mat4 invProjMatrix;
				uniform mat4 invViewRot;
				uniform float specularity;

				const vec3 x = vec3(1.0, 0.0, 0.0);
				const vec3 y = vec3(0.0, 1.0, 0.0);
				const vec3 z = vec3(0.0, 0.0, 1.0);

				const mat3 front = mat3(x, y, z);
				const mat3 back = mat3(x, y, -z);
				const mat3 right = mat3(z, y, x);
				const mat3 left = mat3(z, y, -x);
				const mat3 top = mat3(x, z, y);
				const mat3 bottom = mat3(x, z, -y);

				const float size = 16.0;
				const float start = ((0.5/size)-0.5)*2.0;
				const float end = -start;
				const float incr = 2.0/size;

				vec3 getEyeNormal()
				{
					vec2 fragCoord = gl_FragCoord.xy / vec2(viewWidth, viewHeight);
					fragCoord = ( fragCoord - 0.5 ) * 2.0;
					vec4 deviceNormal = vec4( fragCoord, 0.0, 1.0 );
					vec3 eyeNormal = normalize( ( invProjMatrix * deviceNormal ).xyz );
					vec3 worldNormal = normalize( ( invViewRot * vec4( eyeNormal, 0.0 ) ).xyz );
					return worldNormal;
				}

				vec4 sample( mat3 side, vec3 eyedir, vec3 baseRay )
				{
					vec3 ray = side * baseRay;
					float lambert = max( 0.0, dot( ray, eyedir ) );
					float term = pow( lambert, specularity ) * baseRay.z;
					return vec4( textureCube( sampler, ray ).rgb * term, term );
				}

				void main()
				{
					vec4 result = vec4(0.0);
					vec3 eyedir = getEyeNormal(), ray;

					for(float xi=start; xi<=end; xi+=incr)
					{
						for(float yi=start; yi<=end; yi+=incr)
						{
							ray = normalize((invProjMatrix * vec4(xi, yi, 0.0, 1.0)).xyz);
							result += sample(front, eyedir, ray);
							result += sample(back, eyedir, ray);
							result += sample(top, eyedir, ray);
							result += sample(bottom, eyedir, ray);
							result += sample(left, eyedir, ray);
							result += sample(right, eyedir, ray);
						}
					}
					result /= result.w;
					gl_FragColor = vec4(result.rgb, 1.0);
				}`
        }
    }
}
