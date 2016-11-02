namespace Trike {
	/**
	* Creates an ocean object along with its ocean material
	*/
    export class Ocean extends ViewspaceGrid implements IMirrorMesh {
        public mirror: Mirror;

		/**
		* Creates an instance of the terrain class
		* @param {number} mirrorSize The texture size of the reflection mirror.
		* @param {number} drawDistance Determines how far off the terrain is drawn. Its recommended you use multiples of 2 as it can cause holes in the terrain if you don't
		* @param {number} levels The number of resolution levels. Closer levels are higher density mesh triangulations and far ones are less.
		* @param {number} resolution The resolution of the terrain tiles. This must be a multiple of 2. Anything lower than 16 or greater than 128 is not advisable.
		* @param {MaterialTerrain} material Optionally use a custom terrain shader
		*/
        constructor( mirrorSize: number = 512, drawDistance: number = 1024, levels: number = 6, resolution: number = 32 ) {
            super( new MaterialOcean( resolution, drawDistance ), drawDistance, levels, resolution );

            this.mirror = new Mirror( <IReflectiveMaterial><IMaterial>this.material, mirrorSize, mirrorSize );
            this.add( this.mirror );
            this.mirror.rotationX = MathUtils.degToRad( -90 );
        }

		/**
		* An update call made before the rendering process begins
		* @param {number} totalTime The total number of milliseconds since the start of the app
		* @param {number} delta The delta time since the last update call
		* @param {Camera} camera The camera being for the render
		* @param {Renderer} renderer The renderer used to draw the scene
		*/
        update( totalTime: number, delta: number, camera: Camera, renderer: Renderer ) {
            super.update( totalTime, delta, camera, renderer );
        }

		/**
		* If the texture is updated, we need to re-draw the context
		*/
        onHeightmapChanged( e: TextureLoaderEvents, event: ITextureLoaderEvent, sender?: EventDispatcher ) {
            super.onHeightmapChanged( e, event, sender );

            // Remove the previous heightfield size define
            if ( event && event.previousImage )
                ( <MaterialTerrain>this._material ).removeDefine( '#define HEIGHTFIELD_SIZE ' + event.previousImage.width.toFixed( 1 ) );

            ( <MaterialTerrain>this._material ).heightmap( <Texture>sender );
        }


		/**
		* Cleans up the terrain
		*/
        dispose() {
            ( <MaterialTerrain>this._material ).dispose();
            super.dispose();
        }
    }
}