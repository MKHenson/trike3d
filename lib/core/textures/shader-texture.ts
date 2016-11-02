namespace Trike {
	/**
	* An extended render target with a shader for drawing 2D textures
	*/
    export class ShaderTexture extends RenderTarget {
        public material: MaterialMulti;
        public requiresDraw: boolean;
        private _animated: boolean;

		/**
		* Creates an instance of the render target
		* @param {MaterialMulti} material The material to use when drawing this 2d shader
		* @param {number} width The width of this texture
		* @param {number} height The height of this texture
        * @param {boolean} animated If true, this texture will need to get updated each frame
		* @param {TextureType} type The texture type
		* @param {TextureWrapping} wrapS How the texture wraps horizontally
		* @param {TextureWrapping} wrapT How the texture wraps vertically
		* @param {TextureFilter} magFilter The filter to use when the texture is magnified
		* @param {TextureFilter} minfFilter The filter to use when the texture is minified
		* @param {TextureFormat} format The texture format
		* @param {number} anisotropy Can improve the texture quality. Higher values mean better quality textures (max 16 at this time).
		*/
        constructor( material: MaterialMulti, width: number, height: number, animated: boolean = true, type?: TextureType, wrapS: TextureWrapping = TextureWrapping.ClampToEdgeWrapping, wrapT: TextureWrapping = TextureWrapping.ClampToEdgeWrapping, magFilter: TextureFilter = TextureFilter.Nearest, minFilter: TextureFilter = TextureFilter.Nearest, format: TextureFormat = TextureFormat.RGBAFormat, anisotropy: number = 1 ) {
            super( width, height, type, wrapS, wrapT, magFilter, minFilter, format, anisotropy, false, false, false );
            this.generateMipmaps = true;
            this.material = material;
            this._animated = animated;
            this.requiresDraw = true;
        }

		/**
		* An update call made before the rendering process begins
		* @param {number} totalTime The total number of milliseconds since the start of the app
		* @param {number} delta The delta time since the last update call
		* @param {Camera} camera The camera being for the render
		* @param {Renderer} renderer The renderer used to draw the scene
		*/
        update( totalTime: number, delta: number, camera: Camera, renderer: Renderer ) {
            const mat = this.material.materials[ PassType.Texture ];
            if ( this._animated ) {
                if ( mat._uniforms[ 'timeConst' ] )
                    mat.setUniform( 'timeConst', mat._uniforms[ 'timeConst' ].value + 0.01, false );
                if ( mat._uniforms[ 'time' ] )
                    mat.setUniform( 'time', totalTime, false );
                if ( mat._uniforms[ 'timeDelta' ] )
                    mat.setUniform( 'delta', totalTime, false );
            }
        }

		/**
		* Cleans up the references and the queues the buffers for removal.
		*/
        dispose() {
            super.dispose();
        }


		/**
		* Resizes the target. Will require a re-compile
		* @param {number} width
		* @param {number} height
		*/
        resize( width, height ) {
            super.resize( width, height );

            const mat = this.material.materials[ PassType.Texture ];
            if ( mat._uniforms[ 'texelSize' ] )
                mat.setUniform( 'texelSize', mat._uniforms[ 'texelSize' ].value.set( 1 / width, 1 / height ), false );
            if ( mat._uniforms[ 'textureWidth' ] )
                mat.setUniform( 'textureWidth', width, false );
            if ( mat._uniforms[ 'textureHeight' ] )
                mat.setUniform( 'textureHeight', height, false );
            if ( mat._uniforms[ 'resolution' ] )
                mat.setUniform( 'resolution', new Vec2( width, height ), false );
        }

        /**
		* Gets if this texture is drawn each frame
		* @returns {boolean}
		*/
        get animated(): boolean { return this._animated; }

        /**
		* Sets if this texture is drawn each frame
		* @param {boolean} val
		*/
        set animated( val: boolean ) {
            if ( this._animated === val )
                return;

            this._animated = val;

            if ( val ) {
                this.material.addDefine( ShaderDefines.ANIMATED );
                this.requiresDraw = true;
            }
            else
                this.material.removeDefine( ShaderDefines.ANIMATED );
        }
    }
}