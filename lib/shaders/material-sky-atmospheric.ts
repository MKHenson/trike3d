namespace Trike {
	/**
	* This is an advanced shader that programmatically draws a planet atmosphere and its interactions with
	* a sun. In Trike this shader is used in the SkyboxAtmospheric class. Because the shader is an expensive one
	* to use, the skybox uses it only when it needs to. The shader takes in camera information and draws the
	* atmosphefogColorre onto a plane. The skybox creates a cube texture and gets the shader to draw each of the sides.
	* This drawn texture can then be used on the skybox as a day time texture.
	*/
    export class MaterialSkyAtmospheric extends MaterialMulti {
        public uniformUpdated: boolean;

        constructor( nightColor: Color = new Color( 0x3E4B61 ) ) {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.Albedo ] = new PassMaterial( 'Atmospheric Pass', this );
            this.uniformUpdated = true;

            this.addUniform( new UniformVar( 'modelViewMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'projectionMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'modelMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'luminance', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'turbidity', Trike.UniformType.FLOAT, 2 ), true );
            this.addUniform( new UniformVar( 'reileigh', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'mieCoefficient', Trike.UniformType.FLOAT, 0.005 ), true );
            this.addUniform( new UniformVar( 'mieDirectionalG', Trike.UniformType.FLOAT, 0.98 ), true );
            this.addUniform( new UniformVar( 'alpha', Trike.UniformType.FLOAT, 50 ), true );
            this.addUniform( new UniformVar( 'sunPosition', Trike.UniformType.FLOAT3, new Vec3() ), true );
            this.addUniform( new UniformVar( 'nightColor', Trike.UniformType.COLOR3, nightColor ), true );
            this.addUniform( new UniformVar( 'earthAmbience', Trike.UniformType.COLOR3, new Color( 0x241A11 ) ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );
            this.addDefine( ShaderDefines.GAMA_INPUT );

            // Create the shaders
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
				uniform mat4 modelMatrix;
				varying vec3 vWorldPosition;

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
				uniform vec3 sunPosition;
				varying vec3 vWorldPosition;
				vec3 cameraPos = vec3(0., 0., 0.);

				uniform float luminance;
				uniform float turbidity;
				uniform float reileigh;
				uniform float mieCoefficient;
				uniform float mieDirectionalG;
				uniform float alpha;
				uniform vec3 earthAmbience;

				uniform vec3 nightColor;
				#ifdef NIGHT_MAP
					uniform samplerCube night;
					uniform vec4 quatNight;
				#endif

				// Horizon fog haze
				#ifdef FOG
					uniform float fogMin;
					uniform float fogMax;
					uniform vec3 fogColor;
				#endif

				vec3 sunDirection = normalize(sunPosition);
				float reileighCoefficient = reileigh;

				// constants for atmospheric scattering
				const float e = 2.71828182845904523536028747135266249775724709369995957;
				const float pi = 3.141592653589793238462643383279502884197169;

				const float n = 1.0003; // refractive index of air
				const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)
				const float pn = 0.035;	// depolatization factor for standard air

				// wavelength of used primaries, according to preetham
				const vec3 lambda = vec3(680E-9, 550E-9, 450E-9);

				// K coefficient for the primaries
				const vec3 K = vec3(0.686, 0.678, 0.666);
				const float v = 4.0;

				// optical length at zenith for molecules
				const float rayleighZenithLength = 8.4E3;
				const float mieZenithLength = 1.25E3;
				const vec3 up = vec3(0.0, 1.0, 0.0);

				const float EE = 1000.0;
				const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324; // 66 arc seconds -> degrees, and the cosine of that

				// Earth shadow hack
				const float cutoffAngle = pi/1.95;
				const float steepness = 1.5;

				vec3 totalRayleigh(vec3 lambda)
				{
					return (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn));
				}

				// see http://blenderartists.org/forum/showthread.php?321110-Shaders-and-Skybox-madness
				// A simplied version of the total Reayleigh scattering to works on browsers that use ANGLE
				vec3 simplifiedRayleigh()
				{
					return 0.0005 / vec3(94, 40, 18);
				}

				float rayleighPhase(float cosTheta)
				{
					return (3.0 / (16.0*pi)) * (1.0 + pow(cosTheta, 2.0));
				}

				vec3 totalMie(vec3 lambda, vec3 K, float T)
				{
					float c = (0.2 * T ) * 10E-18;
					return 0.434 * c * pi * pow((2.0 * pi) / lambda, vec3(v - 2.0)) * K;
				}

				float hgPhase(float cosTheta, float g)
				{
					return (1.0 / (4.0*pi)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0*g*cosTheta + pow(g, 2.0), 1.5));
				}

				float sunIntensity(float zenithAngleCos)
				{
					return EE * max(0.0, 1.0 - exp(-((cutoffAngle - acos(zenithAngleCos))/steepness)));
				}

				void main()
				{
					#if defined(NIGHT_MAP) || defined(FOG)
						float flipNormal = ( -1.0 + 2.0 * float( gl_FrontFacing ) );
					#endif

					// Used for fog calculations
					vec3 eyedir = normalize(vWorldPosition.xyz);
					eyedir = ( eyedir + 1.0 ) * 0.5;
					float yPosition = eyedir.y;

					float sunfade = 1.0-clamp( 1.0 - exp( ( sunPosition.y / 450000.0 )), 0.0, 1.0);
					reileighCoefficient = reileighCoefficient - ( 1.0 * ( 1.0 - sunfade ));
					float sunE = sunIntensity( dot(sunDirection, up) );

					// extinction (absorbtion + out scattering)
					// rayleigh coefficients
					vec3 betaR = simplifiedRayleigh() * reileighCoefficient;

					// mie coefficients
					vec3 betaM = totalMie(lambda, K, turbidity) * mieCoefficient;

					// optical length
					// cutoff angle at 90 to avoid singularity in next formula.
					float zenithAngle = acos( max( 0.0, dot( up, normalize( vWorldPosition - cameraPos ))));
					float sR = rayleighZenithLength / (cos( zenithAngle ) + 0.15 * pow( 93.885 - (( zenithAngle * 180.0) / pi ), -1.253 ));
					float sM = mieZenithLength / (cos( zenithAngle ) + 0.15 * pow( 93.885 - (( zenithAngle * 180.0) / pi ), -1.253 ));

					// combined extinction factor
					vec3 Fex = exp(-( betaR * sR + betaM * sM ));

					// in scattering
					float cosTheta = dot( normalize( vWorldPosition - cameraPos ), sunDirection );

					float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
					vec3 betaRTheta = betaR * rPhase;

					float mPhase = hgPhase( cosTheta, mieDirectionalG );
					vec3 betaMTheta = betaM * mPhase;

					vec3 Lin = pow( sunE * ( ( betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex), vec3(1.5) );
					Lin *= mix(vec3( 1.0 ),pow( sunE * ( (betaRTheta + betaMTheta) / (betaR + betaM) ) * Fex,vec3(1.0/2.0)),clamp( pow( 1.0 - dot( up, sunDirection ), 5.0 ), 0.0, 1.0));

					vec3 direction = normalize(vWorldPosition - cameraPos);
					float theta = acos(direction.y); // elevation --> y-axis, [-pi/2, pi/2]
					float phi = atan(direction.z, direction.x); // azimuth --> x-axis [-pi/2, pi/2]
					vec2 uv = vec2(phi, theta) / vec2(2.0*pi, pi) + vec2(0.5, 0.0);
					vec3 L0 = vec3(0.1) * Fex;

					// composition + solar disc
					float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
					L0 += ( sunE * 19000.0 * Fex ) * sundisk;

					vec3 texColor = ( Lin + L0 );
					texColor *= 0.04 ;
					texColor += vec3( 0.0, 0.001, 0.0025 ) * 0.3;

					float g_fMaxLuminance = 1.0;
					float fLumScaled = 0.1 / luminance;
					float fLumCompressed = ( fLumScaled * (1.0 + (fLumScaled / (g_fMaxLuminance * g_fMaxLuminance))) ) / (1.0 + fLumScaled);

					float ExposureBias = fLumCompressed;

					vec3 gamaColor = ( log2( 2.0 / pow( luminance, 4.0 ))) * texColor;

					#ifdef NIGHT_MAP
						vec3 cubeNormNight = vec3( flipNormal * vWorldPosition.x, vWorldPosition.yz );

						// Rotate the normal using a quaternian
						cubeNormNight = cubeNormNight + 2.0 * cross( cross( cubeNormNight, quatNight.xyz ) + quatNight.w * cubeNormNight, quatNight.xyz );
						vec4 finalNightColor = textureCube( night, cubeNormNight );
						#if defined(GAMA_INPUT)
							finalNightColor.xyz = finalNightColor.xyz * finalNightColor.xyz;
						#endif

						finalNightColor.xyz = finalNightColor.xyz * nightColor.xyz;

					#else
						vec4 finalNightColor = vec4( nightColor.xyz, 1.0 );
					#endif

					// Night Fog
					#ifdef FOG
						vec3 fColor = fogColor * fogColor;
						float fogAmount = ( 1.0 - smoothstep( fogMin, fogMax, yPosition) );
						finalNightColor.xyz = mix( finalNightColor.xyz, fColor, fogAmount );
					#endif

					vec3 color = gamaColor;
					vec4 finalDayColor = vec4(color, 1.0);
					float alphaMix = 1.0 - smoothstep( 0.0, 1.0, length(gamaColor) * alpha );

					// Defines the 'earth/horizon fog'
					finalDayColor.xyz = mix( finalDayColor.xyz, earthAmbience, ( 1.0 - smoothstep( 0.1, 0.55, yPosition) ) );

					//	Blend the day and night colors
					gl_FragColor.xyz = mix( finalDayColor, finalNightColor, alphaMix ).xyz;
					gl_FragColor.a = 1.0;
				}
			`;
        }
    }
}