namespace Trike {
	/**
	* Blurs the image depending on the distance of the pixel to the focal point
    * Based on http://artmartinsh.blogspot.com/2010/02/glsl-lens-blur-filter-with-bokeh.html
	*/
    export class MaterialBokeh extends MaterialMulti {
        constructor() {
            // Call the material base
            super( MultiMaterialOptions.None );

            this.materials[ PassType.ScreenQuad ] = new PassMaterial( 'Bokeh', this );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'gBuffer2', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'compositionPass', Trike.UniformType.TEXTURE ), true );
            this.addUniform( new UniformVar( 'maxBlur', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'aperture', Trike.UniformType.FLOAT, 0.025 ), true );
            this.addUniform( new UniformVar( 'focus', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'aspect', Trike.UniformType.FLOAT, 1 ), true );
            this.addUniform( new UniformVar( 'viewWidth', Trike.UniformType.FLOAT, 500 ), true );
            this.addUniform( new UniformVar( 'viewHeight', Trike.UniformType.FLOAT, 500 ), true );

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
                uniform float viewHeight;
				uniform float viewWidth;
                uniform sampler2D compositionPass;
                uniform sampler2D gBuffer2;
                uniform float maxBlur;
                uniform float aperture;
                uniform float focus;
                uniform float aspect;

				void main()
				{
                    ${ShaderFragments.FragMain.quadTexCoord()}
                    vec2 aspectcorrect = vec2( 1.0, aspect );
                    float depth = texture2D( gBuffer2, texCoord ).z;
                    float factor = depth - focus;
                    vec2 dofblur = vec2 ( clamp( factor * aperture, -maxBlur, maxBlur ) );
                    vec2 dofblur9 = dofblur * 0.9;
                    vec2 dofblur7 = dofblur * 0.7;
                    vec2 dofblur4 = dofblur * 0.4;
                    vec4 col = vec4( 0.0 );

                    col += texture2D( compositionPass, texCoord.xy );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur );

                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur9 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur9 );

                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur7 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur7 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur7 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur7 );

                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur4 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
                    col += texture2D( compositionPass, texCoord.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur4 );

                    gl_FragColor = col / 41.0;
                    gl_FragColor.a = 1.0;
				}`
        }
    }
}
