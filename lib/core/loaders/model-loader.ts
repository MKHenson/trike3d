namespace Trike {
    export type ModelLoadEvents = 'model_loader_complete' |
        'model_loader_error' |
        'model_loader_start' |
        'model_loader_progress';

    export interface IModelLoadEvent {
        percent: number;
        message: string | null;
        geometry: Geometry | null;
    }

	/**
	* Abstract loader class for all other loaders.
	*/
    export class ModelLoader extends EventDispatcher {
        public crossOrigin: string;
        public useCredentials: boolean;

        constructor( useCredentials: boolean = true ) {
            super();
            this.crossOrigin = null;
            this.useCredentials = useCredentials;
        }

        load( url: string, geometry?: Geometry ): ModelLoader {
            throw new Error( 'Must be overriden in child classes' );
        }

		/**
		* Once the data has been loaded, subsequent classes must parse the load content
		* @returns {Geometry}
		*/
        onParse( data: any, xhr: XMLHttpRequest ): Geometry { return null; }

		/**
		* Load an XHR Request.
		*/
        xhrLoad( url: string ) {
            const that = this;
            const xhr = new XMLHttpRequest();
            xhr.open( 'GET', url, true );

            // Add events
            xhr.addEventListener( 'load', ( ev: any ) => {
                const geom: Geometry = that.onParse( xhr.responseText, xhr );
                this.emit<ModelLoadEvents, IModelLoadEvent>( 'model_loader_complete', { geometry: geom, message: 'Load Complete [' + that.extractFilename( url ) + ']', percent: 100 });

            }, false );

            // Errors
            xhr.addEventListener( 'error', ( ev: ErrorEvent ) => {
                this.emit<ModelLoadEvents, IModelLoadEvent>( 'model_loader_error', { geometry: null, message: null, percent: 0 });

            }, false );

            // Progress
            xhr.addEventListener( 'progress', ( ev: ProgressEvent ) => {
                this.emit<ModelLoadEvents, IModelLoadEvent>( 'model_loader_progress', { geometry: null, message: null, percent: ev.loaded / ev.total });

            }, false );

            // We must use credentials if using SSL
            xhr.withCredentials = this.useCredentials;

            // Start the download
            xhr.send( null );
        }



		/**
		* Gets the URL directory without the filename
		*/
        extractUrlBase( url: string ): string {
            const parts = url.split( '/' );

            if ( parts.length === 1 )
                return './';

            parts.pop();
            return parts.join( '/' ) + '/';
        }

		/**
		* Gets the file name of a URL
		*/
        extractFilename( url: string ): string {
            const parts = url.split( '/' );

            return parts[ parts.length - 1 ];
        }

		/**
		* Cleanup
		*/
        dispose() {
            super.dispose();
        }
    }
}