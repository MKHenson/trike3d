namespace Trike {
	/**
	* A simple material used to draw lines
	*/
    export class MaterialLine extends MaterialMulti {
        private _dash: number;
        public lineWidth: number;

        constructor( color: Color = new Color( 0xffffff ), dashAmount: number = 0, lineWidth: number = 1 ) {
            // Call the material base
            super( MultiMaterialOptions.CreateDefaults );

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'modelViewMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'projectionMatrix', Trike.UniformType.MAT4 ), true );

            this.materials[ PassType.GBuffer ].addUniform( new UniformVar( 'emissive', Trike.UniformType.COLOR3, color ) );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );

            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'cameraFar', Trike.UniformType.FLOAT, 1000 ) );
            this.materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'opacity', Trike.UniformType.FLOAT, 1 ) );

            this.lineWidth = lineWidth;
            this._dash = 0;

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );

            // Must be called after defines as it adds a dash amount define
            this.dashCount( dashAmount );

            // Create the shaders
            this.setShaders( this.getVertexShader(), this.getFragmentShader() );
        }

		/**
		* Create the vertex shader
		* @returns {string}
		*/
        getVertexShader(): string {
            return `

				${ShaderFragments.VertParams.defaults()}
				${ShaderFragments.VertParams.dash()}

				void main()
				{
					${ShaderFragments.VertMain.defaults()}
					${ShaderFragments.VertMain.dash()}

					// We need to add the pass data
					${ShaderFragments.Passes.vertNormDepthMain()}
				}
			`
        }

		/**
		* Create the fragment shader
		* @returns {string}
		*/
        getFragmentShader(): string {
            return `

				${ShaderFragments.FragParams.defaults()}
				${ShaderFragments.FragParams.dashes()}
				${ShaderFragments.FragParams.vecToFloat()}
				${ShaderFragments.FragParams.encodeNormal()}
				#ifdef PASS_GBUFFER
				    uniform vec3  emissive;
				#endif

				void main()
				{

				    #ifdef PASS_GBUFFER
						${ShaderFragments.FragMain.dashes()}

						// We store the emmsive in w
						gl_FragColor.w = vec3_to_float( vec3( emissive.r, emissive.g, emissive.b ) );
						gl_FragColor.x = 0.0;
						gl_FragColor.y = 0.0;
						gl_FragColor.z = vec3_to_float( vec3( 1.0, 1.0, 1.0 ) );
				    #endif

					#ifdef PASS_GBUFFER2
						float shininess = 0.0;
					#endif
					${ShaderFragments.Passes.fragNormDepthMain()}
				}
			`
        }

		/*
		* Gets or sets the dash count
		* @param {number} val [Optional]
		* @returns {number}
		*/
        dashCount( val?: number ): number {
            if ( val === undefined )
                return this._dash;

            if ( this._dash > 0 && val > 0 ) {
                this._dash = val;
                this.setUniform( 'dashAmount', val, true );
                return val;
            }
            if ( this._dash === 0 && val > 0 ) {
                this._dash = val;
                this.addUniform( new UniformVar( 'dashAmount', UniformType.FLOAT, val ) );
                this.addAttribute( new AttributeVar( 'distance', AttributeType.CUSTOM_1 ) );
                this.addDefine( ShaderDefines.DASHED );
            }
            else {
                this._dash = 0;
                this.removeUniform( 'dashAmount' );
                this.removeAttribute( AttributeType.CUSTOM_1 );
                this.removeDefine( ShaderDefines.DASHED );
            }

            return val;
        }

		/*
		* Gets or sets emissive light colour
		* @param {number} val [Optional]
		* @returns {number}
		*/
        emissive( val?: Color ): Color {
            if ( val === undefined )
                return this.materials[ PassType.GBuffer ]._uniforms[ 'emissive' ].value;

            this.materials[ PassType.GBuffer ].setUniform( 'emissive', val, false );
            return val;
        }

		/*
		* Gets or sets the opacity of this material. The values are from 0 to 1.
		* @param {number} val
		*/
        opacity( val: number ): number {
            if ( val === undefined ) return this.materials[ PassType.GBuffer2 ]._uniforms[ 'opacity' ].value;

            this.materials[ PassType.GBuffer2 ].setUniform( 'opacity', val, false );
            return val;
        }
    }
}