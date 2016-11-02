namespace Trike {
    export class NoiseTexture extends DataTexture {
        constructor( width: number = 1024 ) {
            const size = width * width;
            const data = new Uint8Array( size );

            // Zero out height data
            for ( let i = 0; i < size; i++ )
                data[ i ] = 0;

            const perlin = new ImprovedNoise();
            let quality = 1;
            const z = Math.random() * 100;

            // Do several passes to get more detail
            for ( let iteration = 0; iteration < 4; iteration++ ) {
                for ( let i = 0; i < size; i++ ) {
                    const x = i % width;
                    const y = Math.floor( i / width );
                    data[ i ] += Math.abs( perlin.getNoise( x / quality, y / quality, z ) * quality );
                }
                quality *= 5;
            }

            super( data, width, width, TextureFormat.AlphaFormat, TextureType.UnsignedByteType );
        }

		/**
		* This function is called to fill the data of a webgl texture.
		*/
        fillTextureBuffer( gl: WebGLRenderingContext, glFormat: number, glType: number, isImagePowerOfTwo: boolean, mipmaps: Array<any> ) {
            super.fillTextureBuffer( gl, glFormat, glType, isImagePowerOfTwo, mipmaps );
        }
    }
}