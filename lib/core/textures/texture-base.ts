namespace Trike {
    export type TextureLoaderEvents = 'texture_loader_complete' |
        'texture_loader_error' |
        'texture_loader_progress';

    export interface ITextureLoaderEvent {
        texture: TextureBase;
        progress: number;
        originalEvent: any;
        index?: number;
        previousImage: HTMLImageElement;
    }

	/**
	* Base class for all texture objects
	*/
    export class TextureBase extends EventDispatcher {
        public static defaultImage: HTMLImageElement;

        public format: TextureFormat;
        public wrapS: TextureWrapping;
        public wrapT: TextureWrapping;
        private _anisotropy: number;
        public type: TextureType;
        public minFilter: TextureFilter;
        public magFilter: TextureFilter;
        public webglTexture: WebGLTexture;
        public generateMipmaps: boolean;
        public requiresBuild: boolean;

        public width: number;
        public height: number;

		/**
		* Creates an instance of the TextureBase
		* @param {number} width The width of the texture
		* @param {number} height The height of the texture
		* @param {TextureMapping} mapping The mapping technique for this texture
		* @param {TextureWrapping} wrapS The S wrapping mode for the texture (horizontal)
		* @param {TextureWrapping} wrapT The T wrapping mode for the texture (vertical)
		* @param {TextureFilter} magFilter The filter to use when magnifying the image
		* @param {TextureFilter} minFilter The filter to use when minifying the image
		* @param {TextureFormat} format The texture format
		* @param {TextureType} type The texture type
		* @param {number} anisotropy Higher values give better results but are more expensive
		*/
        constructor( width: number, height: number, wrapS?: TextureWrapping, wrapT?: TextureWrapping, magFilter?: TextureFilter, minFilter?: TextureFilter, format?: TextureFormat, type?: TextureType, anisotropy?: number ) {
            super();

            // Create a red image as a temp
            if ( !TextureBase.defaultImage ) {
                TextureBase.defaultImage = document.createElement( 'img' );
                TextureBase.defaultImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAsSURBVDhPYzx8+DADNmBrawtloQImKE00GNVADGCE0hgAV/yMyFCitQYGBgCQcgVoJvPlYwAAAABJRU5ErkJggg==';
            }

            this.wrapS = wrapS !== undefined ? wrapS : TextureWrapping.MirroredRepeatWrapping;
            this.wrapT = wrapT !== undefined ? wrapT : TextureWrapping.MirroredRepeatWrapping;

            this.magFilter = magFilter !== undefined ? magFilter : TextureFilter.Linear;
            this.minFilter = minFilter !== undefined ? minFilter : TextureFilter.NearestMipMapLinear;

            this.anisotropy = anisotropy !== undefined ? anisotropy : 1;

            this.format = format !== undefined ? format : TextureFormat.RGBAFormat;
            this.type = type !== undefined ? type : TextureType.UnsignedByteType;

            this.generateMipmaps = true;
        }

        set anisotropy( val: number ) {
            this._anisotropy = val;
            this.requiresBuild = true;
        }
        get anisotropy(): number { return this._anisotropy; }


		/**
		* Gets the number of component slots of this texture. For example if the format is RGBA then its 4. If its RGB its 3.
		*/
        getNumberComponents(): number {
            //  http://books.google.co.uk/books?id=3c-jmWkLNwUC&pg=PA80&lpg=PA80&dq=Int16Array+gl&source=bl&ots=z-tp2x2DAd&sig=2YW_MZ5s8HysyJIhIwTmVjc7QpU&hl=en&sa=X&ei=OSgcVKrpHcmxggSYmYJY&ved=0CCkQ6AEwAQ#v=onepage&q=Int16Array%20gl&f=false
            //  PG 181
            //  Base Internal Format    red     green   blue    alpha   luminance
            //   --------------------    ---    -----   ----    -----   ---------
            //   ALPHA                   0       0       0        A
            //   LUMINANCE               0       0       0                R
            //   LUMINANCE_ALPHA         0       0       0        A       R
            //   RGB                     R       G       B
            //   RGBA                    R       G       B        A

            if ( this.format === TextureFormat.LuminanceAlphaFormat )
                return 2;
            else if ( this.format === TextureFormat.RGBFormat )
                return 3;
            else if ( this.format === TextureFormat.RGBAFormat )
                return 4;
            else
                return 1;
        }

		/**
		* Cleans up the references
		*/
        dispose() {
            super.dispose();
            Renderer.resoucesToRemove.push( this );

            this.format = null;
            this.wrapS = null;
            this.wrapT = null;
            this.type = null;
            this.minFilter = null;
            this.magFilter = null;
        }

		/**
		* Cleans up the references and frees the memory buffers
		*/
        destroyBuffers( gl: WebGLRenderingContext ) {
            if ( this.webglTexture )
                gl.deleteTexture( this.webglTexture );
            this.webglTexture = null;
        }
    }
}