namespace Trike {
	/**
	* Collects data about the graphics card and its abilities.
	*/
    export class Capabilities {
        private static _singleton: Capabilities;

        public glExtensionTextureFloat: any;
        public glExtensionTextureHalfFloat: any;
        public glExtensionTextureFloatLinear: any;
        public glExtensionTextureHalfFloatLinear: any;
        public glExtensionStandardDerivatives: any;
        public glExtensionTextureFilterAnisotropic: any;
        public glExtensionCompressedTextureS3TC: any;
        public glShaderPrecisionFormat: WebGLShaderPrecisionFormat;
        public vertexShaderPrecisionHighpFloat: WebGLShaderPrecisionFormat;
        public vertexShaderPrecisionMediumpFloat: WebGLShaderPrecisionFormat;
        public vertexShaderPrecisionLowpFloat: WebGLShaderPrecisionFormat;
        public fragmentShaderPrecisionHighpFloat: WebGLShaderPrecisionFormat;
        public fragmentShaderPrecisionMediumpFloat: WebGLShaderPrecisionFormat;
        public fragmentShaderPrecisionLowpFloat: WebGLShaderPrecisionFormat;
        public vertexShaderPrecisionHighpInt: WebGLShaderPrecisionFormat;
        public vertexShaderPrecisionMediumpInt: WebGLShaderPrecisionFormat;
        public vertexShaderPrecisionLowpInt: WebGLShaderPrecisionFormat;
        public fragmentShaderPrecisionHighpInt: WebGLShaderPrecisionFormat;
        public fragmentShaderPrecisionMediumpInt: WebGLShaderPrecisionFormat;
        public fragmentShaderPrecisionLowpInt: WebGLShaderPrecisionFormat;
        public depthTextureExt: any;
        public maxTextures: number;
        public maxVertexTextures: number;
        public maxTextureSize: number;
        public maxCubemapSize: number;
        public maxAnisotropy: number;
        public supportsVertexTextures: boolean;
        public supportsBoneTextures: boolean;
        public compressedTextureFormats: any;
        public precision: number;
        public uintIndices: number;

        public flagUnusedUniforms: boolean = true;

        constructor( gl: WebGLRenderingContext ) {
            Capabilities._singleton = this;
            let precision = 2;

            this.glExtensionTextureFloat = gl.getExtension( 'OES_texture_float' );
            this.glExtensionTextureFloatLinear = gl.getExtension( 'OES_texture_float_linear' );
            this.glExtensionTextureHalfFloat = gl.getExtension( 'OES_texture_half_float' );
            this.glExtensionTextureHalfFloatLinear = gl.getExtension( 'OES_texture_half_float_linear' );
            this.glExtensionStandardDerivatives = gl.getExtension( 'OES_standard_derivatives' );
            this.glExtensionTextureFilterAnisotropic = gl.getExtension( 'EXT_texture_filter_anisotropic' ) || gl.getExtension( 'MOZ_EXT_texture_filter_anisotropic' ) || gl.getExtension( 'WEBKIT_EXT_texture_filter_anisotropic' );
            this.glExtensionCompressedTextureS3TC = gl.getExtension( 'WEBGL_compressed_texture_s3tc' ) || gl.getExtension( 'MOZ_WEBGL_compressed_texture_s3tc' ) || gl.getExtension( 'WEBKIT_WEBGL_compressed_texture_s3tc' );

            if ( gl.getShaderPrecisionFormat === undefined ) {
                gl.getShaderPrecisionFormat = function() {
                    return {
                        'rangeMin': 1,
                        'rangeMax': 1,
                        'precision': 1
                    };
                }
            }

            this.maxTextures = gl.getParameter( gl.MAX_TEXTURE_IMAGE_UNITS );
            this.maxVertexTextures = gl.getParameter( gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS );
            this.maxTextureSize = gl.getParameter( gl.MAX_TEXTURE_SIZE );
            this.maxCubemapSize = gl.getParameter( gl.MAX_CUBE_MAP_TEXTURE_SIZE );
            this.maxAnisotropy = this.glExtensionTextureFilterAnisotropic ? gl.getParameter( this.glExtensionTextureFilterAnisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT ) : 0;
            this.supportsVertexTextures = ( this.maxVertexTextures > 0 );
            this.supportsBoneTextures = this.supportsVertexTextures && this.glExtensionTextureFloat;
            this.compressedTextureFormats = this.glExtensionCompressedTextureS3TC ? gl.getParameter( gl.COMPRESSED_TEXTURE_FORMATS ) : [];
            this.vertexShaderPrecisionHighpFloat = gl.getShaderPrecisionFormat( gl.VERTEX_SHADER, gl.HIGH_FLOAT );
            this.vertexShaderPrecisionMediumpFloat = gl.getShaderPrecisionFormat( gl.VERTEX_SHADER, gl.MEDIUM_FLOAT );
            this.vertexShaderPrecisionLowpFloat = gl.getShaderPrecisionFormat( gl.VERTEX_SHADER, gl.LOW_FLOAT );
            this.fragmentShaderPrecisionHighpFloat = gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.HIGH_FLOAT );
            this.fragmentShaderPrecisionMediumpFloat = gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT );
            this.fragmentShaderPrecisionLowpFloat = gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.LOW_FLOAT );
            this.vertexShaderPrecisionHighpInt = gl.getShaderPrecisionFormat( gl.VERTEX_SHADER, gl.HIGH_INT );
            this.vertexShaderPrecisionMediumpInt = gl.getShaderPrecisionFormat( gl.VERTEX_SHADER, gl.MEDIUM_INT );
            this.vertexShaderPrecisionLowpInt = gl.getShaderPrecisionFormat( gl.VERTEX_SHADER, gl.LOW_INT );
            this.fragmentShaderPrecisionHighpInt = gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.HIGH_INT );
            this.fragmentShaderPrecisionMediumpInt = gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.MEDIUM_INT );
            this.fragmentShaderPrecisionLowpInt = gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.LOW_INT );

            // Allows us to use uints for index buffers
            this.uintIndices = gl.getExtension( 'OES_element_index_uint' );

            // Check if we can render depth buffers to textures.
            this.depthTextureExt = gl.getExtension( 'WEBGL_depth_texture' );
            if ( !this.depthTextureExt ) {
                this.depthTextureExt = gl.getExtension( 'WEBKIT_WEBGL_depth_texture' );

                if ( !this.depthTextureExt )
                    this.depthTextureExt = gl.getExtension( 'MOZ_WEBGL_depth_texture' );
            }

            // Clamp precision to maximum available
            const highpAvailable = this.vertexShaderPrecisionHighpFloat.precision > 0 && this.fragmentShaderPrecisionHighpFloat.precision > 0;
            const mediumpAvailable = this.vertexShaderPrecisionMediumpFloat.precision > 0 && this.fragmentShaderPrecisionMediumpFloat.precision > 0;

            if ( precision === 2 && !highpAvailable ) {
                if ( mediumpAvailable )
                    precision = 1;
                else
                    precision = 0;
            }
            if ( precision === 1 && !mediumpAvailable )
                precision = 0;

            this.precision = precision;
        }

		/**
		* Gets the singleton of this class
		*/
        static getSingleton( gl?: WebGLRenderingContext ): Capabilities {
            if ( !Capabilities._singleton )
                new Capabilities( gl );

            return Capabilities._singleton;
        }
    }
}