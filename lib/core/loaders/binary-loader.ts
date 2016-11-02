namespace Trike {
	/**
	* Valid response codes for xhr binary requests
	*/
    export type BinaryLoaderResponses = 'binary_success' | 'binary_error';

	/**
	* Events associated with xhr binary requests
	*/
    export interface IBinaryLoaderEvent {
        buffer: ArrayBuffer;
        message: string | null;
    }


	/**
	* Class used to download contents from a server into an ArrayBuffer
	*/
    export class BinaryLoader extends EventDispatcher {
        private _xhr: XMLHttpRequest;
        private _onBuffers: any;
        private _onError: any;
        private _numTries;
        private _url;

		/**
		* Creates an instance of the Loader
		*/
        constructor() {
            super();
            this._xhr = null;
            this._url = '';
            this._onBuffers = this.onBuffersLoaded.bind( this );
            this._onError = this.onError.bind( this );
        }

		/**
		* This function will make a GET request and attempt to download a file into binary data
		* @param {string} url The URL we want to load
		* @param {number} numTries The number of attempts allowed to make this load
		*/
        load( url: string, numTries: number = 3 ) {
            this._numTries = numTries;
            this._url = url;
            this._xhr = new XMLHttpRequest();
            this._xhr.addEventListener( 'load', this._onBuffers, false );
            this._xhr.addEventListener( 'error', this._onError, false );
            this._xhr.withCredentials = true;

            const fullURL: string = url;
            this._xhr.open( 'GET', fullURL, true );
            this._xhr.responseType = 'arraybuffer';

            if ( this._xhr.overrideMimeType )
                this._xhr.overrideMimeType( 'text/plain; charset=x-user-defined' );

            this._xhr.send( null );
        }

		/**
		* If an error occurs
		*/
        onError( event ) {
            if ( this._numTries > 0 ) {
                if ( this._numTries > 0 )
                    this._numTries--;

                this._xhr.open( 'GET', this._url, true );
                this._xhr.send( null );
            }
            else {
                this.emit<BinaryLoaderResponses, IBinaryLoaderEvent>( 'binary_error', { buffer: null, message: 'Could not download data from \'' + this._url + '\'' });
                this.dispose();
            }
        }

		/**
		* Cleans up and removes references for GC
		*/
        dispose() {
            this._xhr.removeEventListener( 'load', this._onBuffers, false );
            this._xhr.removeEventListener( 'error', this._onError, false );
            this._xhr = null;
            super.dispose();
        }

		/**
		* Called when the buffers have been loaded
		*/
        onBuffersLoaded() {
            const xhr = this._xhr;
            let buffer: ArrayBuffer = xhr.response;

            // IEWEBGL needs this
            if ( buffer === undefined )
                buffer = ( new Uint8Array( xhr.response ) ).buffer;

            // Buffer not loaded, so manually fill it by converting the string data to bytes
            if ( buffer.byteLength === 0 ) {
                // iOS and other XMLHttpRequest level 1
                buffer = new ArrayBuffer( xhr.responseText.length );
                const bufView = new Uint8Array( buffer );

                for ( let i = 0, l = xhr.responseText.length; i < l; i++ )
                    bufView[ i ] = xhr.responseText.charCodeAt( i ) & 0xff;
            }

            this.emit<BinaryLoaderResponses, IBinaryLoaderEvent>( 'binary_success', { buffer: buffer, message: null });
            this.dispose();
        }
    }
}