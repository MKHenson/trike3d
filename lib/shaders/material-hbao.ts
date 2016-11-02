namespace Trike {
	/**
	* Similar to screen space amient occlusion, but more expensive.
	* See http://developer.download.nvidia.com/presentations/2008/SIGGRAPH/HBAO_SIG08b.pdf
	* https://github.com/scanberg/hbao
	* https://gist.github.com/fisch0920/6770346
	*/
    export class MaterialHBAO extends MaterialMulti {
        private _numDirections: number;
        private _numSteps: number;

        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.ScreenQuad ] = new PassMaterial( 'AO', this );

            this._numDirections = 6;
            this._numSteps = 3;

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'fov', Trike.UniformType.FLOAT, 45 ), true );
            this.addUniform( new UniformVar( 'sampleRadius', Trike.UniformType.FLOAT, 0.5 ), true );
            this.addUniform( new UniformVar( 'angleBias', Trike.UniformType.FLOAT, 0.2 ), true );
            this.addUniform( new UniformVar( 'intensity', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'invProjectionMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'noiseScale', Trike.UniformType.FLOAT2 ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'gBuffer2', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'noiseSampler', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'frustumCorners', Trike.UniformType.FLOAT3_ARRAY ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );
            this.addAttribute( new AttributeVar( 'frustumCornerIndex', Trike.AttributeType.SCREEN_CORNER_INDEX ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );
            this.addDefine( ShaderDefines.QUAD_LIGHTING );

            this.setShaders( this.getVertexShader(), this.getFragmentShader() );
            this.depthWrite = false;
            this.depthRead = false;


            this.numDirections( 6 );
            this.numSteps( 3 );
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
                }`
        }

		/**
		* Create the fragment shader
		* @returns {string}
		*/
        getFragmentShader(): string {
            return `
				${ShaderFragments.FragParams.frustumCorners()}
				${ShaderFragments.FragParams.floatToVec()}
				${ShaderFragments.FragParams.vecToFloat()}

				uniform sampler2D gBuffer2;
				uniform sampler2D noiseSampler;
				uniform float viewHeight;
				uniform float viewWidth;
				uniform mat4 invProjectionMatrix;
				uniform float fov;
				uniform float sampleRadius;
				uniform float angleBias;
				uniform float intensity;
				uniform vec2 noiseScale;

				#define APPLY_ATTENUATION     false
				#define USE_ACTUAL_NORMALS    false
				#define PI 3.14159265359
				#define TWO_PI 6.28318530718

				vec3 posFromDepth(vec2 coord)
				{
					vec4 curSample = texture2D(gBuffer2, coord);
					float d = curSample.z;

					// [0,1] -> [-1,1] clip space
					vec3 tray = ( invProjectionMatrix * vec4( ( coord.x-0.5 ) * 2.0, ( coord.y - 0.5 ) * 2.0, 1.0, 1.0 ) ).xyz;
					return tray * d;
				}

				void main()
				{
					${ShaderFragments.FragMain.quadTexCoord()}
					vec3 originVS = posFromDepth(texCoord);

					#if defined(USE_ACTUAL_NORMALS)
						vec3 normalVS = normalize( float_to_vec3( abs( texture2D( gBuffer2, texCoord ).x ) ) * 2.0 - 1.0 );
					#else
						vec3 normalVS = reconstructNormalVS(originVS);
					#endif

					float radiusSS = 0.0; // radius of influence in screen space
					float radiusWS = 0.0; // radius of influence in world space

					radiusSS = sampleRadius;
					vec4 temp0 = invProjectionMatrix * vec4(0.0, 0.0, -1.0, 1.0);
					vec3 out0  = temp0.xyz;
					vec4 temp1 = invProjectionMatrix * vec4(radiusSS, 0.0, -1.0, 1.0);
					vec3 out1  = temp1.xyz;

					// NOTE (travis): empirically, the main introduction of artifacts with HBAO
					// is having too large of a world-space radius; attempt to combat this issue by
					// clamping the world-space radius based on the screen-space radius' projection
					radiusWS = min(tan(radiusSS * fov / 2.0) * originVS.y / 2.0, length(out1 - out0));

					const float theta = TWO_PI / float(NUM_SAMPLE_DIRECTIONS);
					float cosTheta = cos(theta);
					float sinTheta = sin(theta);

					// matrix to create the sample directions
					mat2 deltaRotationMatrix = mat2(cosTheta, -sinTheta, sinTheta, cosTheta);

					// step vector in view space
					vec2 deltaUV = vec2(1.0, 0.0) * (radiusSS / (float(NUM_SAMPLE_DIRECTIONS * NUM_SAMPLE_STEPS) + 1.0));

					// we don't want to sample to the perimeter of R since those samples would be
					// omitted by the distance attenuation (W(R) = 0 by definition)
					// Therefore we add a extra step and don't use the last sample.
					vec3 sampleNoise    = texture2D(noiseSampler, texCoord * noiseScale).xyz;
					mat2 rotationMatrix = mat2(sampleNoise.x, -sampleNoise.y, sampleNoise.y,  sampleNoise.x);

					// apply a random rotation to the base step vector
					deltaUV = rotationMatrix * deltaUV;

					float jitter = sampleNoise.z;
					float occlusion = 0.0;

					for (int i = 0; i < NUM_SAMPLE_DIRECTIONS; ++i)
					{
						// incrementally rotate sample direction
						deltaUV = deltaRotationMatrix * deltaUV;

						vec2 sampleDirUV = deltaUV;
						float oldAngle   = angleBias;

						for (int j = 0; j < NUM_SAMPLE_STEPS; ++j)
						{
							vec2 sampleUV		= texCoord + (jitter + float(j)) * sampleDirUV;
							vec3 sampleVS		= posFromDepth(sampleUV);
							vec3 sampleDirVS	= (sampleVS - originVS);

							// angle between fragment tangent and the sample
							float gamma = (PI / 2.0) - acos(dot(normalVS, normalize(sampleDirVS)));

							if (gamma > oldAngle)
							{
								float value = sin(gamma) - sin(oldAngle);

								#if defined(APPLY_ATTENUATION)
									// distance between original and sample points
									float attenuation = clamp(1.0 - pow(length(sampleDirVS) / radiusWS, 2.0), 0.0, 1.0);
									occlusion += attenuation * value;
								#else
									occlusion += value;
								#endif

								oldAngle = gamma;
							}
						}
					}

					occlusion = 1.0 - occlusion / float(NUM_SAMPLE_DIRECTIONS);
					occlusion = clamp(pow(occlusion, 1.0 + intensity), 0.0, 1.0);
					gl_FragColor = vec4(occlusion, occlusion, occlusion, 1.0);
				}
				`
        }

		/**
		* Gets or sets the number of sample directions (beware that increasing this can significantly slow down the shader)
		* @param {number} val [Optional]
		* @returns {number}
		*/
        numDirections( val?: number ): number {
            if ( val === undefined ) return this._numDirections;

            this.removeDefine( '#define NUM_SAMPLE_DIRECTIONS ' + this._numDirections.toFixed( 0 ) );
            this._numDirections = val;
            this.addDefine( '#define NUM_SAMPLE_DIRECTIONS ' + val.toFixed( 0 ) );
            return val;
        }

		/**
		* Gets or sets the number of sample steps (beware that increasing this can significantly slow down the shader)
		* @param {number} val [Optional]
		* @returns {number}
		*/
        numSteps( val?: number ): number {
            if ( val === undefined ) return this._numSteps;

            this.removeDefine( '#define NUM_SAMPLE_STEPS ' + this._numSteps.toFixed( 0 ) );
            this._numSteps = val;
            this.addDefine( '#define NUM_SAMPLE_STEPS ' + val.toFixed( 0 ) );
            return val;
        }

		/**
		* Gets or sets the fov of the pixels from each sample point.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        fov( val?: number ): number {
            if ( val === undefined ) return this._uniforms[ 'fov' ].value;

            this.setUniform( 'fov', val, true );
            return val;
        }

		/**
		* Gets or sets the sample radius of the AO
		* @param {number} val [Optional]
		* @returns {number}
		*/
        sampleRadius( val?: number ): number {
            if ( val === undefined ) return this._uniforms[ 'sampleRadius' ].value;

            this.setUniform( 'sampleRadius', val, true );
            return val;
        }

		/**
		* Gets or sets the angle bias radius of the AO
		* @param {number} val [Optional]
		* @returns {number}
		*/
        angleBias( val?: number ): number {
            if ( val === undefined ) return this._uniforms[ 'angleBias' ].value;

            this.setUniform( 'angleBias', val, true );
            return val;
        }

		/**
		* Gets or sets the intensity of the AO
		* @param {number} val [Optional]
		* @returns {number}
		*/
        intensity( val?: number ): number {
            if ( val === undefined ) return this._uniforms[ 'intensity' ].value;

            this.setUniform( 'intensity', val, true );
            return val;
        }

		/**
		* Gets or sets the noise scale of the AO
		* @param {Vec2} val [Optional]
		* @returns {Vec2}
		*/
        noiseScale( val?: Vec2 ): Vec2 {
            if ( val === undefined ) return this._uniforms[ 'noiseScale' ].value;

            this.setUniform( 'noiseScale', val, true );
            return val;
        }
    }
}
