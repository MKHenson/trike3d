namespace Trike {
	/**
	* Darkens areas of the scene where geometry is close together
	* See
	* http://blog.evoserv.at/index.php/2012/12/hemispherical-screen-space-ambient-occlusion-ssao-for-deferred-renderers-using-openglglsl/
	* https://github.com/jdupuy/ssgi/blob/master/src/shaders/ssgi.glsl
	* http://forum.unity3d.com/threads/my-ssao-ssgi-prototype.78566/
	* https://github.com/kayru/dssdo/blob/master/dssdo.hlsl
	* http://kayru.org/articles/dssdo/
	*/
    export class MaterialAO extends MaterialMulti {
        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.ScreenQuad ] = new PassMaterial( 'AO', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'gBuffer2', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'noiseSampler', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'samplingRadius', Trike.UniformType.FLOAT, 10 ), true );
            this.addUniform( new UniformVar( 'occluderBias', Trike.UniformType.FLOAT, 0.05 ), true );
            this.addUniform( new UniformVar( 'intensity', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'frustumCorners', Trike.UniformType.FLOAT3_ARRAY ), true );
            this.addUniform( new UniformVar( 'texelSize', Trike.UniformType.FLOAT2 ), true );
            this.addUniform( new UniformVar( 'attenuation1', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'attenuation2', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'noiseScale', Trike.UniformType.FLOAT2 ), true );
            this.addUniform( new UniformVar( 'invProjectionMatrix', Trike.UniformType.MAT4 ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );
            this.addAttribute( new AttributeVar( 'frustumCornerIndex', Trike.AttributeType.SCREEN_CORNER_INDEX ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );
            this.addDefine( ShaderDefines.QUAD_LIGHTING );

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
				uniform sampler2D gBuffer2;
				uniform sampler2D noiseSampler;
				uniform float viewHeight;
				uniform float viewWidth;
                uniform float intensity;
				uniform float attenuation1;
				uniform float attenuation2;
				uniform vec2 noiseScale;
				uniform mat4 invProjectionMatrix;
				uniform float samplingRadius;
				uniform float occluderBias;

				uniform vec2 texelSize;
				const int sample_count = 16;

				${ShaderFragments.FragParams.frustumCorners()}
				${ShaderFragments.FragParams.floatToVec()}
				${ShaderFragments.FragParams.vecToFloat()}

				vec3 posFromDepth(vec2 coord)
				{
					vec4 curSample = texture2D(gBuffer2, coord);
					float d = curSample.z;
					vec3 tray = ( invProjectionMatrix * vec4( ( coord.x - 0.5 ) * 2.0, ( coord.y - 0.5 ) * 2.0, 1.0, 1.0 ) ).xyz;
					return tray * d;
				}

				float samplePixels(vec3 srcPosition, vec3 srcNormal, vec2 uv )
				{
					vec3 dstPosition = posFromDepth(uv);
					vec3 direction = dstPosition - srcPosition;
					float dist = length(direction);

					// Calculate ambient occlusion amount between these two points
					// It is simular to diffuse lighting. Objects directly above the fragment cast
					// the hardest shadow and objects closer to the horizon have minimal effect.
					float intensity = max(dot(normalize(direction), srcNormal) - occluderBias, 0.0);

					// Attenuate the occlusion, similar to how you attenuate a light source.
					// The further the distance between points, the less effect AO has on the fragment.
					float attenuation = 1.0 / (attenuation1 + (attenuation2 * dist));
					return intensity * attenuation;
				}

				void main()
				{
					${ShaderFragments.FragMain.quadTexCoord()}
					vec4 gBuffer2Sample = texture2D( gBuffer2, texCoord );
					float normalizedDepth = gBuffer2Sample.z;

					${ShaderFragments.FragMain.computeNormal()}
					vec3 srcPosition = posFromDepth(texCoord);
					vec2 randVec = normalize(texture2D(noiseSampler, texCoord * noiseScale ).xy * 2.0 - 1.0);

					// The following variable specifies how many pixels we skip over after each
					// iteration in the ambient occlusion loop. We can't sample every pixel within
					// the sphere of influence because that's too slow. We only need to sample
					// some random pixels nearby to apprxomate the solution.
					//
					// Pixels far off in the distance will not sample as many pixels as those close up.
					float kernelRadius = samplingRadius * (1.0 - normalizedDepth);

					// Sample neighbouring pixels
					vec2 kernel[4];
					kernel[0] = vec2(0.0, 1.0); // top
					kernel[1] = vec2(1.0, 0.0); // right
					kernel[2] = vec2(0.0, -1.0); // bottom
					kernel[3] = vec2(-1.0, 0.0); // left

					const float Sin45 = 0.707107; // 45 degrees = sin(PI / 4)

					// Sample from 16 pixels, which should be enough to appromixate a result. You can
					// sample from more pixels, but it comes at the cost of performance.
					float occlusion = 0.0;

					for (int i = 0; i < 4; ++i)
					{
						vec2 k1 = reflect(kernel[i], randVec);
						vec2 k2 = vec2(k1.x * Sin45 - k1.y * Sin45, k1.x * Sin45 + k1.y * Sin45);
						k1 *= texelSize;
						k2 *= texelSize;

						occlusion += samplePixels(srcPosition, normal, texCoord + k1 * kernelRadius );
						occlusion += samplePixels(srcPosition, normal, texCoord + k2 * kernelRadius * 0.75 );
						occlusion += samplePixels(srcPosition, normal, texCoord + k1 * kernelRadius * 0.5 );
						occlusion += samplePixels(srcPosition, normal, texCoord + k2 * kernelRadius * 0.25 );
					}

					// Average and clamp ambient occlusion
					occlusion /= 16.0;
					occlusion = clamp(occlusion, 0.0, 1.0);

					// Stops artifacts forming in the distance
					occlusion *= 1.0 - smoothstep(0.7, 0.8, normalizedDepth);

					gl_FragColor.xyz = vec3(1.0 - occlusion * intensity);
				}`
        }
    }
}
