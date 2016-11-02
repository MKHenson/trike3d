namespace Trike {
	/**
	* Shader code snippets
	*/
    export module ShaderFragments {
        export class LightingFunctions {
			/**
			* http://www.standardabweichung.de/code/javascript/webgl-glsl-fresnel-schlick-approximation
			* The Fresnal function returns higher values when the view is perpendicular to the surface
			* In water this is like viewing from the top and its non-reflective, and then viewing it
			* from the surface and it is.
			*/
            static fresnel(): string {
                return `
				float fresnel(vec3 direction, vec3 normal, float fresnelPower, bool invert)
				{
					vec3 nDirection = normalize(direction);
					vec3 nNormal = normalize(normal);
					vec3 halfDirection = normalize(nNormal + nDirection);

					float cosine = dot(halfDirection, nDirection);
					float product = max(cosine, 0.0);
					float factor = invert ? 1.0 - pow(product, fresnelPower) : pow(product, fresnelPower);

					return factor;
				}
			`;
            }
        }

		/**
		* Shader code snippets for fragment parameters
		*/
        export class ShadowMapping {
			/**
			* Vertex shadow map params
			*/
            static vertParams(): string {
                return `
				#ifdef SHADOW_MAPPING
                	varying vec4 vShadowCoord[MAX_SHADOWS];
                	varying vec4 vShadowWorldPos[MAX_SHADOWS];
					uniform mat4 shadowMatrix[MAX_SHADOWS];
                #endif
			`;
            }

			/**
			* Vertex shadow map main
			*/
            static vertMain(): string {
                return `
				#ifdef SHADOW_MAPPING
                	for(int i = 0; i < MAX_SHADOWS; i ++ )
					{
                		vShadowCoord[i] = shadowMatrix[i] * worldPosition;
                		vShadowWorldPos[i] = worldPosition;
                		shadowMatrix[i] * worldPosition;
					}
                #endif
			`;
            }

			/**
			* Fragment shadow map params
			*/
            static fragParams(): string {
                return `
				#ifdef SHADOW_MAPPING

                	uniform sampler2D shadowMap[MAX_SHADOWS];
                	uniform float shadowMapSize[MAX_SHADOWS];
                	uniform float shadowDarkness[MAX_SHADOWS];
                	uniform float shadowBias[MAX_SHADOWS];
                	varying vec4 vShadowCoord[MAX_SHADOWS];
                	varying vec4 vShadowWorldPos[MAX_SHADOWS];

                	#if defined(SHADOW_TYPE_VSM)

                		const float positiveExponent = 40.0;
                		const float negativeExponent = 5.0;
                		vec2 exponents = vec2(positiveExponent, negativeExponent);

                		vec2 warpDepth(float depth)
                		{
                			depth = 2.0 * depth - 1.0;
                			float pos = exp(exponents.x * depth);
                			float neg = -exp(-exponents.y * depth);
                			vec2 wDepth = vec2(pos, neg);
                			return wDepth;
                		}

                		float Chebyshev(vec2 moments, float mean, float minVariance )
                		{
                			float shadow = 1.0;
                			if ( mean <= moments.x )
                			{
                				shadow = 1.0;
                				return shadow;
                			}
                			else
                			{
                				float variance = moments.y - (moments.x * moments.x);
                				variance = max(variance, minVariance);
                				float d = mean - moments.x;
                				shadow = variance / (variance + (d * d));
                				return shadow;
                			}
                		}

                	#else

                		#if !defined(SHADOW_TYPE_VSM)

                			float unpackDepth( const in vec4 rgba_depth )
                			{
                				const vec4 bit_shift = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
                				float depth = dot(rgba_depth, bit_shift);
                				return depth;
                			}

                		#endif

                		#if defined(SHADOW_FILTER_PCF) || defined(SHADOW_FILTER_INTERPOLATED) || defined(SHADOW_FILTER_PCF_SOFT)

							float texture2DCompare(sampler2D depths, vec2 uv, float compare)
                			{
                				vec4 depthSample = texture2D(depths, uv);
                				float depth = unpackDepth(depthSample);
                				return step(compare, depth);
                			}

                		#endif

                		#if defined(SHADOW_FILTER_PCF_SOFT) || defined(SHADOW_FILTER_INTERPOLATED)

                			float texture2DShadowLerp(sampler2D depths, vec2 size, vec2 uv, float compare)
                			{
                				vec2 texelSize = vec2(1.0) / size;
                				vec2 f = fract(uv * size + 0.5);
                				vec2 centroidUV = floor(uv * size + 0.5) / size;

                				float lb = texture2DCompare(depths, centroidUV + texelSize * vec2(0.0, 0.0), compare);
                				float lt = texture2DCompare(depths, centroidUV + texelSize * vec2(0.0, 1.0), compare);
                				float rb = texture2DCompare(depths, centroidUV + texelSize * vec2(1.0, 0.0), compare);
                				float rt = texture2DCompare(depths, centroidUV + texelSize * vec2(1.0, 1.0), compare);
                				float a = mix(lb, lt, f.y);
                				float b = mix(rb, rt, f.y);
                				float c = mix(a, b, f.x);
                				return c;
                			}

                		#endif

                		#if defined(SHADOW_FILTER_PCF)

                			float PCF(sampler2D depths, vec2 size, vec2 uv, float compare)
							{
								float result = 0.0;

                				result += texture2DCompare(depths, uv + vec2(-1.0, -1.0) / size, compare);
                				result += texture2DCompare(depths, uv + vec2(-1.0, 0.0) / size, compare);
                				result += texture2DCompare(depths, uv + vec2(-1.0, 1.0) / size, compare);

                				result += texture2DCompare(depths, uv + vec2(0.0, -1.0) / size, compare);
                				result += texture2DCompare(depths, uv + vec2(0.0, 0.0) / size, compare);
                				result += texture2DCompare(depths, uv + vec2(0.0, 1.0) / size, compare);

                				result += texture2DCompare(depths, uv + vec2(1.0, -1.0) / size, compare);
                				result += texture2DCompare(depths, uv + vec2(1.0, 0.0) / size, compare);
                				result += texture2DCompare(depths, uv + vec2(1.0, 1.0) / size, compare);

								return result / 9.0;
							}

                		#endif

                		#if defined(SHADOW_FILTER_PCF_SOFT)

                			float PCFInterpolated(sampler2D depths, vec2 size, vec2 uv, float compare)
                			{
                				float result = 0.0;

                				result += texture2DShadowLerp(depths, size, uv + vec2(-1.0, -1.0) / size, compare);
                				result += texture2DShadowLerp(depths, size, uv + vec2(-1.0, 0.0) / size, compare);
                				result += texture2DShadowLerp(depths, size, uv + vec2(-1.0, 1.0) / size, compare);

                				result += texture2DShadowLerp(depths, size, uv + vec2(0.0, -1.0) / size, compare);
                				result += texture2DShadowLerp(depths, size, uv + vec2(0.0, 0.0) / size, compare);
                				result += texture2DShadowLerp(depths, size, uv + vec2(0.0, 1.0) / size, compare);

                				result += texture2DShadowLerp(depths, size, uv + vec2(1.0, -1.0) / size, compare);
                				result += texture2DShadowLerp(depths, size, uv + vec2(1.0, 0.0) / size, compare);
                				result += texture2DShadowLerp(depths, size, uv + vec2(1.0, 1.0) / size, compare);

                				return result / 9.0;
                			}

                		#endif
                	#endif
                #endif
			`;
            }

			/**
			* Fragment shadow map main
			*/
            static fragMain(): string {
                return `
				#ifdef SHADOW_MAPPING

					float shadowAmount = 1.0;

					for(int i = 0; i < MAX_SHADOWS; i ++ )
					{
						vec3 shadowCoord = vShadowCoord[i].xyz / vShadowCoord[i].w;
						// if ( something && something ) breaks ATI OpenGL shader compiler
						// if ( all( something, something ) ) using this instead
						bvec4 inFrustumVec = bvec4(shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0);
						bool inFrustum = all(inFrustumVec);

						// don't shadow pixels outside of light frustum
						// use just first frustum (for cascades)
						// don't shadow pixels behind far plane of light frustum
						bool frustumTest = all( bvec2(inFrustum, shadowCoord.z <= 1.0) );

						if(frustumTest)
						{
							// http://gamedev.stackexchange.com/questions/66030/exponential-variance-shadow-mapping-implementation
							#if defined(SHADOW_TYPE_VSM)
								// Suppress warnings
                				shadowMapSize;
								vec4 moments = texture2D(shadowMap[i], shadowCoord.xy);
								vec2 posMoments = vec2(moments.x, moments.z);
								vec2 negMoments = vec2(moments.y, moments.w);
								vec2 wDepth = warpDepth(shadowCoord.z);
                				vec2 depthScale = shadowBias[i] * exponents * wDepth;
								vec2 minVariance = depthScale * depthScale;
								float posResult = Chebyshev(posMoments, wDepth.x, minVariance.x );
								float negResult = Chebyshev(negMoments, wDepth.y, minVariance.y );
								float shadow = min(posResult, negResult);
								shadowAmount = shadowAmount * clamp( shadow + (1.0 - shadowDarkness[i]), 0.0, 1.0 );

							#else
								// Interpolated Filtering
								#if defined(SHADOW_FILTER_INTERPOLATED)
                					float illuminated = texture2DShadowLerp( shadowMap[i], vec2(shadowMapSize[i]), shadowCoord.xy, shadowCoord.z + shadowBias[i] );
									shadowAmount = shadowAmount * clamp( illuminated + ( 1.0 - shadowDarkness[i] ), 0.0, 1.0 );

								// PCF Filtering
                				#elif defined(SHADOW_FILTER_PCF)
                					float illuminated = PCF( shadowMap[i], vec2(shadowMapSize[i]), shadowCoord.xy, shadowCoord.z + shadowBias[i] );
                					shadowAmount = shadowAmount * clamp( illuminated + ( 1.0 - shadowDarkness[i] ), 0.0, 1.0 );

								// PCF Interpolated Filtering
                				#elif defined(SHADOW_FILTER_PCF_SOFT)
                					float illuminated = PCFInterpolated( shadowMap[i], vec2(shadowMapSize[i]), shadowCoord.xy, shadowCoord.z + shadowBias[i] );
                					shadowAmount = shadowAmount * clamp( illuminated + ( 1.0 - shadowDarkness[i] ), 0.0, 1.0 );

								// No Filtering
                				#else
                					shadowMapSize; // Suppress warnings
                					vec4 rgbaDepth = texture2D(shadowMap[i], shadowCoord.xy);
                					float fDepth = unpackDepth(rgbaDepth);
                					if( fDepth < shadowCoord.z + shadowBias[i] )
                						shadowAmount = shadowAmount * ( 1.0 - shadowDarkness[i] );

                				#endif
                			#endif
						}
					}
				#endif
			`;
            }
        }

		/**
		* Shader code snippets for fragment parameters
		*/
        export class FragParams {
			/**
			* Diffuse map params
			*/
            static map(): string {
                return `
				#ifdef USE_MAP
						uniform sampler2D map;
				#endif
				`;
            }

			/**
			* Tone mapping params
			*/
            static toneMapping(): string {
                return `
					uniform float brightness;
					#if defined( TONEMAP_UNCHARTED )
                		const float A = 0.15;
                		const float B = 0.50;
                		const float C = 0.10;
                		const float D = 0.20;
                		const float E = 0.02;
                		const float F = 0.30;
                		uniform float whiteValue;
                		vec3 tonemap(vec3 x)
                		{
                			return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
                		}
					#endif
				`;
            }

			/**
			* Code that defines the corners of the frustum.
			* See http://mynameismjp.wordpress.com/2009/03/10/reconstructing-position-from-depth/
			*/
            static frustumCorners(): string {
                return `
					varying vec3 frustumCorner;
				`;
            }



			/**
			* Code to get eye to pixel ray in viewspace
			*/
            static eyeRayVS(): string {
                return `
				uniform mat4 invProjectionMatrix;

                vec3 eyeRayVS( float frameWidth, float frameHeight )
				{
                	vec2 fragCoordinate = gl_FragCoord.xy / vec2(frameWidth, frameHeight);
                	fragCoordinate = ( fragCoordinate - 0.5 ) * 2.0;
                	vec4 deviceNormal = vec4( fragCoordinate, 0.0, 1.0);
                	vec3 eyeDirection = normalize((invProjectionMatrix * deviceNormal).xyz);
                	return eyeDirection;
                }
			`;
            }

			/**
			* dashed line parameters
			*/
            static dashes(): string {
                return `
				#ifdef DASH
				    uniform float dashAmount;
				    varying float lengthSoFar;
				#endif
			`;
            }

			/**
			* The common uniform and varying declarations used by fragment shaders.
			* These can be turned on and off by using DEFINE statements.
			*/
            static defaults(): string {
                return `
					#ifdef STANDARD_DERIVATIVES
						#extension GL_OES_standard_derivatives : enable
						#extension OES_half_float_linear : enable
					#endif

					#ifdef ATTR_COLOR
						varying vec4 vColor;
					#endif

					#ifdef ATTR_UV
						varying vec2 vUv;
					#endif

					#ifdef ATTR_NORMAL
						varying vec3 vNormal;
					#endif

					#if defined(ATTR_NORMAL) || defined(FORWARD_NORMAL)
						varying vec3 normalView;
					#endif

					#ifdef USE_BUMPMAP
                		varying vec3 vViewPosition;
					#endif

					#if defined(REFRACTION_MAP) || defined(REFLECTION_MAP)
						varying vec4 clipPos;
					#endif

					#if defined(PASS_GBUFFER2)
						varying float vDepth;
					#endif

					#if defined(PASS_GBUFFER)

                		#if defined(REFRACTION_MAP) || defined(REFLECTION_MAP)
                			uniform float viewHeight;
                			uniform float viewWidth;
                		#endif

					#elif defined(PASS_GBUFFER2)
						uniform float opacity;

                		#ifdef TRANSLUCENCY_ENABLED
                			uniform float translucencyScale;
                			uniform float translucencyDistortion;
                			uniform float translucencyPower;
                			#ifdef TRANSLUCENCY_MAP
                				uniform sampler2D translucencyMap;
                			#endif
                		#endif

					#endif

					#if defined(PASS_SHADOW) && !defined(SHADOW_TYPE_VSM)

                		vec4 pack_depth( const in float depth )
						{
                			const vec4 bit_shift = vec4( 256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0 );
                			const vec4 bit_mask = vec4( 0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0 );
                			vec4 res = mod( depth * bit_shift * vec4( 255 ), vec4( 256 ) ) / vec4( 255 );
                			res -= res.xxyz * bit_mask;
                			return res;
                		}

					#endif
				`;
            }

			/**
			* The common uniform and varying declarations used by fragment shaders for custom clip mapping
			*/
            static clippingParams(): string {
                return `
					varying vec4 vEyePosition;
					uniform float customClipping;
					uniform vec4 customClipPlane;
				`;
            }

			/**
			* Reflection parameter declarations
			*/
            static reflectionParams(): string {
                return `
					#ifdef REFLECTION_MAP
                		uniform sampler2D reflectionSampler;
                		uniform float mirrorDistortion;
                		uniform float mirrorReflectivity;
                		varying vec4 mirrorCoord;
					#endif
				`;
            }

			/**
			* Refraction parameter declarations
			*/
            static refractionParams(): string {
                return `
					#ifdef REFRACTION_MAP
							uniform sampler2D gBuffer2;
                			uniform sampler2D compositionPass;
                			uniform float refractionDistortion;
                			uniform float refractionReflectivity;
                			uniform float cameraFar;
                		#endif
				`;
            }


			/**
			* Bump Map parameter declarations
			*/
            static bumpmapUniforms(): string {
                return `
					#ifdef USE_BUMPMAP
						uniform sampler2D bumpMap;
						uniform float bumpScale;
					#endif
				`;
            }


            static saturate(): string {
                return `
				vec3 saturate(vec3 rgb, float adjustment)
					{
						// Algorithm from Chapter 16 of OpenGL Shading Language
                		const vec3 W = vec3(0.2125, 0.7154, 0.0721);
                		vec3 intensity = vec3(dot(rgb, W));
                		return mix(intensity, rgb, adjustment);
					}
				`;
            }

			/**
			* Encodes a 3d normalized normal and makes it into a 2d spherical normal
			* http://mynameismjp.wordpress.com/2009/06/17/storing-normals-using-spherical-coordinates/
			*/
            static encodeNormal(): string {
                return `
					vec2 encodeNormalCrysis( vec3 cartesian )
					{
						vec2 spherical;
						spherical.x = atan( cartesian.y, cartesian.x ) / 3.14159;
						spherical.y = cartesian.z;
						return spherical * 0.5 + 0.5;
					}

					// encodes a 3 component normal vector to a 2 component normal vector
					//(untested - you may need to swap the normal http://pixellight.sourceforge.net/docs/PixelLightCompositing.pdf)
					vec2 encodeNormalVector( vec3 normal )
					{
						float p = sqrt( normal.z * 8.0 + 8.0);
						return vec2( normal.xy / p + 0.5 );
					}
				`;
            }


			/**
			* Takes a 2d spherical and converts it to a 3d cartesian one
			* http://mynameismjp.wordpress.com/2009/06/17/storing-normals-using-spherical-coordinates/
			*/
            static decodeNormal(): string {
                return `
					vec3 decodeNormalCrysis( vec2 spherical )
						{
							vec2 sinCosTheta, sinCosPhi;

							spherical = spherical * 2.0 - 1.0;
							float angle = spherical.x * 3.14159;
							sinCosTheta.x = sin(angle);
							sinCosTheta.y = cos(angle);
							sinCosPhi = vec2( sqrt( 1.0 - spherical.y * spherical.y ), spherical.y);

							return vec3( sinCosTheta.y * sinCosPhi.x, sinCosTheta.x * sinCosPhi.x, sinCosPhi.y );
						}

						// decodes a 2 component normal vector to a 3 component normal vector
						//(untested - you may need to swap the normal http://pixellight.sourceforge.net/docs/PixelLightCompositing.pdf)
						vec3 decodeNormalVector( vec2 normal )
						{
							vec2 fenc = normal * 4.0 - 2.0;
							float f = dot(fenc, fenc);
							float g = sqrt( 1.0 - f / 4.0 );
							vec3 n;
							n.xy = fenc * g;
							n.z = 1.0 - f / 2.0;
							return n;
						}
				`;
            }


			/**
			* Code that converts a Vec3 to a float in a shader
			*/
            static vecToFloat(): string {
                return `
					const float unit = 255.0/256.0;

					float vec3_to_float( vec3 data )
					{
						//	In order for the compression to work, the data must be in the 0 to 1 range
						vec3 compressedData = clamp(data, vec3(0.0), vec3(1.0));
                		compressedData = 0.999 * compressedData;
						highp float compressed = fract( compressedData.x * unit ) + floor( compressedData.y * unit * 255.0 ) + floor( compressedData.z * unit * 255.0 ) * 255.0;
						return compressed;
					}
				`;
            }


			/**
			* Code that converts a float to a Vec3 in a shader
			*/
            static floatToVec(): string {
                return `
				vec3 float_to_vec3( float data )
					{
						vec3 uncompressed;
						uncompressed.x = fract( data );
						float zInt = floor( data / 255.0 );
						uncompressed.z = fract( zInt / 255.0 );
						uncompressed.y = fract( floor( data - ( zInt * 255.0 ) ) / 255.0 );
						return uncompressed;
					}
				`;
            }

			/**
			* Bump Map parameter declarations
			*/
            static bumpmapFunctions(): string {
                return `
			#ifdef USE_BUMPMAP

					// Derivative maps - bump mapping unparametrized surfaces by Morten Mikkelsen
					// http://mmikkelsen3d.blogspot.sk/2011/07/derivative-maps.html
					// Evaluate the derivative of the height w.r.t. screen-space using forward differencing (listing 2)
					vec2 dHdxy_fwd( vec2 uv, sampler2D bumps, float bScale )
					{
						vec2 dSTdx = dFdx( uv );
						vec2 dSTdy = dFdy( uv );
						float Hll = bScale * texture2D( bumps, uv ).x;
						float dBx = bScale * texture2D( bumps, uv + dSTdx ).x - Hll;
						float dBy = bScale * texture2D( bumps, uv + dSTdy ).x - Hll;
						return vec2( dBx, dBy );
					}


					vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy )
					{
						vec3 vSigmaX = dFdx( surf_pos );
						vec3 vSigmaY = dFdy( surf_pos );
						vec3 vN = surf_norm;

						vec3 R1 = cross( vSigmaY, vN );
						vec3 R2 = cross( vN, vSigmaX );

						float fDet = dot( vSigmaX, R1 );

						vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
						return normalize( abs( fDet ) * surf_norm - vGrad );
					}

				#endif
			`;
            }

			/**
			* Environment map parameters
			*/
            static environmentMapping(): string {
                return `
				#ifdef USE_ENV_MAP
                		varying vec3 vWorldPosition;
                		uniform float chromeReflectivity;
                		uniform samplerCube envMap;
                		uniform float flipEnvMap;
                		uniform int combine;
                		uniform float useRefract;
                		uniform float refractionRatio;
                		uniform vec3 cameraPosition;
						uniform mat4 viewMatrix;
					#endif
				`;
            }
        }

		/**
		* Shader code snippets for the fragment shader main function
		*/
        export class FragMain {
			/**
			* Disregards fragments for a custom clip plane
			*/
            static clippingTest(): string {
                return `
					if ( customClipping === 1.0 && dot( vEyePosition, customClipPlane ) < 0.0 ) discard;
				`;
            }

			/**
			* Tone mapping params
			*/
            static toneMapping(): string {
                return `
					// http://filmicgames.com/archives/75
                	vec3 preToneMap = gl_FragColor.xyz;
                	preToneMap *= brightness;
                	vec3 postToneMap;

                	#if defined( TONEMAP_SIMPLE )
                		postToneMap = sqrt( preToneMap );
                	#elif defined( TONEMAP_LINEAR )
                		postToneMap = pow( preToneMap, vec3( 1.0 / 2.2 ) );
                	#elif defined( TONEMAP_REINHARD )
                		preToneMap = preToneMap / ( 1.0 + preToneMap );
                		postToneMap = pow( preToneMap, vec3( 1.0 / 2.2 ) );
                	#elif defined( TONEMAP_FILMIC )
                		vec3 x = max( vec3( 0.0 ), preToneMap - 0.004 );
                		postToneMap = ( x * ( 6.2 * x + 0.5 ) ) / ( x * ( 6.2 * x + 1.7 ) + 0.06 );
                	#elif defined( TONEMAP_UNCHARTED )
                		float ExposureBias = 2.0;
                		vec3 curr = tonemap(ExposureBias * preToneMap );
                		vec3 whiteScale = vec3(1.0) / tonemap(vec3(whiteValue));
                		vec3 color = curr * whiteScale;
                		postToneMap = pow(color, vec3(1.0 / 2.2));
                	#else
                		postToneMap = pow( preToneMap, vec3(1.0 / 2.2));;
                	#endif

					gl_FragColor.xyz = postToneMap;
				`;
            }

			/**
			* Adds reflection contributions to a texelColor
			*/
            static reflection(): string {
                return `
					#ifdef REFLECTION_MAP
						vec2 mirrorDistortedUV = (normal.xz * mirrorDistortion);

                		vec4 r2Distortion = vec4( mirrorDistortedUV.x, 0.0, mirrorDistortedUV.y, 0.0 );
                		vec3 mirrorSample = texture2DProj(reflectionSampler, mirrorCoord + r2Distortion ).xyz;

						// Multiply
                		if (MIRROR_METHOD === 1.0)
							texelColor.xyz = mix( texelColor.xyz, texelColor.xyz * mirrorSample, mirrorReflectivity );

						// Mix
						else
                			texelColor.xyz = mix( texelColor.xyz, mirrorSample, mirrorReflectivity );
                	#endif
				`;
            }

			/**
			* Adds refraction contributions to a texelColor
			*/
            static refraction(): string {
                return `
					#ifdef REFRACTION_MAP

                		vec2 screenUV = ( gl_FragCoord.xy / vec2(viewWidth, viewHeight) );
                		vec4 gBuffer2Sample = texture2D( gBuffer2, screenUV );
                		float worldDepth = gBuffer2Sample.z;
                		float currentDepth = clipPos.z / cameraFar;

                		vec4 r1Distortion = vec4( normal * refractionDistortion, 0.0 );
                		vec2 distortedUv = screenUV - r1Distortion.xz;
						gBuffer2Sample = texture2D( gBuffer2, distortedUv );
                		float distortedDepth = gBuffer2Sample.z;

						// Makes sure the distortion of the refraction does not happen if the
						// object is in front of the material being drawn
                		if ( distortedDepth < currentDepth )
                		{
                			r1Distortion.x = 0.0;
                			r1Distortion.y = 0.0;
                			r1Distortion.z = 0.0;
               			}

                		vec3 r3 = vec3(texture2D(compositionPass, distortedUv ));

						// Filmic tone map
						// r3 = max( vec3( 0.0 ), r3 - 0.004 );
                		// r3 = ( r3 * ( 6.2 * r3 + 0.5 ) ) / ( r3 * ( 6.2 * r3 + 1.7 ) + 0.06 );

                		if ( REFRACTION_METHOD === 1.0)
                			texelColor.xyz = mix( texelColor.xyz, texelColor.xyz * r3, refractionReflectivity );
                		else // Mix
                			texelColor.xyz = mix( texelColor.xyz, r3, refractionReflectivity );
                	#endif
				`;
            }

			/**
			* Diffuse map alpha testing
			*/
            static alphaTest(): string {
                return `
					#ifdef USE_MAP
						vec4 texelColor = texture2D( map, vUv );
						#ifdef ALPHATEST
							if ( texelColor.a < ALPHATEST ) discard;
						#endif
					#endif
				`;
            }

			/**
			* line dashes compuations
			*/
            static dashes(): string {
                return `
				#ifdef DASH
				    if ( floor( 2.0 * fract( lengthSoFar * dashAmount )) <= 0.0 )
				        discard;
				#endif
			`;
            }

            static packTranslucency(): string {
                return `
					//	translucency distortion, scale, power
						#ifdef TRANSLUCENCY_ENABLED
							float transValue = translucencyScale;
							#ifdef TRANSLUCENCY_MAP
								vec4 texelTranslucency = texture2D( translucencyMap, vUv ) * translucencyScale;
								transValue = texelTranslucency.r;
							#endif
							gl_FragColor.y = vec3_to_float( vec3( translucencyDistortion, transValue, translucencyPower ) );
						#else
							gl_FragColor.y = 0.0;
						#endif
				`;
            }

			/**
			* Gets the texture coordinates for a screen quad
			*/
            static quadTexCoord(): string {
                return `
					vec2 texCoord = gl_FragCoord.xy / vec2( viewWidth, viewHeight );
				`;
            }

			/**
			* Computes the position of a fragment to view/eye space
			* See http://mynameismjp.wordpress.com/2009/03/10/reconstructing-position-from-depth/
			*/
            static computeVertexPositionVS(): string {
                return `
					vec4 gBuffer2Sample = texture2D( gBuffer2, texCoord );
					float normalizedDepth = gBuffer2Sample.z;

					#ifdef QUAD_LIGHTING
						vec4 vertexPositionVS = vec4( normalizedDepth * frustumCorner, 1.0 );
					#else
						vec3 frustumRay = vertVS.xyz * (cameraFar / -vertVS.z);
						vec4 vertexPositionVS = vec4( normalizedDepth * frustumRay, 1.0 );
					#endif
				`;
            }

			/**
			* Unpacks the colours from the deffered render textures
			*/
            static unpackColorMap(): string {
                return `
					vec4 gBufferSample = texture2D( gBuffer, texCoord );
					vec3 freeOpacShininess = float_to_vec3( abs( gBuffer2Sample.w ) );

					vec3 diffuseColor = float_to_vec3( abs( gBufferSample.x ) );
					vec3 specularColor = float_to_vec3( abs( gBufferSample.y ) );
					vec3 emissiveColor = float_to_vec3( abs( gBufferSample.w ) );

					vec3 translucencies = float_to_vec3( abs( gBuffer2Sample.y ) );
					float translucencyDistortion = abs( translucencies.x );
					float translucencyScale = abs( translucencies.y );
					float translucencyPower = abs( translucencies.z );
					float shininess = abs( freeOpacShininess.z ) * 2000.0;
				`;
            }


			/**
			* Environment computations
			*/
            static environmentMapping(): string {
                return `
				#ifdef USE_ENV_MAP
				    vec3 reflectVec;

				    vec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );


					vec3 worldNormal = normalize( vec3( vec4(normal, 0.0) * viewMatrix ) );


				    if ( useRefract === 1.0 )
				        reflectVec = refract( cameraToVertex, worldNormal, refractionRatio );
				    else
				        reflectVec = reflect( cameraToVertex, worldNormal );

				    #ifdef DOUBLE_SIDED
				        float flipNormal = ( -1.0 + 2.0 * float( gl_FrontFacing ) );
				        vec4 cubeColor = textureCube( envMap, flipNormal * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
				    #else
				        vec4 cubeColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
				    #endif

					// Multiply
                	if (CHROME_METHOD === 1.0)
                		texelColor.xyz = mix( texelColor.xyz, texelColor.xyz * cubeColor.xyz, chromeReflectivity );

					// Mix
					else
                		texelColor.xyz = mix( texelColor.xyz, cubeColor.xyz, chromeReflectivity );
				#endif
			`;
            }

			/**
			* Compute the diffuse light component
			*/
            static computeDiffuse(): string {
                return `
					float dotProduct = dot( normal, lightVector );
					float diffuseFull = max( dotProduct, 0.0 );
					vec3 diffuse = vec3( diffuseFull );
				`;
            }


			/**
			* Compute the diffuse light for the materials translucency
			*/
            static computeTranslucency(): string {
                return `
				float translucencyFactor = 0.0;
				if (translucencyPower > 0.0)
				{
					vec3 translucencyNormal = normalize( lightVector + ( normal * translucencyDistortion ) );
					float translucencyDot = pow( clamp( dot( normalize( -vertexPositionVS.xyz ), -translucencyNormal ), 0.0, 1.0 ), translucencyPower * 100.0 ) * translucencyIntensity;
					translucencyFactor = attenuation * translucencyDot * translucencyScale;
				}`;
            }

			/**
			* Compute the specular component of the light equation
			*/
            static computeSpecular(): string {
                return `
					vec3 halfVector = normalize( lightVector - normalize( vertexPositionVS.xyz ) );
					float dotNormalHalf = max( dot( normal, halfVector ), 0.0 );
					float specularNormalization = (shininess + 2.0001) / 8.0;
					vec3 schlick = specularColor + vec3(1.0 - specularColor) * pow( 1.0 - dot(lightVector, halfVector), 5.0);
					vec3 specular = (schlick * max(pow(dotNormalHalf, shininess), 0.0) * diffuse * specularNormalization) * specularColor;
				`;
            }

			/**
			* Combines the lighting components
			*/
            static combineLighting(): string {
                return `
					vec3 textureMap = float_to_vec3( abs( gBufferSample.z ) );

					// Gama correction http://filmicgames.com/archives/299
					#if defined(GAMA_INPUT)
                		textureMap = textureMap * textureMap;
					#endif

					vec3 light = lightIntensity * lightColor;
					gl_FragColor = vec4( light * ( diffuseColor * diffuse  * attenuation * textureMap + specular ) * attenuation, 1.0 );

					// translucency
					gl_FragColor.xyz += diffuseColor * translucencyColor * translucencyFactor * textureMap;
				`;
            }

			/**
			* Computes the normal of a fragment
			*/
            static computeNormal(): string {
                return `vec3 normal = normalize( float_to_vec3( abs( gBuffer2Sample.x ) ) * 2.0 - 1.0 ); `;
            }
        }

		/**
		* Shader code snippets for the vertex shader main function
		*/
        export class VertMain {
			/**
			* Computes the vertex defaults
			*/
            static defaults(): string {
                return `
				#ifdef ATTR_COLOR
				    vColor = color;
				#endif

				#ifdef ATTR_UV
				    vUv = uv * uvScale;
				#endif

				#ifdef ATTR_POSITION

				    vec4 mvPosition;

					#ifdef USE_SKINNING
						mvPosition = modelViewMatrix * skinned;
					#endif

					#if !defined( USE_SKINNING ) && defined( USE_MORPHTARGETS )
						mvPosition = modelViewMatrix * vec4( morphed, 1.0 );
					#endif

					#if !defined( USE_SKINNING ) && ! defined( USE_MORPHTARGETS )
						mvPosition = modelViewMatrix * vec4( position, 1.0 );
					#endif

					gl_Position = projectionMatrix * mvPosition;

				#endif

				#ifdef ATTR_NORMAL
				    vec3 objectNormal;

				    #ifdef USE_SKINNING
				        objectNormal = skinnedNormal.xyz;
				    #endif

				    #if !defined( USE_SKINNING ) && defined( USE_MORPHNORMALS )
				        objectNormal = morphedNormal;
				    #endif

				    #if !defined( USE_SKINNING ) && ! defined( USE_MORPHNORMALS )
				        objectNormal = normal;
				    #endif

				    #ifdef FLIP_SIDED
				        objectNormal = -objectNormal;
				    #endif

				    vec3 transformedNormal = normalMatrix * objectNormal;
				    transformedNormal = normalize( transformedNormal );
				    vNormal = transformedNormal;

				#endif

                #if defined(USE_ENV_MAP) || defined(REFLECTION_MAP) || defined(SHADOW_MAPPING)
                	#ifdef USE_SKINNING
                		vec4 worldPosition = modelMatrix * vec4( skinned.xyz, 1.0 );
                	 #else
                		vec4 worldPosition = modelMatrix *  vec4( position, 1.0 );
                	#endif
                #endif

                #ifdef USE_BUMPMAP
                	vViewPosition = -mvPosition.xyz;
                #endif
			`;
            }

			/**
			* Computes the clip position for refraction
			*/
            static refraction(): string {
                return `
				    #if defined(REFRACTION_MAP)
                		clipPos = gl_Position;
                    #endif
				`;
            }

			/**
			* Computes the clipping defaults. Used for custom clip planes.
			*/
            static clipping(): string {
                return `vEyePosition = mvPosition;`;
            }


			/**
			* Computes the environment map computations
			*/
            static reflection(): string {
                return `
					#if defined(REFLECTION_MAP)
                		mirrorCoord = textureMatrix * worldPosition;
					#endif
				`;
            }

			/**
			* Computes the environment map computations
			*/
            static environmentMapping(): string {
                return `
					#if defined(USE_ENV_MAP)
                		vWorldPosition = worldPosition.xyz;
					#endif
				`;
            }

			/**
			* Computes the dash length
			*/
            static dash(): string {
                return `
					#ifdef DASH
						lengthSoFar = distance;
					#endif
				`;
            }


			/**
			* Assigns the frustum corner for the targeted vertex
			* See http://mynameismjp.wordpress.com/2009/03/10/reconstructing-position-from-depth/
			*/
            static frustumCorners(): string {
                return `
					frustumCorner = frustumCorners[int( frustumCornerIndex )];
				`;
            }

			/**
			* Makes sure that the gl_position is within its the defined boundaries
			*/
            static checkBoundaries(): string {
                return `
				if (limitScreenQuad === 1.0)
				{
					if ( gl_Position.x < minMax.x ) gl_Position.x = minMax.x;
					else if ( gl_Position.x > minMax.z ) gl_Position.x = minMax.z;
					if ( gl_Position.y > minMax.w ) gl_Position.y = minMax.w;
					else if ( gl_Position.y < minMax.y ) gl_Position.y = minMax.y;
				}
			`;
            }

			/**
			* The vertex main function variables for skinned meshes
			*/
            static skin(): string {
                return `
				#ifdef USE_SKINNING
					mat4 boneMatX = getBoneMatrix( skinIndex.x );
					#if BONE_INFLUENCES > 1
						mat4 boneMatY = getBoneMatrix( skinIndex.y );
					#endif
					#if BONE_INFLUENCES > 2
						mat4 boneMatZ = getBoneMatrix( skinIndex.z );
					#endif
					#if BONE_INFLUENCES > 3
						mat4 boneMatW = getBoneMatrix( skinIndex.w );
					#endif
				#endif
			`;
            }

			/**
			* The normal transformations of skinned meshes
			*/
            static skinTransformNormals(): string {
                return `
				#ifdef ATTR_NORMAL
				    #ifdef USE_SKINNING
						mat4 skinMatrix = skinWeight.x * boneMatX;

						#if BONE_INFLUENCES > 1
							skinMatrix 	+= skinWeight.y * boneMatY;
						#endif
						#if BONE_INFLUENCES > 2
							skinMatrix 	+= skinWeight.z * boneMatZ;
						#endif
						#if BONE_INFLUENCES > 3
							skinMatrix 	+= skinWeight.w * boneMatW;
						#endif

						#ifdef USE_MORPHNORMALS
							vec4 skinnedNormal = skinMatrix * vec4( morphedNormal, 0.0 );
						#else
							vec4 skinnedNormal = skinMatrix * vec4( normal, 0.0 );
						#endif
				    #endif
				#endif
			`;
            }

			/**
			* The vertex position transformations of skinned meshes
			*/
            static skinTransform(): string {
                return `
				#ifdef USE_SKINNING
					#ifdef USE_MORPHTARGETS
						vec4 skinVertex = vec4( morphed, 1.0 );
					#else
						vec4 skinVertex = vec4( position, 1.0 );
					#endif

					vec4 skinned  = boneMatX * skinVertex * skinWeight.x;

					#if BONE_INFLUENCES > 1
						skinned += boneMatY * skinVertex * skinWeight.y;
					#endif
					#if BONE_INFLUENCES > 2
						skinned += boneMatZ * skinVertex * skinWeight.z;
					#endif
					#if BONE_INFLUENCES > 3
						skinned += boneMatW * skinVertex * skinWeight.w;
					#endif
				#endif
			`;
            }
        }

		/**
		* Shader code snippets for vertex parameters
		*/
        export class VertParams {
			/**
			* The common attribute and varying declarations for the vertex shader.
			* These can be turned on and off by using DEFINE statements.
			*/
            static defaults(): string {
                return `
				uniform mat4 modelViewMatrix;
				uniform mat4 projectionMatrix;

                #if defined(USE_ENV_MAP) || defined(REFLECTION_MAP) || defined(SHADOW_MAPPING)
                	uniform mat4 modelMatrix;
				#endif

				#ifdef ATTR_POSITION
				    attribute vec3 position;
				#endif

				#ifdef ATTR_COLOR
					attribute vec4 color;
					varying vec4 vColor;
				#endif

				#ifdef ATTR_UV
					attribute vec2 uv;
					varying vec2 vUv;
					uniform vec2 uvScale;
				#endif

				#ifdef ATTR_NORMAL
					uniform mat3 normalMatrix;
					attribute vec3 normal;
					varying vec3 vNormal;
				#endif

                #if defined(ATTR_NORMAL) || defined(FORWARD_NORMAL)
                	varying vec3 normalView;
                #endif

                #ifdef USE_BUMPMAP
                	varying vec3 vViewPosition;
                #endif

                #if defined(PASS_GBUFFER2)
                    uniform float cameraFar;
                #endif

                #if defined(REFRACTION_MAP) || defined(REFLECTION_MAP)
                    varying vec4 clipPos;
                #endif

				#if defined(PASS_GBUFFER2)
                    varying float vDepth;
                #endif
			`;
            }

			/**
			* The common attribute and varying declarations for refractions
			*/
            static reflectionParams(): string {
                return `
				#ifdef REFLECTION_MAP
                	uniform mat4 textureMatrix;
                	varying vec4 mirrorCoord;
                #endif
			`;
            }

			/**
			* The common attribute and varying declarations for the vertex shader clip mapping variables
			*/
            static clippingParameters(): string {
                return `varying vec4 vEyePosition;`;
            }

			/**
			* Code that defines the corners of the frustum
			* See http://mynameismjp.wordpress.com/2009/03/10/reconstructing-position-from-depth/
			*/
            static frustumCorners(): string {
                return `
				uniform vec3 frustumCorners[8];
				varying vec3 frustumCorner;
				attribute float frustumCornerIndex;
			`;
            }

			/**
			* Code that defines the min/max boundaries of a scren quad
			*/
            static screenQuadBoundaries(): string {
                return `
				uniform vec4 minMax;
				uniform float limitScreenQuad;
			`;
            }

			/**
			* Variables for the environment maps effect
			*/
            static envMap(): string {
                return `
				#ifdef USE_ENV_MAP
				    varying vec3 vWorldPosition;
				#endif
			`;
            }

			/**
			* Variables for the line dashes
			*/
            static dash(): string {
                return `
				#ifdef DASH
				    attribute float distance;
				    varying float lengthSoFar;
				#endif
			`;
            }

			/**
			* The vertex declarations for skinned meshes
			*/
            static skinDeclarations(): string {
                return `
				#ifdef USE_SKINNING

				    uniform sampler2D boneTexture;
				    uniform int boneTextureWidth;
				    uniform int boneTextureHeight;

				    attribute vec4 skinIndex;
				    attribute vec4 skinWeight;

				    mat4 getBoneMatrix( const in float i ) {

				    float j = i * 4.0;
				    float x = mod( j, float( boneTextureWidth ) );
				    float y = floor( j / float( boneTextureWidth ) );

				    float dx = 1.0 / float( boneTextureWidth );
				    float dy = 1.0 / float( boneTextureHeight );

				    y = dy * ( y + 0.5 );

				    vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
				    vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
				    vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
				    vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );

				    mat4 bone = mat4( v1, v2, v3, v4 );

				    return bone;
				}

				#endif
			`;
            }
        }

		/**
		* Shader code snippets for GLSL noise
		* See https://github.com/ashima/webgl-noise for more
		* Authors Ian McEwan, Ashima Arts.
		*/
        export class NoiseFunctions {
            static simplex4D(): string {
                return `
				vec4 mod289( vec4 x )
				{
					return x - floor( x * ( 1.0 / 289.0 ) ) * 289.0;
				}

				float mod289( float x )
				{
					return x - floor( x * ( 1.0 / 289.0 ) ) * 289.0;
				}

				vec4 permute( vec4 x )
				{
					return mod289( ( ( x * 34.0 ) + 1.0 ) * x);
				}

				float permute( float x )
				{
					return mod289( ( ( x * 34.0 ) + 1.0 ) * x);
				}

				vec4 taylorInvSqrt( vec4 r )
				{
					return 1.79284291400159 - 0.85373472095314 * r;
				}

				float taylorInvSqrt( float r )
				{
					return 1.79284291400159 - 0.85373472095314 * r;
				}

				vec4 grad4( float j, vec4 ip )
				{
					const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
					vec4 p,s;

					p.xyz = floor( fract( vec3( j ) * ip.xyz ) * 7.0 ) * ip.z - 1.0;
					p.w = 1.5 - dot( abs( p.xyz ), ones.xyz);
					s = vec4( lessThan( p, vec4( 0.0 ) ));
					p.xyz = p.xyz + ( s.xyz * 2.0 - 1.0 ) * s.www;

					return p;
				}

				// (sqrt(5) - 1)/4 = F4, used once below
				#define F4 0.309016994374947451

				float snoise( vec4 v )
				{
					const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4
					0.276393202250021,  // 2 * G4
					0.414589803375032,  // 3 * G4
					-0.447213595499958 ); // -1 + 4 * G4

					// First corner
					vec4 i = floor( v + dot( v, vec4( F4 ) ) );
					vec4 x0 = v - i + dot( i, C.xxxx );

					// Other corners
					// Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
					vec4 i0;
					vec3 isX = step( x0.yzw, x0.xxx );
					vec3 isYZ = step( x0.zww, x0.yyz );
					i0.x = isX.x + isX.y + isX.z;
					i0.yzw = 1.0 - isX;
					i0.y += isYZ.x + isYZ.y;
					i0.zw += 1.0 - isYZ.xy;
					i0.z += isYZ.z;
					i0.w += 1.0 - isYZ.z;

					// i0 now contains the unique values 0,1,2,3 in each channel
					vec4 i3 = clamp( i0, 0.0, 1.0 );
					vec4 i2 = clamp( i0 - 1.0, 0.0, 1.0 );
					vec4 i1 = clamp( i0 - 2.0, 0.0, 1.0 );

					vec4 x1 = x0 - i1 + C.xxxx;
					vec4 x2 = x0 - i2 + C.yyyy;
					vec4 x3 = x0 - i3 + C.zzzz;
					vec4 x4 = x0 + C.wwww;

					// Permutations
					i = mod289( i );
					float j0 = permute( permute( permute( permute( i.w ) + i.z ) + i.y ) + i.x );
					vec4 j1 = permute( permute( permute( permute(
					i.w + vec4( i1.w, i2.w, i3.w, 1.0 ) )
					+ i.z + vec4( i1.z, i2.z, i3.z, 1.0 ) )
					+ i.y + vec4( i1.y, i2.y, i3.y, 1.0 ) )
					+ i.x + vec4( i1.x, i2.x, i3.x, 1.0 ) );

					// Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
					// 7*7*6 = 294, which is close to the ring size 17*17 = 289.
					vec4 ip = vec4( 1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0 );

					vec4 p0 = grad4( j0, ip );
					vec4 p1 = grad4( j1.x, ip );
					vec4 p2 = grad4( j1.y, ip );
					vec4 p3 = grad4( j1.z, ip );
					vec4 p4 = grad4( j1.w, ip );

					// Normalise gradients
					vec4 norm = taylorInvSqrt( vec4( dot( p0, p0 ), dot( p1, p1 ), dot( p2, p2 ), dot( p3, p3 ) ) );
					p0 *= norm.x;
					p1 *= norm.y;
					p2 *= norm.z;
					p3 *= norm.w;
					p4 *= taylorInvSqrt( dot( p4, p4 ) );


					// Mix contributions from the five corners
					vec3 m0 = max( 0.6 - vec3( dot( x0, x0 ), dot( x1, x1 ), dot( x2, x2 ) ), 0.0 );
					vec2 m1 = max( 0.6 - vec2( dot( x3, x3 ), dot( x4, x4 ) ), 0.0 );
					m0 = m0 * m0;
					m1 = m1 * m1;
					return 49.0 * ( dot( m0 * m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 ) ) )
					+ dot( m1 * m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) );
				}
			`;
            }

            static simplex2D(): string {
                return `
				vec3 mod289( vec3 x )
				{
					return x - floor( x * ( 1.0 / 289.0 ) ) * 289.0;
				}

				vec2 mod289( vec2 x )
				{
					return x - floor( x * ( 1.0 / 289.0 ) ) * 289.0;
				}

				vec3 permute( vec3 x )
				{
					return mod289( ( ( x * 34.0 ) + 1.0 ) * x);
				}

				float snoise( vec2 v )
				{
					const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
					0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
					-0.577350269189626,  // -1.0 + 2.0 * C.x
					0.024390243902439); // 1.0 / 41.0

					// First corner
					vec2 i = floor( v + dot( v, C.yy ) );
					vec2 x0 = v - i + dot(i, C.xx);

					// Other corners
					vec2 i1;
					i1 = ( x0.x > x0.y ) ? vec2( 1.0, 0.0 ) : vec2(0.0, 1.0);
					vec4 x12 = x0.xyxy + C.xxzz;
					x12.xy -= i1;

					// Permutations
					i = mod289(i); // Avoid truncation effects in permutation
					vec3 p = permute( permute( i.y + vec3( 0.0, i1.y, 1.0 ) )
					+ i.x + vec3( 0.0, i1.x, 1.0 ));

					vec3 m = max( 0.5 - vec3( dot( x0, x0 ), dot( x12.xy, x12.xy ), dot( x12.zw, x12.zw ) ), 0.0);
					m = m*m ;
					m = m*m ;

					// Gradients: 41 points uniformly over a line, mapped onto a diamond.
					// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
					vec3 x = 2.0 * fract( p * C.www ) - 1.0;
					vec3 h = abs( x ) - 0.5;
					vec3 ox = floor( x + 0.5);
					vec3 a0 = x - ox;

					// Normalise gradients implicitly by scaling m
					// Approximation of: m *= inversesqrt( a0*a0 + h*h );
					m *= 1.79284291400159 - 0.85373472095314 * ( a0 * a0 + h * h );

					// Compute final noise value at P
					vec3 g;
					g.x = a0.x * x0.x + h.x * x0.y;
					g.yz = a0.yz * x12.xz + h.yz * x12.yw;
					return 130.0 * dot( m, g );
				}
			`;
            }

            static simplex3D(): string {
                return `
				vec3 mod289( vec3 x )
				{
					return x - floor( x * ( 1.0 / 289.0 ) ) * 289.0;
				}

				vec4 mod289( vec4 x )
				{
					return x - floor( x * ( 1.0 / 289.0 ) ) * 289.0;
				}

				vec4 permute( vec4 x )
				{
					return mod289( ( ( x * 34.0 ) + 1.0 ) * x);
				}

				vec4 taylorInvSqrt( vec4 r )
				{
					return 1.79284291400159 - 0.85373472095314 * r;
				}

				float snoise( vec3 v )
				{
					const vec2  C = vec2( 1.0 / 6.0, 1.0 / 3.0) ;
					const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

					// First corner
					vec3 i = floor( v + dot( v, C.yyy ) );
					vec3 x0 = v - i + dot(i, C.xxx) ;

					// Other corners
					vec3 g = step( x0.yzx, x0.xyz);
					vec3 l = 1.0 - g;
					vec3 i1 = min( g.xyz, l.zxy );
					vec3 i2 = max( g.xyz, l.zxy );

					vec3 x1 = x0 - i1 + C.xxx;
					vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
					vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

					// Permutations
					i = mod289(i);
					vec4 p = permute( permute( permute(
						i.z + vec4( 0.0, i1.z, i2.z, 1.0 ) )
						+ i.y + vec4( 0.0, i1.y, i2.y, 1.0 ) )
						+ i.x + vec4( 0.0, i1.x, i2.x, 1.0 ));

					// Gradients: 7x7 points over a square, mapped onto an octahedron.
					// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
					float n_ = 0.142857142857; // 1.0/7.0
					vec3  ns = n_ * D.wyz - D.xzx;

					vec4 j = p - 49.0 * floor( p * ns.z * ns.z);  //  mod(p,7*7)

					vec4 x_ = floor( j * ns.z);
					vec4 y_ = floor( j - 7.0 * x_ );    // mod(j,N)

					vec4 x = x_ * ns.x + ns.yyyy;
					vec4 y = y_ * ns.x + ns.yyyy;
					vec4 h = 1.0 - abs( x ) - abs(y);

					vec4 b0 = vec4( x.xy, y.xy );
					vec4 b1 = vec4( x.zw, y.zw );

					vec4 s0 = floor( b0 ) * 2.0 + 1.0;
					vec4 s1 = floor( b1 ) * 2.0 + 1.0;
					vec4 sh = -step(h, vec4( 0.0 ));

					vec4 a0 = b0.xzyw + s0.xzyw *sh.xxyy ;
					vec4 a1 = b1.xzyw + s1.xzyw *sh.zzww ;

					vec3 p0 = vec3( a0.xy, h.x);
					vec3 p1 = vec3( a0.zw, h.y);
					vec3 p2 = vec3( a1.xy, h.z);
					vec3 p3 = vec3( a1.zw, h.w);

					// Normalise gradients
					vec4 norm = taylorInvSqrt( vec4( dot( p0, p0 ), dot( p1, p1 ), dot( p2, p2 ), dot( p3, p3 ) ));
					p0 *= norm.x;
					p1 *= norm.y;
					p2 *= norm.z;
					p3 *= norm.w;

					// Mix final noise value
					vec4 m = max( 0.6 - vec4( dot( x0, x0 ), dot( x1, x1 ), dot( x2, x2 ), dot( x3, x3 ) ), 0.0);
					m = m * m;
					return 42.0 * dot( m * m, vec4( dot( p0, x0 ), dot( p1, x1 ),
					dot( p2, x2 ), dot( p3, x3 ) ) );
				}
			`;
            }
        }


		/**
		* Shader code snippets for render passes
		*/
        export class Passes {
            static fragShadowMain(): string {
                return `
				#if defined(PASS_SHADOW)

                	#ifndef POINT_VERTS
						${FragMain.alphaTest()}
                	#endif

                	#if !defined(SHADOW_TYPE_VSM)
						gl_FragColor = pack_depth( gl_FragCoord.z );
                	#else

						// http://gamedev.stackexchange.com/questions/66030/exponential-variance-shadow-mapping-implementation
                		float positiveExponent = 40.0;
						float negativeExponent = 5.0;
						float irbisDepth = gl_FragCoord.z;
						vec2 exponents = vec2(positiveExponent, negativeExponent);
						irbisDepth = 2.0 * irbisDepth - 1.0;
						float pos = exp(exponents.x * irbisDepth);
						float neg = -exp(-exponents.y * irbisDepth);
						vec2 warpDepth = vec2(pos, neg);
						gl_FragColor = vec4(warpDepth, warpDepth * warpDepth);

                	#endif
                #endif
				`;
            }

            static vertNormDepthMain(): string {
                return `
					#ifdef ATTR_NORMAL
                		normalView = normalize( normalMatrix * objectNormal );
					#endif

					#ifdef PASS_GBUFFER2
						#ifdef FORWARD_NORMAL
							normalView = vec3(0.0,0.0,1.0);
						#endif

						vDepth = mvPosition.z / -cameraFar;
					#endif
				`;
            }

            static fragNormDepthMain(): string {
                return `
				#ifdef PASS_GBUFFER2

					float opacityStrength = opacity;
					#ifdef ATTR_ALPHA
						#ifndef SCREEN_UVS
							opacityStrength *= vAlpha;
						#endif
					#endif

					gl_FragColor.w = opacityStrength;

					#ifndef POINT_VERTS
						${ShaderFragments.FragMain.alphaTest()}
						${ShaderFragments.FragMain.dashes()}
					#endif

                	#ifndef CUSTOM_NORMAL
						#ifndef FORWARD_NORMAL
							vec3 normal = normalize( normalView );
						#endif

						#ifdef FORWARD_NORMAL
							#ifdef POINT_VERTS
								#ifdef SCREEN_UVS
									vec3 normal = texture2D( normalMap, vUv ).xyz;
									normal = normal.xyz * 2.0 - 1.0;
								#else
									vec3 normal = vec3( gl_PointCoord.x * 4.0 - 2.0, 2.0 - gl_PointCoord.y * 4.0, 1.0 );
									normal = normalize( normal );
								#endif
							#else
								#ifdef ATTR_UV
									vec2 uvTemp;
									if ( flipUV === 1.0 )
										uvTemp = vec2( 1.0, 1.0 ) - vUv;
									else
										uvTemp = vUv;
									vec3 normal = vec3( uvTemp.x * 4.0 - 2.0, uvTemp.y * 4.0 - 2.0, 1.0 );
									normal = normalize( normal );
								#else
									vec3 normal = vec3( 0.0, 0.0, 1.0 );
								#endif
							#endif
						#endif

						#ifdef USE_BUMPMAP
							// When we use particles there are no verts. So we need to calculate the vViewPosition
							// We do this by getting the vViewPosition and subtracting the point size
							#if defined(POINT_VERTS) && defined(USE_MAP)
								vec2 pointUv = vec2( 1.0 - gl_PointCoord.x, gl_PointCoord.y );
								vec2 pointFragDelta = ( pointUv * particleScale ) - ( pointUv * ( particleScale * 0.5 ) );
								vec3 pointFragPosition = vViewPosition +  vec3( pointFragDelta, 0.0 );
								normal = perturbNormalArb( -pointFragPosition, normalize( normal ), dHdxy_fwd( vUv, map, bumpScale ) );
								gl_FragColor.x = vec3_to_float( normal * 0.5 + 0.5 );
							#else
								normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd( vUv, bumpMap, bumpScale ) );
							#endif
						#endif

						// Normal in X (Must be between 0 and 1, hence the * 0.5 + 0.5, but remember to convert back on the other end )
						gl_FragColor.x = vec3_to_float( normal * 0.5 + 0.5 );
                	#endif

					// Translucency in Y
					${ShaderFragments.FragMain.packTranslucency()}

					// Depth in Z
					#ifdef POINT_VERTS
                		#ifdef USE_MAP
                			#ifdef SCREEN_UVS
                				gl_FragColor.z = uniformDepth - texelColor.a * normalizedRadius;
                			#else
                				gl_FragColor.z = vDepth;
                			#endif
                		#else
                			gl_FragColor.z = vDepth;
                		#endif
					#else
						gl_FragColor.z = vDepth;
					#endif

					// FREE, Opacity, shininess
					#ifdef POINT_VERTS
						#ifdef USE_MAP
							#ifdef SCREEN_UVS
								gl_FragColor.w = vec3_to_float( vec3( 0.0, opacityStrength * texelColor.a, shininess ) );
							#else
								gl_FragColor.w = vec3_to_float( vec3( 0.0, opacityStrength, shininess ) );
							#endif
						#else
							gl_FragColor.w = vec3_to_float( vec3( 0.0, opacityStrength, shininess ) );
						#endif
					#else
						#ifdef USE_MAP
							gl_FragColor.w = vec3_to_float( vec3( 0.0, opacityStrength * texelColor.a, shininess ) );
						#else
							gl_FragColor.w = vec3_to_float( vec3( 0.0, opacityStrength, shininess ) );
						#endif
					#endif
				#endif
				`;
            }
        }
    }
}