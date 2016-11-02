namespace Trike {
    export class CubeRenderer extends Object3D {
        public cubeTarget: RenderTargetCube;
        public passCollection: PassCollection;

        private _atmosphereCamPX: CameraPerspective;
        private _atmosphereCamNX: CameraPerspective;
        private _atmosphereCamPY: CameraPerspective;
        private _atmosphereCamNY: CameraPerspective;
        private _atmosphereCamPZ: CameraPerspective;
        private _atmosphereCamNZ: CameraPerspective;
        private _camArray: Array<CameraPerspective>;
        private _camRef: CameraPerspective | CameraCombined;

		/**
		* Creates an instance of the cube renderer
		* @param {number} width The width of the renderer cube texture
		* @param {number} height The height of the renderer cube texture
		* @param {TextureType} type The renderer cube texture type
		* @param {TextureWrapping} wrapS How the renderer cube texture wraps horizontally
		* @param {TextureWrapping} wrapT How the renderer cube texture wraps vertically
		* @param {TextureFilter} magFilter The filter to use when the renderer cube texture is magnified
		* @param {TextureFilter} minfFilter The filter to use when the renderer cube texture is minified
		* @param {TextureFormat} format The renderer cube texture format
		* @param {number} anisotropy Can improve the renderer cube texture quality. Higher values mean better quality textures (max 16 at this time).
		* @param {boolean} depthBuffer If true, this render target will maintain a depth buffers
		* @param {boolean} stencilBuffer If true, this render target will maintain a stencil buffers
		* @param {boolean} renderDepthToTexture If true, this render target will create a depth textures (Not well supported)
		*/
        constructor( width: number, height: number, type?: TextureType, wrapS?: TextureWrapping, wrapT?: TextureWrapping, magFilter: TextureFilter = TextureFilter.Linear, minFilter: TextureFilter = TextureFilter.NearestMipMapLinear, format?: TextureFormat, anisotropy: number = 1, depthBuffer: boolean = true, stencilBuffer: boolean = true, renderDepthToTexture: boolean = false ) {
            super();
            this.cubeTarget = new RenderTargetCube( width, height, type, wrapS, wrapT, magFilter, minFilter, format, anisotropy, depthBuffer, stencilBuffer, renderDepthToTexture );
            this.cubeTarget.generateMipmaps = true;
            this._camRef = null;

            this.passCollection = new PassCollection();
            this.passCollection.initialize( width, height );
            this.setupCameras();
        }

		/**
		* Resizes the mirror so that it uses
		* @param {number} val
		*/
        resize( val: number ) {
            this.passCollection.setSize( val, val );
            this.cubeTarget.resize( val, val )
        }

		/**
		* Activates a cube side and fetches the camera for drawing it.
		*/
        activateCamera( index: number ): Camera {
            const cubeTarget = this.cubeTarget;
            cubeTarget.activeCubeFace = index;
            if ( index === 0 ) return this._atmosphereCamPX;
            if ( index === 1 ) return this._atmosphereCamNX;
            if ( index === 2 ) return this._atmosphereCamPY;
            if ( index === 3 ) return this._atmosphereCamNY;
            if ( index === 4 ) return this._atmosphereCamPZ;
            if ( index === 5 ) return this._atmosphereCamNZ;
            return null;
        }

		/**
		* Cleans up the object for garbage collection
		*/
        dispose() {
            super.dispose();
            this.passCollection.dispose();
            this.cubeTarget.dispose();
            this._atmosphereCamPX.dispose();
            this._atmosphereCamNX.dispose();
            this._atmosphereCamPY.dispose();
            this._atmosphereCamNY.dispose();
            this._atmosphereCamPZ.dispose();
            this._atmosphereCamNZ.dispose();

            this.cubeTarget = null;
            this._atmosphereCamPX = null;
            this._atmosphereCamNX = null;
            this._atmosphereCamPY = null;
            this._atmosphereCamNY = null;
            this._atmosphereCamPZ = null;
            this._atmosphereCamNZ = null;
            this.passCollection = null;
            this._camArray = null;
            super.dispose();
        }

		/*
		* Called before the cube rendering process - updates the cameras to reflect the target's
		*/
        updateCameras() {
            const camera = this._camRef;
            if ( !camera ) return;

            if ( camera.disposed ) {
                this._camRef = null;
                return;
            }

            const cameras = this._camArray;
            for ( let i = 0, l = cameras.length; i < l; i++ ) {
                cameras[ i ].near = camera.near;
                cameras[ i ].far = camera.far;
                cameras[ i ].compositionMaterial.fogColor( camera.compositionMaterial.fogColor() );
                cameras[ i ].compositionMaterial.fogDensity( camera.compositionMaterial.fogDensity() );
                cameras[ i ].compositionMaterial.fogHeightDensity( camera.compositionMaterial.fogHeightDensity() );
                cameras[ i ].compositionMaterial.fogHeightMax( camera.compositionMaterial.fogHeightMax() );
                cameras[ i ].compositionMaterial.fogHeightMin( camera.compositionMaterial.fogHeightMin() );
                cameras[ i ].compositionMaterial.fogType( camera.compositionMaterial.fogType() );
                cameras[ i ].compositionMaterial.fogConvolver( camera.compositionMaterial.fogConvolver() );
            }
        }

		/*
		* Sets the camera reference from which the renderer gets its camera properties from. This is optional
		* but can be useful if the renderer is meant to have the same effects as an active camera
		* @param {CameraPerspective | CameraCombined} camera
		*/
        cameraReference( camera: CameraPerspective | CameraCombined ) {
            this._camRef = camera;
        }

		/*
		* Gets or sets the cameras far distance
		* @param {number} val [Optional]
		* @returns {number}
		*/
        far( val?: number ): number {
            if ( val === undefined ) return this._atmosphereCamPX.far;

            const cameras = this._camArray;
            for ( let i = 0, l = cameras.length; i < l; i++ )
                cameras[ i ].near = val;

            return val;
        }

		/*
		* Gets or sets the cameras near distance
		* @param {number} val [Optional]
		* @returns {number}
		*/
        near( val?: number ): number {
            if ( val === undefined ) return this._atmosphereCamPX.near;

            const cameras = this._camArray;
            for ( let i = 0, l = cameras.length; i < l; i++ )
                cameras[ i ].far = val;

            return val;
        }

		/*
		* Sets up the cameras for the cube rendering
		*/
        private setupCameras( near: number = 0.5, far: number = 20000 ) {
            this._atmosphereCamPX = new CameraPerspective( 90, 1, near, far );
            this._atmosphereCamPX.up.set( 0, -1, 0 );
            this._atmosphereCamPX.lookAt( new Vec3( 1, 0, 0 ) );
            this._atmosphereCamPX.updateWorldMatrix( true );
            this._atmosphereCamPX.updateProjectionMatrix();

            this._atmosphereCamNX = new CameraPerspective( 90, 1, near, far, this._atmosphereCamPX.passes );
            this._atmosphereCamNX.up.set( 0, -1, 0 );
            this._atmosphereCamNX.lookAt( new Vec3( -1, 0, 0 ) );
            this._atmosphereCamNX.updateWorldMatrix( true );
            this._atmosphereCamNX.updateProjectionMatrix();

            this._atmosphereCamPY = new CameraPerspective( 90, 1, near, far, this._atmosphereCamPX.passes );
            this._atmosphereCamPY.up.set( 0, 0, 1 );
            this._atmosphereCamPY.lookAt( new Vec3( 0, 1, 0 ) );
            this._atmosphereCamPY.updateWorldMatrix( true );
            this._atmosphereCamPY.updateProjectionMatrix();

            this._atmosphereCamNY = new CameraPerspective( 90, 1, near, far, this._atmosphereCamPX.passes );
            this._atmosphereCamNY.up.set( 0, 0, -1 );
            this._atmosphereCamNY.lookAt( new Vec3( 0, -1, 0 ) );
            this._atmosphereCamNY.updateWorldMatrix( true );
            this._atmosphereCamNY.updateProjectionMatrix();

            this._atmosphereCamPZ = new CameraPerspective( 90, 1, near, far, this._atmosphereCamPX.passes );
            this._atmosphereCamPZ.up.set( 0, -1, 0 );
            this._atmosphereCamPZ.lookAt( new Vec3( 0, 0, 1 ) );
            this._atmosphereCamPZ.updateWorldMatrix( true );
            this._atmosphereCamPZ.updateProjectionMatrix();

            this._atmosphereCamNZ = new CameraPerspective( 90, 1, near, far, this._atmosphereCamPX.passes );
            this._atmosphereCamNZ.up.set( 0, -1, 0 );
            this._atmosphereCamNZ.lookAt( new Vec3( 0, 0, -1 ) );
            this._atmosphereCamNZ.updateWorldMatrix( true );
            this._atmosphereCamNZ.updateProjectionMatrix();

            this.add( this._atmosphereCamPX );
            this.add( this._atmosphereCamNX );
            this.add( this._atmosphereCamPY );
            this.add( this._atmosphereCamNY );
            this.add( this._atmosphereCamPZ );
            this.add( this._atmosphereCamNZ );

            this._camArray = [ this._atmosphereCamPX,
            this._atmosphereCamNX,
            this._atmosphereCamPY,
            this._atmosphereCamNY,
            this._atmosphereCamPZ,
            this._atmosphereCamNZ ];

            const cameras = this._camArray;
            for ( let i = 0, l = cameras.length; i < l; i++ )
                cameras[ i ].compositionMaterial.toneMapper( ToneMapper.None );
        }
    }
}