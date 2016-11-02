// namespace Trike {
//     export class CompressedTexture extends Texture {
//         constructor( image: any, mapping?: TextureMapping, wrapS?: TextureWrapping, wrapT?: TextureWrapping, magFilter?: TextureFilter, minFilter?: TextureFilter, format?: TextureFormat, type?: TextureType, anisotropy?: number ) {
//             super( image, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );
//         }

// 		/**
// 		* This function is called to fill the data of a webgl texture.
// 		*/
//         fillTextureBuffer( gl: WebGLRenderingContext, glFormat: number, glType: number, isImagePowerOfTwo: boolean, mipmaps: Array<any> ) {
//             let mipmap;
//             for ( let i = 0, il = mipmaps.length; i < il; i++ ) {
//                 mipmap = mipmaps[ i ];
//                 if ( this.format !== TextureFormat.RGBAFormat ) {
//                     gl.compressedTexImage2D( gl.TEXTURE_2D, i, glFormat, mipmap.width, mipmap.height, 0, mipmap.data );
//                 }
//                 else {
//                     gl.texImage2D( gl.TEXTURE_2D, i, glFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data );
//                 }
//             }
//         }
//     }
// }