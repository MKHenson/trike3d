namespace Trike {
	/**
	* Downsamples a cube texture
	* See
	* https://github.com/pyalot/WebGL-City-SSAO/blob/master/sky/downsample.shader
	*/
    export class MaterialCubeDownsample extends MaterialMulti {
        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.ScreenQuad ] = new PassMaterial( 'Downsampler', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'sampler', Trike.UniformType.TEXTURE_CUBE ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );
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
				const float start = ( ( 0.5 / size ) - 0.5 ) * 2.0;
				const float end = -start;
				const float incr = 2.0 / size;

				vec3 getWorldNormal( vec2 pos, vec2 dims )
				{
					vec2 frag_coord = pos / dims;
					frag_coord = ( frag_coord - 0.5 ) * 2.0;
					vec4 device_normal = vec4( frag_coord, 0.0, 1.0 );
					vec3 eye_normal = normalize( ( invProjMatrix * device_normal ).xyz );
					vec3 world_normal = normalize( ( invViewRot * vec4( eye_normal, 0.0 ) ).xyz );
					return world_normal;
				}

				vec4 sample(float xoff, float yoff)
				{
					vec2 off = gl_FragCoord.xy * 2.0 + vec2( xoff, yoff );
					vec3 normal = getWorldNormal( off, vec2( viewWidth, viewHeight ) * 2.0 );
					return sqrt( textureCube( sampler, normal ) );
				}

				void main()
				{
					vec4 color = (
						sample(-0.5, -0.5) +
						sample(-0.5, +0.5) +
						sample(+0.5, -0.5) +
						sample(+0.5, +0.5)
					) * 0.25;

					gl_FragColor = vec4( color.rgb, 1.0 );
				}`
        }
    }
}
